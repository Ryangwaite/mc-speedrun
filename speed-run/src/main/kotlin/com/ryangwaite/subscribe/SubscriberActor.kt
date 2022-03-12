package com.ryangwaite.subscribe

import com.ryangwaite.connection.ConnectionManagerMsg
import com.ryangwaite.connection.ForwardMsgToAll
import com.ryangwaite.connection.ForwardMsgToHost
import com.ryangwaite.connection.ForwardMsgToParticipant
import com.ryangwaite.models.Answerer
import com.ryangwaite.models.HostQuestionSummary
import com.ryangwaite.models.ParticipantQuestionSummary
import com.ryangwaite.models.VerboseQuestionSummary
import com.ryangwaite.protocol.*
import com.ryangwaite.redis.IDataStore
import kotlinx.coroutines.*
import kotlinx.coroutines.channels.SendChannel
import kotlinx.coroutines.channels.actor
import kotlinx.coroutines.flow.collect
import kotlinx.datetime.Clock
import kotlinx.datetime.Instant
import kotlinx.serialization.decodeFromString
import kotlinx.serialization.json.Json
import org.slf4j.LoggerFactory
import kotlin.math.roundToInt
import kotlin.system.measureTimeMillis

data class Subscription(
    var numberOfClients: Int, // Count of how many clients depend on this subscription
    val flowProcessor: Job
)

fun CoroutineScope.subscriberActor(datastore: IDataStore, subscriber: ISubscribe, connectionManager: SendChannel<ConnectionManagerMsg>) = actor<SubscriptionActorMsg> {

    val LOG = LoggerFactory.getLogger("SubscriberActor")

    // key = quizId, value = Subscription
    val subscriptions = mutableMapOf<String, Subscription>()

    suspend fun processNotification(quizId: String, payload: String) {
        val msg = Json.decodeFromString<SubscriptionMessages>(payload)
        LOG.info("Received '${msg.name}' for quizId '$quizId' from redis pub/sub")
        when (msg) {
            SubscriptionMessages.`LEADERBOARD-UPDATED` -> {
                val leaderboard = datastore.getLeaderboard(quizId)
                connectionManager.send(ForwardMsgToAll(quizId, LeaderboardMsg(leaderboard)))
            }
            SubscriptionMessages.`NOTIFY-HOST-QUIZ-SUMMARY` -> {
                var questionSummary: List<VerboseQuestionSummary>
                val summaryBuildTime = measureTimeMillis {
                    questionSummary = datastore.getQuizSummary(quizId)
                }
                LOG.debug("Computed quiz summary in $summaryBuildTime ms")

                val answerDurations = mutableListOf<Int>()

                val hostQuestionSummary = questionSummary.map {

                    // Only interested in the durations for non-timed out questions
                    answerDurations.addAll(it.correctAnswerers.map { it.answeredInDuration })
                    answerDurations.addAll(it.incorrectAnswerers.map { it.answeredInDuration })

                    HostQuestionSummary(
                        it.question,
                        it.options,
                        it.correctOptions,
                        it.correctAnswerers.map { Answerer(it.userId, it.name) },
                        it.incorrectAnswerers.map { Answerer(it.userId, it.name) },
                        it.timeExpiredAnswerers.map { Answerer(it.userId, it.name) },
                    )
                }

                val avgAnswerTimeMillis = if (answerDurations.size > 0) (answerDurations.average() * 1000).roundToInt() else 0
                val totalTimeElapsed = Clock.System.now().epochSeconds - datastore.getQuizStartTime(quizId).epochSeconds

                connectionManager.send(ForwardMsgToHost(quizId, NotifyHostQuizSummaryMsg(
                    totalTimeElapsed,
                    avgAnswerTimeMillis,
                    hostQuestionSummary
                )))
            }
            SubscriptionMessages.`QUIZ-STARTED` -> {
                val startTime = datastore.getQuizStartTime(quizId).epochSeconds
                val duration = datastore.getQuestionDuration(quizId)
                val numberOfQuestions = datastore.getSelectedQuestionIndexes(quizId).size
                connectionManager.send(ForwardMsgToAll(quizId, BroadcastStartMsg(startTime, duration, numberOfQuestions)))
            }
            SubscriptionMessages.`QUIZ-FINISHED` -> {
                val questionSummary = datastore.getQuizSummary(quizId)
                val userIds = datastore.getUserIds(quizId)
                // Formulate and send a unique quiz summary message to the connection manager for each userId in the quiz
                val jobs = userIds.map { userId ->
                    launch {
                        val answerDurations = mutableListOf<Int>()
                        val participantQuestionSummary = questionSummary.map {
                            val participantAnswer = (it.correctAnswerers + it.incorrectAnswerers + it.timeExpiredAnswerers).first {
                                it.userId == userId
                            }

                            // Only calculate the durations for questions that were answered and not timed out
                            if (!it.timeExpiredAnswerers.contains(participantAnswer)) {
                                answerDurations.add(participantAnswer.answeredInDuration)
                            }

                            ParticipantQuestionSummary(
                                it.question,
                                it.options,
                                it.correctOptions,
                                participantAnswer.participantOptions,
                                it.correctAnswerers.map { Answerer(it.userId, it.name) },
                                it.incorrectAnswerers.map { Answerer(it.userId, it.name) },
                                it.timeExpiredAnswerers.map { Answerer(it.userId, it.name) },
                            )
                        }
                        val totalElapsedTime = datastore.getParticipantStopTime(quizId, userId).epochSeconds - datastore.getQuizStartTime(quizId).epochSeconds
                        val avgAnswerTime = if (answerDurations.size > 0) (answerDurations.average() * 1000).roundToInt() else 0
                        connectionManager.send(ForwardMsgToParticipant(quizId, userId, NotifyParticipantQuizSummaryMsg(
                            totalElapsedTime,
                            avgAnswerTime,
                            participantQuestionSummary
                        )))
                    }
                }
                jobs.joinAll()

                // Let everyone know that the quiz has ended
                connectionManager.send(ForwardMsgToAll(quizId, BroadcastQuizFinishedMsg()))
            }
            SubscriptionMessages.`PARTICIPANT-FINISHED` -> {
                val userIds = datastore.getUserIds(quizId)
                val numCompleted = coroutineScope {
                    userIds.map {
                        async {
                            datastore.isParticipantFinished(quizId, it)
                        }
                    }.awaitAll().filter { it }.size
                }
                connectionManager.send(ForwardMsgToAll(quizId, BroadcastParticipantFinishedMsg(numCompleted)))
            }
        }
    }

    for (msg: SubscriptionActorMsg in channel) {
        when (msg) {
            is AddSubscription -> {
                val quizId = msg.quizId
                LOG.info("Adding subscription for quiz '$quizId'")
                if (!subscriptions.containsKey(quizId)) {
                    val flowProcessorJob = launch {
                        val flow = subscriber.subscribeToQuizEvents(quizId)
                        flow.collect {
                            processNotification(quizId, it)
                        }
                    }
                    subscriptions[quizId] = Subscription(0, flowProcessorJob)
                }
                subscriptions[quizId]!!.numberOfClients++
            }
            is RemoveSubscription -> {
                val quizId = msg.quizId
                LOG.info("Removing subscription for quiz $quizId")
                if (!subscriptions.containsKey(quizId)) {
                    LOG.error("Failed to remove subscription for quiz '$quizId'. There's no subscriptions to remove from.")
                    continue
                }
                subscriptions[quizId]!!.numberOfClients--
                if (subscriptions[quizId]!!.numberOfClients == 0) {
                    subscriptions[quizId]!!.flowProcessor.cancelAndJoin()
                    subscriptions.remove(quizId)
                }
            }
        }
    }
}
package com.ryangwaite.subscribe

import com.ryangwaite.connection.ConnectionManagerMsg
import com.ryangwaite.connection.ForwardMsgToAll
import com.ryangwaite.connection.ForwardMsgToHost
import com.ryangwaite.loader.QuizLoader
import com.ryangwaite.models.HostQuestionSummary
import com.ryangwaite.protocol.BroadcastLeaderboardMsg
import com.ryangwaite.protocol.NotifyHostQuizSummaryMsg
import com.ryangwaite.redis.IDataStore
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Job
import kotlinx.coroutines.cancelAndJoin
import kotlinx.coroutines.channels.SendChannel
import kotlinx.coroutines.channels.actor
import kotlinx.coroutines.flow.collect
import kotlinx.coroutines.launch
import kotlinx.serialization.decodeFromString
import kotlinx.serialization.json.Json
import org.slf4j.LoggerFactory
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
                connectionManager.send(ForwardMsgToAll(quizId, BroadcastLeaderboardMsg(leaderboard)))
            }
            SubscriptionMessages.`NOTIFY-HOST-QUIZ-SUMMARY` -> {
                var hostSummary: List<HostQuestionSummary>
                val summaryBuildTime = measureTimeMillis {
                    hostSummary = datastore.getHostQuizSummary(quizId)
                }
                LOG.debug("Computed host summary in $summaryBuildTime ms")
                connectionManager.send(ForwardMsgToHost(quizId, NotifyHostQuizSummaryMsg(
                    10, // Todo: calculate this from start time
                    hostSummary
                )))
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
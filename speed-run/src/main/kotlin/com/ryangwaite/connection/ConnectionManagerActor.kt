package com.ryangwaite.connection

import com.ryangwaite.loader.QuizLoader
import com.ryangwaite.notify.NotificationActorMsg
import com.ryangwaite.notify.QuizComplete
import com.ryangwaite.protocol.*
import com.ryangwaite.redis.IDataStore
import com.ryangwaite.score.calculateAnswerScore
import com.ryangwaite.subscribe.SubscriptionMessages
import io.ktor.websocket.*
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.ObsoleteCoroutinesApi
import kotlinx.coroutines.channels.SendChannel
import kotlinx.coroutines.channels.actor
import kotlinx.coroutines.launch
import kotlinx.datetime.Clock
import kotlinx.serialization.decodeFromString
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import org.slf4j.LoggerFactory

private val LOG = LoggerFactory.getLogger("ConnectionManagerActor")

@ObsoleteCoroutinesApi
fun CoroutineScope.connectionManagerActor(datastore: IDataStore, publisher: IPublish,  notifier: SendChannel<NotificationActorMsg>) = actor<ConnectionManagerMsg> {

    /**
     * IMPORTANT: All operations on the 'connections' map itself must be performed
     * directly in this coroutine scope to avoid race conditions. The contained
     * Connection data structures are thread-safe and so multiple coroutines can
     * access concurrently.
     */
    val connections = mutableMapOf<String /*quizId*/, MutableList<Connection>>()

    /**
     * Adds the connection
     */
    fun addConnection(connection: Connection) {
        when (connection) {
            is HostConnection -> LOG.info("Added host connection for quiz '${connection.quizId}'")
            is ParticipantConnection -> LOG.info("Added participant connection for quiz '${connection.quizId}' with userId '${connection.userId}'")
        }
        if (!connections.containsKey(connection.quizId)) {
            connections[connection.quizId] = mutableListOf()
        }
        connections[connection.quizId]!!.add(connection)
        LOG.debug("Connections: $connections")
    }

    /**
     * Utility method for child coroutines to signal to this actor to remove the connection
     */
    suspend fun sendRemoveConnection(connection: Connection) {
        this@actor.channel.send(RemoveConnection(connection))
    }

    for (msg: ConnectionManagerMsg in this@actor.channel) {
        when (msg) {
            is NewConnection -> {
                val connection = msg.connection
                LOG.info("Received new connection for quiz '${connection.quizId}'")
                addConnection(connection)

                val job = launch {
                    // If this connection is a participant, let them know the current leaderboard.
                    // This allows them to know the other users in the quiz before their name is entered
                    // NOTE: This send() in here blocks the caller, hence it's done in this coroutinescope as opposed to
                    //       directly in the Actors scope
                    val userId = (msg.connection as? ParticipantConnection)?.userId
                    if (userId != null) {
                        val quizId = msg.connection.quizId
                        val leaderboard = datastore.getLeaderboard(quizId)
                        channel.send(ForwardMsgToParticipant(quizId, userId, LeaderboardMsg(leaderboard)))
                    }

                    // Setup processing of all websocket inbound packets for this connection
                    try {
                        for (frame in connection.socketSession.incoming) {
                            frame as? Frame.Text ?: continue
                            val packet = frame.readText()
                            processInboundClientPacket(datastore, publisher, notifier, connection, packet)
                        }
                    } finally {
                        sendRemoveConnection(connection)
                    }
                }
            }
            is RemoveConnection -> {
                // Make sure this connection actually exists
                val connection = msg.connection
                LOG.info("Received remove connection for quiz '${connection}'")
                if (!connections.getOrDefault(connection.quizId, mutableListOf()).contains(connection)) {
                    LOG.error("Tried to remove connection that doesn't exist: $connection")
                }

                // Close the connection and signal to the ktor websocket route that this connections closed
                connection.close(CloseReason(CloseReason.Codes.NORMAL, "You sent 'bye'"))

                connections[connection.quizId]!!.removeIf { it == connection }
                if (connections[connection.quizId]!!.isEmpty()) {
                    connections.remove(connection.quizId)
                }
                LOG.debug("Connections: $connections")
            }
            is ForwardMsgToAll -> {
                LOG.info("Forwarding packet '${msg.msgToForward::class.simpleName}' to all clients of quiz '${msg.quizId}'")
                // NOTE: Not using connection.send(...) here to avoid serializing the packet with every send
                val serializedPacket = Json.encodeToString(Packet.encapsulate(msg.msgToForward))
                // Let all clients (all participants and host) know the content
                connections[msg.quizId]!!.forEach { connection ->
                    connection.socketSession.outgoing.send(Frame.Text(serializedPacket))
                }
            }
            is ForwardMsgToHost -> {
                LOG.info("Forwarding packet '${msg.msgToForward::class.simpleName}' to host of quiz '${msg.quizId}'")
                for (connection in connections[msg.quizId]!!) { // NOTE: This is fine while there's only one instance of the service
                    if (connection is HostConnection) {
                        connection.send(msg.msgToForward)
                        break
                    }
                }
            }
            is ForwardMsgToParticipant -> {
                val userId = msg.userId
                val packetName = msg.msgToForward::class.simpleName
                LOG.info("Forwarding packet '$packetName' to participant '${userId}' of quiz '${msg.quizId}'")
                var msgForwarded = false
                for (connection in connections[msg.quizId]!!) {
                    if (connection is ParticipantConnection && connection.userId == userId) {
                        connection.send(msg.msgToForward)
                        msgForwarded = true
                        break
                    }
                }
                if (msgForwarded) {
                    LOG.info("Successfully forwarded packet '$packetName' to participant '$userId'")
                } else {
                    LOG.warn("Couldn't find connection for userId '$userId'. Assuming another speed-run instance has the connection and forwarded packet '$packetName'")
                }
            }
        }
    }
}

/**
 * Processes the inbound packet from the client websocket
 */
suspend fun processInboundClientPacket(datastore: IDataStore, publisher: IPublish,  notifier: SendChannel<NotificationActorMsg>, wsConnection: Connection, packet: String) {
    val deserializedPacket = Json.decodeFromString<Packet>(packet)
    val quizId = wsConnection.quizId
    when (val payload = deserializedPacket.payload) {
        is ParticipantConfigMsg -> {
            val userId = (wsConnection as ParticipantConnection).userId
            LOG.info("Received configuration message from user '$userId'")
            datastore.apply {
                addUserId(quizId, userId)
                setUsername(quizId, userId, payload.name)
                setLeaderboardItem(quizId, userId, 0)
            }
            publisher.publishQuizEvent(quizId, SubscriptionMessages.`LEADERBOARD-UPDATED`)
        }
        is RequestHostQuestionsMsg -> {
            LOG.info("Received request for host questions for quiz '$quizId'")
            val questionsAndAnswers = QuizLoader.load(quizId)
            wsConnection.send(ResponseHostQuestionsMsg(questionsAndAnswers))
            LOG.info("Responded to host with questions for quiz '$quizId'")
        }
        is HostConfigMsg -> {
            LOG.info("Received host configuration for quiz '$quizId'")
            val (quizName, categories, duration, selectedQuestionIndexes) = payload
            datastore.setQuizName(quizId, quizName)
            datastore.setSelectedCategories(quizId, categories)
            datastore.setQuestionDuration(quizId, duration)
            datastore.setSelectedQuestionIndexes(quizId, selectedQuestionIndexes)
            datastore.setQuizStartTime(quizId, Clock.System.now())

            LOG.info("Starting quiz '$quizId'")
            publisher.publishQuizEvent(quizId, SubscriptionMessages.`QUIZ-STARTED`)
        }
        is RequestParticipantQuestionMsg -> {
            val userId = (wsConnection as ParticipantConnection).userId
            val clientQuestionIndex = payload.questionIndex
            LOG.info("Received request for question ${clientQuestionIndex + 1} from user '$userId' of quiz '$quizId'")
            val selectedQuestionIndexes = datastore.getSelectedQuestionIndexes(quizId)
            val nextSelectedQuestionIndex = selectedQuestionIndexes[clientQuestionIndex]
            val nextQuestion = QuizLoader.load(quizId)[nextSelectedQuestionIndex]

            wsConnection.send(ResponseParticipantQuestionMsg(
                clientQuestionIndex,
                nextQuestion.question,
                nextQuestion.options,
                nextQuestion.answers.size,
            ))
            LOG.info("Sent question ${clientQuestionIndex + 1} to user '$userId' of quiz '$quizId'")
        }
        is ParticipantAnswerMsg -> {
            val userId = (wsConnection as ParticipantConnection).userId
            val (clientQuestionIndex, pariticipantOptionIndexes, answeredInDuration) = payload

            LOG.info("Received answer for question ${clientQuestionIndex + 1} from user '$userId' of quiz '$quizId'")

            // Map the index from the client to that in the original set
            val selectedQuestionIndexes = datastore.getSelectedQuestionIndexes(quizId)
            val selectedQuestionIndex = selectedQuestionIndexes[clientQuestionIndex]

            datastore.setParticipantAnswer(quizId, userId, selectedQuestionIndex, pariticipantOptionIndexes, answeredInDuration)

            // Calculate question score
            val maxTimeToAnswer = datastore.getQuestionDuration(quizId)
            val qAndAnswers = QuizLoader.load(quizId)[selectedQuestionIndex]
            val questionScore = calculateAnswerScore(qAndAnswers.answers, pariticipantOptionIndexes, maxTimeToAnswer, answeredInDuration)
            val currentScore = datastore.getUserScore(quizId, userId)

            LOG.info("User '$userId' of quiz '$quizId' scored $questionScore points for question ${clientQuestionIndex + 1}")

            // Update score
            datastore.setLeaderboardItem(quizId, userId, currentScore + questionScore)

            // Broadcast the new leaderboard to everyone in the quiz
            publisher.publishQuizEvent(quizId, SubscriptionMessages.`LEADERBOARD-UPDATED`)
            publisher.publishQuizEvent(quizId, SubscriptionMessages.`NOTIFY-HOST-QUIZ-SUMMARY`)

            if (datastore.isParticipantFinished(quizId, userId)) {
                datastore.setParticipantStopTime(quizId, userId, Clock.System.now())
                publisher.publishQuizEvent(quizId, SubscriptionMessages.`PARTICIPANT-FINISHED`)
            }

            if (datastore.isQuizFinished(quizId)) {
                datastore.setQuizStopTime(quizId, Clock.System.now())
                publisher.publishQuizEvent(quizId, SubscriptionMessages.`QUIZ-FINISHED`)
                notifier.send(QuizComplete(quizId))
            }
        }
        is ParticipantAnswerTimeoutMsg -> {
            val userId = (wsConnection as ParticipantConnection).userId
            val (clientQuestionIndex) = payload

            LOG.info("User '$userId' of quiz '$quizId' failed to answer question ${clientQuestionIndex + 1} in time")

            // Map the index from the client to that in the original set
            val selectedQuestionIndexes = datastore.getSelectedQuestionIndexes(quizId)
            val selectedQuestionIndex = selectedQuestionIndexes[clientQuestionIndex]

            // Store the answer with a duration outside the valid range for an answer. This is the indication that it was overtime.
            val maxTimeToAnswer = datastore.getQuestionDuration(quizId)
            datastore.setParticipantAnswer(quizId, userId, selectedQuestionIndex, listOf(), maxTimeToAnswer + 1)

            // Let the host know the result - this doesn't affect the leaderboard scores
            publisher.publishQuizEvent(quizId, SubscriptionMessages.`NOTIFY-HOST-QUIZ-SUMMARY`)

            if (datastore.isParticipantFinished(quizId, userId)) {
                datastore.setParticipantStopTime(quizId, userId, Clock.System.now())
                publisher.publishQuizEvent(quizId, SubscriptionMessages.`PARTICIPANT-FINISHED`)
            }

            if (datastore.isQuizFinished(quizId)) {
                datastore.setQuizStopTime(quizId, Clock.System.now())
                publisher.publishQuizEvent(quizId, SubscriptionMessages.`QUIZ-FINISHED`)
                notifier.send(QuizComplete(quizId))
            }
        }
        else -> LOG.error("Unknown packet received: $packet")
    }
}
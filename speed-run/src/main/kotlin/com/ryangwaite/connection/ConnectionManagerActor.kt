package com.ryangwaite.connection

import com.ryangwaite.loader.QuizLoader
import com.ryangwaite.models.HostQuestionSummary
import com.ryangwaite.protocol.*
import com.ryangwaite.redis.IDataStore
import com.ryangwaite.subscribe.SubscriptionMessages
import io.ktor.http.cio.websocket.*
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.channels.actor
import kotlinx.coroutines.launch
import kotlinx.serialization.decodeFromString
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json

fun CoroutineScope.connectionManagerActor(datastore: IDataStore, publisher: IPublish) = actor<ConnectionManagerMsg> {

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
        if (!connections.containsKey(connection.quizId)) {
            connections[connection.quizId] = mutableListOf()
        }
        connections[connection.quizId]!!.add(connection)
        println("Connections: $connections")
    }

    /**
     *
     */
    suspend fun sendRemoveConnection(connection: Connection) {
        this.channel.send(RemoveConnection(connection))
    }

    suspend fun processInboundClientPacket(connection: Connection, packet: String) {
        val deserializedPacket = Json.decodeFromString<Packet>(packet)
        when (val payload = deserializedPacket.payload) {
            is ParticipantConfigMsg -> {
                val (_, _, quizId, userId) = (connection as ParticipantConnection)
                datastore.apply {
                    setUsername(quizId, userId!!, payload.name)
                    addLeaderboardItem(quizId, userId, 0)
                }
                publisher.publishQuizEvent(quizId, SubscriptionMessages.`LEADERBOARD-UPDATED`)
            }
            is RequestHostQuestionsMsg -> {
                val questionsAndAnswers = QuizLoader.load(connection.quizId)
                connection.send(ResponseHostQuestionsMsg(questionsAndAnswers))
            }
            is RequestHostQuizSummaryMsg -> {
                val questionsAndAnswers = QuizLoader.load(connection.quizId)
                val hostQuestions = questionsAndAnswers.map {
                    val (question: String, category: String, options: List<String>, answers: List<Int>,) = it
                    HostQuestionSummary(
                        question, options, correctOptions = answers,
                        // TODO: store and retrieve all of these from redis
                        correctAnswerers = listOf(), incorrectAnswerers = listOf(), timeExpiredAnswerers = listOf()
                    )
                }
                connection.send(ResponseHostQuizSummaryMsg(
                    0, // TODO: store and retrieve from redis
                    hostQuestions
                ))
            }
            is HostConfigMsg -> {
                val (quizName, categories, duration, selectedQuestionIndexes) = payload
                val quizId = connection.quizId
                datastore.setQuizName(quizId, quizName)
                datastore.setSelectedCategories(quizId, categories)
                datastore.setQuestionDuration(quizId, duration)
                datastore.setSelectedQuestionIndexes(quizId, selectedQuestionIndexes)

                // Start the quiz
                channel.send(ForwardMsg(quizId, BroadcastStartMsg(duration)))
            }
            else -> println("Unknown packet received: $packet")
        }
    }

    for (msg: ConnectionManagerMsg in channel) {
        when (msg) {
            is NewConnection -> {
                val connection = msg.connection
                println("Received connection for ${connection.quizId}")
                addConnection(connection)

                val job = launch {
                    try {
                        for (frame in connection.socketSession.incoming) {
                            frame as? Frame.Text ?: continue
                            val packet = frame.readText()
                            processInboundClientPacket(connection, packet)
                        }
                    } finally {
                        sendRemoveConnection(connection)
                        println("Job finished")
                    }
                }
            }
            is RemoveConnection -> {
                // Make sure this connection actually exists
                val connection = msg.connection
                if (!connections.getOrDefault(connection.quizId, mutableListOf()).contains(connection)) {
                    println("Error: Tried to remove connection that doesn't exist: $connection")
                }

                // Close the connection and signal to the ktor websocket route that this connections closed
                connection.socketSession.close(CloseReason(CloseReason.Codes.NORMAL, "You sent 'bye'"))
                connection.websocketCloseFuture.complete(null)

                connections[connection.quizId]!!.removeIf { it == connection }
                if (connections[connection.quizId]!!.isEmpty()) {
                    connections.remove(connection.quizId)
                }
                println("Connections: $connections")
            }
            is ForwardMsg -> {
                println("Forwarding packet: ${msg.msgToForward}")
                // NOTE: Not using connection.send(...) here to avoid serializing the packet with every send
                val serializedPacket = Json.encodeToString(Packet.encapsulate(msg.msgToForward))
                // Let all clients (all participants and host) know the content
                connections[msg.quizId]!!.forEach { connection ->
                    connection.socketSession.outgoing.send(Frame.Text(serializedPacket))
                }
            }
        }
    }

}
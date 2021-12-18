package com.ryangwaite.connection

import com.ryangwaite.loader.QuizLoader
import com.ryangwaite.models.HostQuestionSummary
import com.ryangwaite.protocol.*
import com.ryangwaite.redis.IDataStore
import com.ryangwaite.score.calculateAnswerScore
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
        val quizId = connection.quizId
        when (val payload = deserializedPacket.payload) {
            is ParticipantConfigMsg -> {
                val userId = (connection as ParticipantConnection).userId
                datastore.apply {
                    setUsername(quizId, userId!!, payload.name)
                    setLeaderboardItem(quizId, userId, 0)
                }
                publisher.publishQuizEvent(quizId, SubscriptionMessages.`LEADERBOARD-UPDATED`)
            }
            is RequestHostQuestionsMsg -> {
                val questionsAndAnswers = QuizLoader.load(quizId)
                connection.send(ResponseHostQuestionsMsg(questionsAndAnswers))
            }
            is RequestHostQuizSummaryMsg -> {
                val questionsAndAnswers = QuizLoader.load(quizId)
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
                datastore.setQuizName(quizId, quizName)
                datastore.setSelectedCategories(quizId, categories)
                datastore.setQuestionDuration(quizId, duration)
                datastore.setSelectedQuestionIndexes(quizId, selectedQuestionIndexes)

                // Start the quiz
                channel.send(ForwardMsg(quizId, BroadcastStartMsg(duration, selectedQuestionIndexes.size)))
            }
            is RequestParticipantQuestionMsg -> {
                val clientQuestionIndex = payload.questionIndex
                val selectedQuestionIndexes = datastore.getSelectedQuestionIndexes(quizId)
                val nextSelectedQuestionIndex = selectedQuestionIndexes[clientQuestionIndex]
                val nextQuestion = QuizLoader.load(quizId)[nextSelectedQuestionIndex]

                connection.send(ResponseParticipantQuestionMsg(
                    clientQuestionIndex,
                    nextQuestion.question,
                    nextQuestion.options,
                    nextQuestion.answers.size,
                ))
            }
            is ParticipantAnswerMsg -> {
                val userId = (connection as ParticipantConnection).userId
                val (clientQuestionIndex, pariticipantOptionIndexes, answeredInDuration) = payload

                // Map the index from the client to that in the original set
                val selectedQuestionIndexes = datastore.getSelectedQuestionIndexes(quizId)
                val selectedQuestionIndex = selectedQuestionIndexes[clientQuestionIndex]

                datastore.setParticipantAnswer(quizId, userId, selectedQuestionIndex, pariticipantOptionIndexes, answeredInDuration)

                // Calculate question score
                val maxTimeToAnswer = datastore.getQuestionDuration(quizId)
                val qAndAnswers = QuizLoader.load(quizId)[selectedQuestionIndex]
                val questionScore = calculateAnswerScore(qAndAnswers.answers, pariticipantOptionIndexes, maxTimeToAnswer, answeredInDuration)
                val currentScore = datastore.getUserScore(quizId, userId)

                println("Updating '$userId' score. Question ${clientQuestionIndex + 1} scored $questionScore")

                // Update score
                datastore.setLeaderboardItem(quizId, userId, currentScore + questionScore)

                // Broadcast the new leaderboard to everyone in the quiz
                publisher.publishQuizEvent(quizId, SubscriptionMessages.`LEADERBOARD-UPDATED`)
            }
            is ParticipantAnswerTimeoutMsg -> {
                val userId = (connection as ParticipantConnection).userId
                val (clientQuestionIndex) = payload

                // Map the index from the client to that in the original set
                val selectedQuestionIndexes = datastore.getSelectedQuestionIndexes(quizId)
                val selectedQuestionIndex = selectedQuestionIndexes[clientQuestionIndex]

                // Store the answer with a duration outside the valid range for an answer. This is the indication that it was overtime.
                val maxTimeToAnswer = datastore.getQuestionDuration(quizId)
                datastore.setParticipantAnswer(quizId, userId, selectedQuestionIndex, listOf(), maxTimeToAnswer + 1)

                println("Marked user '$userId' response to question ${clientQuestionIndex + 1} as timeout")
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
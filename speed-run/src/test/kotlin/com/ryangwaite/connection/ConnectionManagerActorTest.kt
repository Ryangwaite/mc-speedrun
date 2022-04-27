package com.ryangwaite.connection

import com.ryangwaite.loader.QuizLoader
import com.ryangwaite.models.LeaderboardItem
import com.ryangwaite.models.QuestionAndAnswers
import com.ryangwaite.notify.NotificationActorMsg
import com.ryangwaite.notify.QuizComplete
import com.ryangwaite.protocol.*
import com.ryangwaite.redis.IDataStore
import com.ryangwaite.redis.MockDataStore
import com.ryangwaite.redis.ParticipantAnswer
import com.ryangwaite.score.calculateAnswerScore
import com.ryangwaite.subscribe.SubscriptionMessages
import io.ktor.websocket.*
import io.mockk.*
import io.mockk.impl.annotations.RelaxedMockK
import io.mockk.junit5.MockKExtension
import kotlinx.coroutines.*
import kotlinx.coroutines.channels.Channel
import kotlinx.coroutines.channels.ReceiveChannel
import kotlinx.coroutines.channels.SendChannel
import kotlinx.coroutines.test.runTest
import kotlinx.datetime.Clock
import kotlinx.serialization.decodeFromString
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import org.junit.jupiter.api.extension.ExtendWith
import java.io.File
import kotlin.coroutines.CoroutineContext
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertTrue

/**
 * Collection of helper methods for working with test Websocket connections.
 */
class WebsocketConnectionScope(private val context: CoroutineContext) {
    /**
     * Builds a host connection within the provided coroutine context
     */
    fun buildHostConnection(quizId: String) = HostConnection(
        MockSocketSession(context),
        CompletableDeferred(context.job),
        quizId,
    )

    /**
     * Builds a participant connection with the provided coroutine context and user ID
     */
    fun buildParticipantConnection(quizId: String, userId: String) = ParticipantConnection(
        MockSocketSession(context),
        CompletableDeferred(context.job),
        quizId, userId
    )

    /**
     * Sends the packet from the host or participant connection to the ConnectionManagerActor
     */
    suspend fun sendFromConnectionToActor(connection: Connection, packet: Packet) {
        val sendCh = connection.socketSession.incoming as Channel<Frame.Text>
        sendCh.send(Frame.Text(Json.encodeToString(packet)))
    }

    /**
     * Returns the first unreceived packet from the connection that was sent by the
     * ConnectionManagerActor
     */
    suspend fun receiveActorSentPktFromConnection(connection: Connection): Packet {
        val frame = (connection.socketSession.outgoing as ReceiveChannel<*>).receive() as Frame.Text
        val frameContent = frame.readText()
        return Json.decodeFromString(frameContent)
    }

    /**
     * Returns the first unreceived packet from the connection that was sent by the
     * ConnectionManagerActor. If it fails to within the allocated time then throws
     * a [TimeoutCancellationException]
     */
    suspend fun receiveActorSentPktFromConnectionWithTimeout(connection: Connection): Packet = withTimeout(10) {
        val frame = (connection.socketSession.outgoing as ReceiveChannel<*>).receive() as Frame.Text
        val frameContent = frame.readText()
        Json.decodeFromString(frameContent)
    }

    /**
     * Returns all unreceived packets from the connection that was sent by the
     * ConnectionManagerActor. Waits for timeout on a receive to indicate the
     * end of the batch.
     */
    suspend fun receiveAllActorSentPktsFromConnectionWithTimeout(connection: Connection): List<Packet> {
        val packets = mutableListOf<Packet>()
        while (true) {
            try {
                val packet = receiveActorSentPktFromConnectionWithTimeout(connection)
                packets.add(packet)
            } catch (e: TimeoutCancellationException) {
                return packets
            }
        }
    }

    /**
     * Closes the incoming channel and waits for the websockets close future
     * to be resolved.
     */
    suspend fun cleanupConnections(vararg connections: Connection) {
        connections.forEach {
            (it.socketSession.incoming as Channel).close()
            it.websocketCloseFuture.await()
        }
    }
}

/**
 * Scope with testing utilities for websocket connections
 */
suspend fun websocketConnectionScope(context: CoroutineContext, block: suspend WebsocketConnectionScope.() -> Unit) {
    val scope = WebsocketConnectionScope(context) // Create receiver object...
    scope.block()                             // ... and pass it to the lambda
}

@ObsoleteCoroutinesApi
@ExperimentalCoroutinesApi
@ExtendWith(MockKExtension::class)
class ConnectionManagerActorTest {

    private val datastore: IDataStore = MockDataStore("../sample-quizzes/example-1.json")

    @RelaxedMockK
    lateinit var publisher: IPublish

    lateinit var notifierSendChannel: SendChannel<NotificationActorMsg>

    @BeforeEach
    fun beforeEach() {
        notifierSendChannel = Channel<NotificationActorMsg>()
    }

    @AfterEach
    fun afterEach() {
        notifierSendChannel.close()
    }

    /**
     * Tests that when the user first connects and is prompted to enter their username,
     * the leaderboard list of all currently joined participants is returned.
     */
    @Test
    fun `Adding new connection receives leaderboard msg of all joined participant connections`() = runTest {
        val quizId = "quizid1"
        websocketConnectionScope(coroutineContext) {
            // Setup
            val connectionManagerCh = connectionManagerActor(datastore, publisher, notifierSendChannel)
            val hostConnection = buildHostConnection(quizId)
            connectionManagerCh.send(NewConnection(hostConnection))
            val joinedUserId = "joineduser"
            val joinedUserName = "joinedusername"
            val joinedParticipantConnection = buildParticipantConnection(quizId, joinedUserId)
            connectionManagerCh.send(NewConnection(joinedParticipantConnection))
            val configPkt = Packet(ProtocolMsg.Type.`PARTICIPANT-CONFIG`, ParticipantConfigMsg(joinedUserName))
            sendFromConnectionToActor(joinedParticipantConnection, configPkt)
            val lobbyParticipantConnection = buildParticipantConnection(quizId, "lobbyuser")
            connectionManagerCh.send(NewConnection(lobbyParticipantConnection))

            // Assert
            coVerify(exactly = 1) {publisher.publishQuizEvent(quizId, SubscriptionMessages.`LEADERBOARD-UPDATED`)} // from joined participant
            val actualLobbyPkt = receiveActorSentPktFromConnection(lobbyParticipantConnection)
            assertEquals(Packet(ProtocolMsg.Type.LEADERBOARD, LeaderboardMsg(
                listOf(LeaderboardItem(joinedUserId, joinedUserName, 0))
            )), actualLobbyPkt)

            // Teardown
            cleanupConnections(hostConnection, joinedParticipantConnection, lobbyParticipantConnection)
            connectionManagerCh.close() // NOTE: Must appear last to prevent test from hanging
        }
    }

    @Test
    fun `ForwardMsgToHost sends the msg to the host connection only`() = runTest {
        val quizId = "quizid1"
        websocketConnectionScope(coroutineContext) {
            // Setup
            val connectionManagerCh = connectionManagerActor(datastore, publisher, notifierSendChannel)
            val hostConnection = buildHostConnection(quizId)
            connectionManagerCh.send(NewConnection(hostConnection))
            val participantConnection = buildParticipantConnection(quizId, "userid")
            connectionManagerCh.send(NewConnection(participantConnection))
            val configPkt = Packet(ProtocolMsg.Type.`PARTICIPANT-CONFIG`, ParticipantConfigMsg("username"))
            sendFromConnectionToActor(participantConnection, configPkt)

            // Send msg for host only
            val forwardMsg = NotifyHostQuizSummaryMsg(0, 0, listOf())
            connectionManagerCh.send(ForwardMsgToHost(quizId, forwardMsg))

            // Assert
            val actualHostPkt = receiveActorSentPktFromConnectionWithTimeout(hostConnection)
            assertEquals(Packet(ProtocolMsg.Type.`NOTIFY-HOST-QUIZ-SUMMARY`, forwardMsg), actualHostPkt)
            receiveActorSentPktFromConnectionWithTimeout(participantConnection) // receive the first and only msg which is a leaderboard update
            assertThrows<TimeoutCancellationException> { receiveActorSentPktFromConnectionWithTimeout(participantConnection) }

            // Teardown
            cleanupConnections(hostConnection, participantConnection)
            connectionManagerCh.close() // NOTE: Must appear last to prevent test from hanging
        }
    }

    @Test
    fun `ForwardMsgToParticipant sends the msg to specific participant only`() = runTest {
        val quizId = "quizid1"
        websocketConnectionScope(coroutineContext) {
            // Setup
            val connectionManagerCh = connectionManagerActor(datastore, publisher, notifierSendChannel)
            val hostConnection = buildHostConnection(quizId)
            connectionManagerCh.send(NewConnection(hostConnection))
            val participantConnections = (1..2).map {
                val connection = buildParticipantConnection(quizId, "userid$it")
                connectionManagerCh.send(NewConnection(connection))
                val configPkt = Packet(ProtocolMsg.Type.`PARTICIPANT-CONFIG`, ParticipantConfigMsg("username$it"))
                sendFromConnectionToActor(connection, configPkt)
                connection
            }

            // Send msg to first participant only
            val forwardMsg = LeaderboardMsg(listOf())
            connectionManagerCh.send(ForwardMsgToParticipant(quizId, "userid1", forwardMsg))

            // Assert
            val participant1Pkts = receiveAllActorSentPktsFromConnectionWithTimeout(participantConnections[0])
            val participant2Pkts = receiveAllActorSentPktsFromConnectionWithTimeout(participantConnections[1])
            val hostPkts = receiveAllActorSentPktsFromConnectionWithTimeout(hostConnection)
            val expectedPkt = Packet(ProtocolMsg.Type.LEADERBOARD, forwardMsg)
            assertTrue { expectedPkt in participant1Pkts }
            assertFalse { expectedPkt in participant2Pkts }
            assertFalse { expectedPkt in hostPkts }

            // Teardown
            cleanupConnections(hostConnection, *participantConnections.toTypedArray())
            connectionManagerCh.close() // NOTE: Must appear last to prevent test from hanging
        }
    }

    @Test
    fun `ForwardMsgToAll sends the msg to all participants and host`() = runTest {
        val quizId = "quizid1"
        websocketConnectionScope(coroutineContext) {
            // Setup
            val connectionManagerCh = connectionManagerActor(datastore, publisher, notifierSendChannel)
            val hostConnection = buildHostConnection(quizId)
            connectionManagerCh.send(NewConnection(hostConnection))
            val participantConnections = (1..2).map {
                val connection = buildParticipantConnection(quizId, "userid$it")
                connectionManagerCh.send(NewConnection(connection))
                val configPkt = Packet(ProtocolMsg.Type.`PARTICIPANT-CONFIG`, ParticipantConfigMsg("username$it"))
                sendFromConnectionToActor(connection, configPkt)
                connection
            }

            // Send msg to first participant only
            val forwardMsg = LeaderboardMsg(listOf())
            connectionManagerCh.send(ForwardMsgToAll(quizId, forwardMsg))

            // Assert
            val participant1Pkts = receiveAllActorSentPktsFromConnectionWithTimeout(participantConnections[0])
            val participant2Pkts = receiveAllActorSentPktsFromConnectionWithTimeout(participantConnections[1])
            val hostPkts = receiveAllActorSentPktsFromConnectionWithTimeout(hostConnection)
            val expectedPkt = Packet(ProtocolMsg.Type.LEADERBOARD, forwardMsg)
            assertTrue { expectedPkt in participant1Pkts }
            assertTrue { expectedPkt in participant2Pkts }
            assertTrue { expectedPkt in hostPkts }

            // Teardown
            cleanupConnections(hostConnection, *participantConnections.toTypedArray())
            connectionManagerCh.close() // NOTE: Must appear last to prevent test from hanging
        }
    }
}

@ExperimentalCoroutinesApi
@ExtendWith(MockKExtension::class)
class ProcessInboundClientPacketTest {
    private val quizFile = "../sample-quizzes/example-1.json"
    private var datastore: MockDataStore = MockDataStore(quizFile)

    @RelaxedMockK
    lateinit var publisher: IPublish

    lateinit var notifierSendChannel: Channel<NotificationActorMsg>

    @BeforeEach
    fun beforeEach() {
        notifierSendChannel = Channel(10)
    }

    @AfterEach
    fun afterEach() {
        notifierSendChannel.close()
    }

    @Test
    fun `Processing ParticipantConfigMsg sets userId, username and leaderboard for participant`() = runTest {
        websocketConnectionScope(coroutineContext) {
            val quizId = "quizid1"
            val userId = "userid1"
            val username = "username"
            val participantConnection = buildParticipantConnection(quizId, userId)
            val serializedPkt = Json.encodeToString(Packet(
                ProtocolMsg.Type.`PARTICIPANT-CONFIG`,
                ParticipantConfigMsg(username)
            ))

            processInboundClientPacket(datastore, publisher, notifierSendChannel, participantConnection, serializedPkt)

            assertTrue{ userId in datastore.getUserIds(quizId) }
            assertTrue { LeaderboardItem(userId, username, 0) in datastore.getLeaderboard(quizId)}
            coVerify(exactly = 1) { publisher.publishQuizEvent(quizId, SubscriptionMessages.`LEADERBOARD-UPDATED`) }

            // Cleanup
            participantConnection.websocketCloseFuture.complete(null)
        }
    }

    @Test
    fun `Processing RequestHostQuestionsMsg returns all questions for host`() = runTest {
        websocketConnectionScope(coroutineContext) {
            val quizId = "quizid1"
            val hostConnection = buildHostConnection(quizId)
            val serializedPkt = Json.encodeToString(Packet(
                ProtocolMsg.Type.`REQUEST-HOST-QUESTIONS`,
                RequestHostQuestionsMsg()
            ))
            val expectedQuestionAndAnswers: List<QuestionAndAnswers> = Json.decodeFromString(File(quizFile).readText())
            mockkObject(QuizLoader)
            every { QuizLoader.load(any()) } returns expectedQuestionAndAnswers

            processInboundClientPacket(datastore, publisher, notifierSendChannel, hostConnection, serializedPkt)

            val sentPkt = (hostConnection.socketSession.outgoing as Channel).receive() as Frame.Text
            assertEquals(Json.encodeToString(Packet(
                ProtocolMsg.Type.`RESPONSE-HOST-QUESTIONS`,
                ResponseHostQuestionsMsg(expectedQuestionAndAnswers),
            )), sentPkt.readText())

            // Cleanup
            hostConnection.websocketCloseFuture.complete(null)
        }
    }

    @Test
    fun `Processing HostConfigMsg sets quizName, selectedCategories, questionDuration, selectedQuestionIndexes and quizStartTime`() = runTest {
        websocketConnectionScope(coroutineContext) {
            val quizId = "quizid1"
            val hostConnection = buildHostConnection(quizId)
            val quizName = "quiz name"
            val selectedCategories = listOf("apple", "banana", "orange")
            val questionDuration = 123
            val selectedQuestionIndexes = listOf(2, 5, 7, 13)
            val quizStartTime = Clock.System.now()
            // Fix the current time
            mockkObject(Clock.System)
            every { Clock.System.now() } returns quizStartTime

            // To facilitate checking that setters ran where there are no getters
            datastore  = spyk(datastore)

            val serializedPkt = Json.encodeToString(Packet(
                ProtocolMsg.Type.`HOST-CONFIG`,
                HostConfigMsg(quizName, selectedCategories, questionDuration, selectedQuestionIndexes)
            ))
            processInboundClientPacket(datastore, publisher, notifierSendChannel, hostConnection, serializedPkt)

            coVerify { datastore.setSelectedCategories(quizId, selectedCategories) } // TODO: Add assertion for get selected categories when needed
            coVerify { datastore.setQuizName(quizId, quizName) } // TODO: Swap out for get quiz name when needed
            assertEquals(questionDuration, datastore.getQuestionDuration(quizId))
            assertEquals(selectedQuestionIndexes, datastore.getSelectedQuestionIndexes(quizId))
            assertEquals(quizStartTime, datastore.getQuizStartTime(quizId))

            coVerify(exactly = 1) { publisher.publishQuizEvent(quizId, SubscriptionMessages.`QUIZ-STARTED`) }

            // Cleanup
            hostConnection.websocketCloseFuture.complete(null)
        }
    }

    @Test
    fun `Processing RequestParticipantQuestionMsg returns question to participant`() = runTest {
        websocketConnectionScope(coroutineContext) {
            val quizId = "quizid1"
            val userId = "userid"
            val participantConnection = buildParticipantConnection(quizId, userId)
            val expectedQuestionAndAnswers: List<QuestionAndAnswers> = Json.decodeFromString(File(quizFile).readText())
            mockkObject(QuizLoader)
            every { QuizLoader.load(any()) } returns expectedQuestionAndAnswers

            // Initialize a few things in the datastore
            val selectedQuestionIndexes = listOf(0, 1, 2, 5, 7)
            datastore.setSelectedQuestionIndexes(quizId, selectedQuestionIndexes)

            val participantQuestionIndex = 3
            val serializedPkt = Json.encodeToString(Packet(
                ProtocolMsg.Type.`REQUEST-PARTICIPANT-QUESTION`,
                RequestParticipantQuestionMsg(participantQuestionIndex),
            ))

            processInboundClientPacket(datastore, publisher, notifierSendChannel, participantConnection, serializedPkt)

            val expectedQuestion = expectedQuestionAndAnswers[selectedQuestionIndexes[participantQuestionIndex]]

            val sentPkt = (participantConnection.socketSession.outgoing as Channel).receive() as Frame.Text
            assertEquals(Json.encodeToString(Packet(
                ProtocolMsg.Type.`RESPONSE-PARTICIPANT-QUESTION`,
                ResponseParticipantQuestionMsg(
                    participantQuestionIndex,
                    expectedQuestion.question,
                    expectedQuestion.options,
                    expectedQuestion.answers.size,
                ),
            )), sentPkt.readText())

            // Cleanup
            participantConnection.websocketCloseFuture.complete(null)
        }
    }

    /**
     * When participant sends a ParticipantAnswerMsg, the participantAnswer is set,
     * and LEADERBOARD-UPDATED and NOTIFY-HOST-QUIZ-SUMMARY events are published.
     */
    @Test
    fun `Processing ParticipantAnswerMsg sets participant answer, updates leaderboard and publishes events, participant not finished`() = runTest {
        websocketConnectionScope(coroutineContext) {
            val quizId = "quizid1"
            val userId = "userid"
            val username = "username"
            val participantConnection = buildParticipantConnection(quizId, userId)
            val expectedQuestionAndAnswers: List<QuestionAndAnswers> = Json.decodeFromString(File(quizFile).readText())
            mockkObject(QuizLoader)
            every { QuizLoader.load(any()) } returns expectedQuestionAndAnswers

            // Initialize a few things in the datastore
            val selectedQuestionIndexes = listOf(0, 1, 2, 5, 8)
            datastore.setSelectedQuestionIndexes(quizId, selectedQuestionIndexes)
            val questionDuration = 100
            datastore.setQuestionDuration(quizId, questionDuration)
            val initialScore = 456
            datastore.addUserId(quizId, userId)
            datastore.setLeaderboardItem(quizId, userId, initialScore)
            datastore.setUsername(quizId, userId, username)

            val participantQuestionIndex = 3 // client facing
            val currentSelectedQuestionIndex = selectedQuestionIndexes[participantQuestionIndex] // backend facing
            val participantOptionIndexes = expectedQuestionAndAnswers[currentSelectedQuestionIndex].answers // They got answer correct
            val participantAnswerDuration = 34
            val serializedPkt = Json.encodeToString(Packet(
                ProtocolMsg.Type.`PARTICIPANT-ANSWER`,
                ParticipantAnswerMsg(participantQuestionIndex, participantOptionIndexes, participantAnswerDuration),
            ))

            processInboundClientPacket(datastore, publisher, notifierSendChannel, participantConnection, serializedPkt)

            val expectedQuestion = expectedQuestionAndAnswers[currentSelectedQuestionIndex]

            // Assert
            val actualAnswer = datastore.getParticipantAnswer(quizId, userId, selectedQuestionIndexes[participantQuestionIndex])
            assertEquals(ParticipantAnswer(currentSelectedQuestionIndex, participantOptionIndexes, participantAnswerDuration), actualAnswer)
            val expectedScore = initialScore + calculateAnswerScore(expectedQuestion.answers, participantOptionIndexes, questionDuration, participantAnswerDuration)
            assertEquals(expectedScore, datastore.getUserScore(quizId, userId))

            coVerify(exactly = 1) { publisher.publishQuizEvent(quizId, SubscriptionMessages.`LEADERBOARD-UPDATED`) }
            coVerify(exactly = 1) { publisher.publishQuizEvent(quizId, SubscriptionMessages.`NOTIFY-HOST-QUIZ-SUMMARY`) }

            // Cleanup
            participantConnection.websocketCloseFuture.complete(null)
        }
    }

    /**
     * When participant sends a ParticipantAnswerMsg for the last time, the participantStopTime is set
     * and a PARTICIPANT-FINISHED event is published
     */
    @Test
    fun `Processing the last ParticipantAnswerMsg sets participant stoptime and publishes event`() = runTest {
        websocketConnectionScope(coroutineContext) {
            val quizId = "quizid1"
            val userId1 = "userid1"
            val username1 = "username1"
            val participantConnection1 = buildParticipantConnection(quizId, userId1)
            val expectedQuestionAndAnswers: List<QuestionAndAnswers> = Json.decodeFromString(File(quizFile).readText())
            mockkObject(QuizLoader)
            every { QuizLoader.load(any()) } returns expectedQuestionAndAnswers

            val quizStopTime = Clock.System.now()
            // Fix the current time
            mockkObject(Clock.System)
            every { Clock.System.now() } returns quizStopTime

            // Initialize a few things in the datastore
            val selectedQuestionIndexes = listOf(0)
            datastore.setSelectedQuestionIndexes(quizId, selectedQuestionIndexes)
            datastore.setQuestionDuration(quizId, 100)
            datastore.addUserId(quizId, userId1)
            datastore.setLeaderboardItem(quizId, userId1, 0)
            datastore.setUsername(quizId, userId1, username1)
            datastore.addUserId(quizId, "userId2")
            datastore.setLeaderboardItem(quizId, "userId2", 0)
            datastore.setUsername(quizId, "userId2", "username2")

            val participantQuestionIndex = 0 // client facing
            val currentSelectedQuestionIndex = selectedQuestionIndexes[participantQuestionIndex] // backend facing
            val participantOptionIndexes = expectedQuestionAndAnswers[currentSelectedQuestionIndex].answers // They got answer correct
            val serializedPkt = Json.encodeToString(Packet(
                ProtocolMsg.Type.`PARTICIPANT-ANSWER`,
                ParticipantAnswerMsg(participantQuestionIndex, participantOptionIndexes, 15),
            ))

            processInboundClientPacket(datastore, publisher, notifierSendChannel, participantConnection1, serializedPkt)

            // Assert
            assertEquals(quizStopTime, datastore.getParticipantStopTime(quizId, userId1))
            coVerify(exactly = 1) { publisher.publishQuizEvent(quizId, SubscriptionMessages.`PARTICIPANT-FINISHED`) }

            // Cleanup
            participantConnection1.websocketCloseFuture.complete(null)
        }
    }

    /**
     * When participant sends a ParticipantAnswerMsg for the last time for all participants
     * in the quiz, a `QUIZ-FINISHED` event is published and the notifier is notified.
     */
    @Test
    fun `Processing the last ParticipantAnswerMsg for the last participant publishes quiz finished event`() = runTest {
        websocketConnectionScope(coroutineContext) {
            val quizId = "quizid1"
            val userId1 = "userid1"
            val username1 = "username1"
            val participantConnection1 = buildParticipantConnection(quizId, userId1)
            val expectedQuestionAndAnswers: List<QuestionAndAnswers> = Json.decodeFromString(File(quizFile).readText())
            mockkObject(QuizLoader)
            every { QuizLoader.load(any()) } returns expectedQuestionAndAnswers

            val quizStopTime = Clock.System.now()
            // Fix the current time
            mockkObject(Clock.System)
            every { Clock.System.now() } returns quizStopTime

            // Initialize a few things in the datastore
            val selectedQuestionIndexes = listOf(0)
            val participantQuestionIndex = 0 // client facing
            val currentSelectedQuestionIndex = selectedQuestionIndexes[participantQuestionIndex] // backend facing
            val currentQuestion = expectedQuestionAndAnswers[currentSelectedQuestionIndex]
            datastore.setSelectedQuestionIndexes(quizId, selectedQuestionIndexes)
            datastore.setQuestionDuration(quizId, 100)
            datastore.addUserId(quizId, userId1)
            datastore.setLeaderboardItem(quizId, userId1, 0)
            datastore.setUsername(quizId, userId1, username1)
            datastore.addUserId(quizId, "userId2")
            datastore.setLeaderboardItem(quizId, "userId2", 0)
            datastore.setUsername(quizId, "userId2", "username2")
            datastore.setParticipantAnswer(quizId, "userId2", currentSelectedQuestionIndex, currentQuestion.answers, 50)

            val participantOptionIndexes = expectedQuestionAndAnswers[currentSelectedQuestionIndex].answers // They got answer correct
            val serializedPkt = Json.encodeToString(Packet(
                ProtocolMsg.Type.`PARTICIPANT-ANSWER`,
                ParticipantAnswerMsg(participantQuestionIndex, participantOptionIndexes, 15),
            ))

            processInboundClientPacket(datastore, publisher, notifierSendChannel, participantConnection1, serializedPkt)

            // Assert
            coVerify(exactly = 1) { publisher.publishQuizEvent(quizId, SubscriptionMessages.`PARTICIPANT-FINISHED`) }
            assertEquals(quizStopTime, datastore.getQuizStopTime(quizId))
            coVerify(exactly = 1) { publisher.publishQuizEvent(quizId, SubscriptionMessages.`QUIZ-FINISHED`) }

            val notifierMsg = notifierSendChannel.receive()
            assertEquals(QuizComplete(quizId), notifierMsg)

            // Cleanup
            participantConnection1.websocketCloseFuture.complete(null)
        }
    }

    /**
     * When participant sends a ParticipantAnswerTimeoutMsg for the last time of all participants
     * in the quiz, a `QUIZ-FINISHED` event is published and the notifier is notified.
     */
    @Test
    fun `Processing the last ParticipantAnswerTimeoutMsg for the last participant publishes events`() = runTest {
        websocketConnectionScope(coroutineContext) {
            val quizId = "quizid1"
            val userId1 = "userid1"
            val username1 = "username1"
            val participantConnection1 = buildParticipantConnection(quizId, userId1)
            val expectedQuestionAndAnswers: List<QuestionAndAnswers> = Json.decodeFromString(File(quizFile).readText())
            mockkObject(QuizLoader)
            every { QuizLoader.load(any()) } returns expectedQuestionAndAnswers

            val quizStopTime = Clock.System.now()
            // Fix the current time
            mockkObject(Clock.System)
            every { Clock.System.now() } returns quizStopTime

            // Initialize a few things in the datastore
            val selectedQuestionIndexes = listOf(0)
            val participantQuestionIndex = 0 // client facing
            val currentSelectedQuestionIndex = selectedQuestionIndexes[participantQuestionIndex] // backend facing
            val currentQuestion = expectedQuestionAndAnswers[currentSelectedQuestionIndex]
            datastore.setSelectedQuestionIndexes(quizId, selectedQuestionIndexes)
            val questionDuration = 100
            datastore.setQuestionDuration(quizId, questionDuration)
            datastore.addUserId(quizId, userId1)
            datastore.setLeaderboardItem(quizId, userId1, 0)
            datastore.setUsername(quizId, userId1, username1)
            datastore.addUserId(quizId, "userId2")
            datastore.setLeaderboardItem(quizId, "userId2", 0)
            datastore.setUsername(quizId, "userId2", "username2")
            datastore.setParticipantAnswer(quizId, "userId2", currentSelectedQuestionIndex, currentQuestion.answers, 50)

            val serializedPkt = Json.encodeToString(Packet(
                ProtocolMsg.Type.`PARTICIPANT-ANSWER-TIMEOUT`,
                ParticipantAnswerTimeoutMsg(participantQuestionIndex),
            ))

            processInboundClientPacket(datastore, publisher, notifierSendChannel, participantConnection1, serializedPkt)

            // Assert
            assertEquals(ParticipantAnswer(currentSelectedQuestionIndex, listOf(), questionDuration + 1), datastore.getParticipantAnswer(quizId, userId1, currentSelectedQuestionIndex))
            coVerify(exactly = 1) { publisher.publishQuizEvent(quizId, SubscriptionMessages.`NOTIFY-HOST-QUIZ-SUMMARY`) }
            assertEquals(quizStopTime, datastore.getParticipantStopTime(quizId, userId1))
            coVerify(exactly = 1) { publisher.publishQuizEvent(quizId, SubscriptionMessages.`PARTICIPANT-FINISHED`) }
            assertEquals(quizStopTime, datastore.getQuizStopTime(quizId))
            coVerify(exactly = 1) { publisher.publishQuizEvent(quizId, SubscriptionMessages.`QUIZ-FINISHED`) }

            val notifierMsg = notifierSendChannel.receive()
            assertEquals(QuizComplete(quizId), notifierMsg)

            // Cleanup
            participantConnection1.websocketCloseFuture.complete(null)
        }
    }
}

package com.ryangwaite.connection

import com.ryangwaite.models.LeaderboardItem
import com.ryangwaite.notify.NotificationActorMsg
import com.ryangwaite.protocol.*
import com.ryangwaite.redis.IDataStore
import com.ryangwaite.redis.MockDataStore
import com.ryangwaite.subscribe.SubscriptionMessages
import io.ktor.http.*
import io.ktor.websocket.*
import io.mockk.InternalPlatformDsl.toArray
import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.every
import io.mockk.impl.annotations.MockK
import io.mockk.impl.annotations.RelaxedMockK
import io.mockk.junit5.MockKExtension
import io.mockk.verify
import kotlinx.coroutines.*
import kotlinx.coroutines.channels.Channel
import kotlinx.coroutines.channels.ReceiveChannel
import kotlinx.coroutines.channels.SendChannel
import kotlinx.coroutines.channels.receiveOrNull
import kotlinx.coroutines.flow.consumeAsFlow
import kotlinx.coroutines.flow.receiveAsFlow
import kotlinx.coroutines.test.runTest
import kotlinx.serialization.decodeFromString
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import org.junit.jupiter.api.extension.ExtendWith
import kotlin.coroutines.CoroutineContext
import kotlin.test.assertContains
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertTrue

class ConnectionManagerActorScope(private val context: CoroutineContext) {
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
 * Scope with testing utilities for a connectionManagerActor
 */
suspend fun connectionManagerActorScope(context: CoroutineContext, block: suspend ConnectionManagerActorScope.() -> Unit) {
    val scope = ConnectionManagerActorScope(context) // Create receiver object...
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
        connectionManagerActorScope(coroutineContext) {
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
        connectionManagerActorScope(coroutineContext) {
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
        connectionManagerActorScope(coroutineContext) {
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
        connectionManagerActorScope(coroutineContext) {
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

class ProcessInboundClientPacketTest {}

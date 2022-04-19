package com.ryangwaite.connection

import com.ryangwaite.protocol.Packet
import com.ryangwaite.protocol.ProtocolMsg
import io.ktor.server.websocket.*
import io.ktor.websocket.*
import kotlinx.coroutines.CompletableDeferred
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json

sealed class Connection(
    open val socketSession: DefaultWebSocketServerSession,
    // The receiver of this Connection must complete the future
    // if the socketSession is detected as closed. This will alert
    // the producer to the fact.
    open val websocketCloseFuture: CompletableDeferred<Exception?>,
    open val quizId: String,
) {
    suspend fun send(msg: ProtocolMsg) {
        val serializedPacket = Json.encodeToString(Packet.encapsulate(msg))
        socketSession.outgoing.send(Frame.Text(serializedPacket))
    }
}

data class HostConnection(
    override val socketSession: DefaultWebSocketServerSession,
    override val websocketCloseFuture: CompletableDeferred<Exception?>,
    override val quizId: String
): Connection(socketSession, websocketCloseFuture, quizId)

data class ParticipantConnection(
    override val socketSession: DefaultWebSocketServerSession,
    override val websocketCloseFuture: CompletableDeferred<Exception?>,
    override val quizId: String,
    val userId: String
): Connection(socketSession, websocketCloseFuture, quizId)



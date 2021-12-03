package com.ryangwaite.connection

import io.ktor.websocket.*
import kotlinx.coroutines.CompletableDeferred

sealed class Connection(
    open val socketSession: DefaultWebSocketServerSession,
    // The receiver of this Connection must complete the future
    // if the socketSession is detected as closed. This will alert
    // the producer to the fact.
    open val websocketCloseFuture: CompletableDeferred<Exception?>,
    open val quizId: String)

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



package com.ryangwaite.connection

import io.ktor.server.application.*
import io.ktor.server.websocket.*
import io.ktor.util.*
import io.ktor.websocket.*
import kotlinx.coroutines.Deferred
import kotlinx.coroutines.channels.Channel
import kotlinx.coroutines.channels.ReceiveChannel
import kotlinx.coroutines.channels.SendChannel
import kotlin.coroutines.CoroutineContext


class MockSocketSession(
    override val coroutineContext: CoroutineContext,
    override val incoming: Channel<Frame> = Channel(10), // buffered channel so it doesn't suspend waiting for a receive which may not come
    override val outgoing: Channel<Frame> = Channel(10),
) : DefaultWebSocketServerSession, WebSocketSession {
    override val call: ApplicationCall
        get() = throw NotImplementedError()
    override val closeReason: Deferred<CloseReason?>
        get() = throw NotImplementedError()
    override val extensions: List<WebSocketExtension<*>> = listOf()
    override var masking: Boolean = false
    override var maxFrameSize: Long = 1000
    override var pingIntervalMillis: Long = 1000
    override var timeoutMillis: Long = 1000

    override suspend fun flush() {
        println("MockSocketSession flushed")
    }

    @InternalAPI
    override fun start(negotiatedExtensions: List<WebSocketExtension<*>>) {
        throw NotImplementedError()
    }

    @Deprecated("Use cancel() instead.",replaceWith = ReplaceWith("cancel()", "kotlinx.coroutines.cancel"))
    override fun terminate() {
        throw NotImplementedError()
    }

    override suspend fun send(frame: Frame) {
        outgoing.send(frame)
    }
}
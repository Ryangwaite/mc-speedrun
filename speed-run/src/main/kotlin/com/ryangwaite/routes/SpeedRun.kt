package com.ryangwaite.routes

import com.ryangwaite.connection.*
import com.ryangwaite.subscribe.subscriberActor
import io.ktor.application.*
import io.ktor.auth.*
import io.ktor.auth.jwt.*
import io.ktor.http.cio.websocket.*
import io.ktor.routing.*
import io.ktor.websocket.*
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.delay
import java.util.*
import java.util.concurrent.atomic.AtomicReference
import kotlin.collections.LinkedHashSet


fun Application.speedRun() {
    routing {

        val connectionManagerChannel = connectionManagerActor()
        val subscriberChannel = subscriberActor(connectionManagerChannel)

        authenticate {
            webSocket("/speed-run/{quiz_id}/ws") {

                // Signal to block on while the connectionManager is using the connection
                val websocketClosed = CompletableDeferred<Exception?>()

                // Build connection from JWT claims
                val principal = call.principal<JWTPrincipal>()
                val quizId = principal!!.payload.getClaim("quizId").asString()
                val connection: Connection = if (principal!!.payload.getClaim("isHost").asBoolean()) {
                    log.info("New Host connection initiated from '$this' with quizId: $quizId")
                    HostConnection(this, websocketClosed,quizId)
                } else {
                    val userId = principal!!.payload.getClaim("userId").asString()
                    log.info("New Participant connection initiated from '$this' with quizId: $quizId, userId: $userId")
                    ParticipantConnection(this, websocketClosed, quizId, userId)
                }

                try {

                    connectionManagerChannel.send(NewConnection(connection))
                    val exception: Exception? = websocketClosed.await()
                    if (exception != null) {
                        throw exception
                    }
                } catch (e: Exception) {
                    log.error("Error: $e")
                } finally {
                    log.info("Connection '$this' closed.")
                }
            }
        }
    }
}
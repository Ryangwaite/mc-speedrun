package com.ryangwaite.routes

import com.auth0.jwt.exceptions.JWTVerificationException
import com.ryangwaite.auth.buildJwtVerifier
import com.ryangwaite.auth.validateJwt
import com.ryangwaite.connection.*
import com.ryangwaite.notify.INotifier
import com.ryangwaite.notify.notificationActor
import com.ryangwaite.redis.IDataStore
import com.ryangwaite.subscribe.AddSubscription
import com.ryangwaite.subscribe.ISubscribe
import com.ryangwaite.subscribe.RemoveSubscription
import com.ryangwaite.subscribe.subscriberActor
import io.ktor.server.application.*
import io.ktor.server.auth.jwt.*
import io.ktor.server.routing.*
import io.ktor.server.websocket.*
import io.ktor.websocket.*
import kotlinx.coroutines.CompletableDeferred
import java.io.File
import java.io.FileOutputStream

fun Application.speedRun(dataStore: IDataStore, subscriber: ISubscribe, publisher: IPublish, notifier: INotifier) {
    routing {

        val notificationChannel = this@speedRun.notificationActor(notifier) // todo: pass this into the other actor(s)
        val connectionManagerChannel = this@speedRun.connectionManagerActor(dataStore, publisher, notificationChannel)
        val subscriberChannel = this@speedRun.subscriberActor(dataStore, subscriber, connectionManagerChannel)

        webSocket("/speed-run/{quiz_id}/ws") {

            // Validate JWT token
            val token = call.request.queryParameters["token"]
            if (token.isNullOrEmpty()) {
                close(CloseReason(CloseReason.Codes.CANNOT_ACCEPT, "Missing 'token' query parameter"))
                return@webSocket
            }
            val tokenVerifier = buildJwtVerifier(environment!!)
            val jwtPrincipal: JWTPrincipal = try {
                val decodedToken = tokenVerifier.verify(token)
                validateJwt(JWTCredential(decodedToken))
            } catch (e: JWTVerificationException) {
                close(CloseReason(CloseReason.Codes.CANNOT_ACCEPT, "Invalid token '$token' received. Reason: ${e.message}"))
                return@webSocket
            }

            // Signal to block on while the connectionManager is using the connection
            val websocketClosed = CompletableDeferred<Exception?>()

            // Build connection from JWT claims
            val quizId = jwtPrincipal.payload.getClaim("quizId").asString()
            val connection: Connection = if (jwtPrincipal.payload.getClaim("isHost").asBoolean()) {
                this@speedRun.log.info("New Host connection initiated from '$this' with quizId: $quizId")
                HostConnection(this, websocketClosed,quizId)
            } else {
                val userId = jwtPrincipal.payload.getClaim("userId").asString()
                this@speedRun.log.info("New Participant connection initiated from '$this' with quizId: $quizId, userId: $userId")
                ParticipantConnection(this, websocketClosed, quizId, userId)
            }

            try {
                connectionManagerChannel.send(NewConnection(connection))
                subscriberChannel.send(AddSubscription(quizId))
                val exception: Exception? = websocketClosed.await()
                if (exception != null) {
                    throw exception
                }
            } catch (e: Exception) {
                this@speedRun.log.error("Error: $e")
            } finally {
                subscriberChannel.send(RemoveSubscription(quizId))
                this@speedRun.log.info("Connection '$this' closed.")
            }
        }
    }
}
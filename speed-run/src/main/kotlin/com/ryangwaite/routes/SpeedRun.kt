package com.ryangwaite.routes

import com.auth0.jwt.exceptions.JWTVerificationException
import com.auth0.jwt.interfaces.DecodedJWT
import com.ryangwaite.config.buildJwtVerifier
import com.ryangwaite.config.validateJwt
import com.ryangwaite.connection.*
import com.ryangwaite.redis.IDataStore
import com.ryangwaite.subscribe.AddSubscription
import com.ryangwaite.subscribe.ISubscribe
import com.ryangwaite.subscribe.RemoveSubscription
import com.ryangwaite.subscribe.subscriberActor
import io.ktor.application.*
import io.ktor.auth.*
import io.ktor.auth.jwt.*
import io.ktor.http.*
import io.ktor.http.cio.websocket.*
import io.ktor.response.*
import io.ktor.routing.*
import io.ktor.websocket.*
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.delay
import java.util.*
import java.util.concurrent.atomic.AtomicReference
import kotlin.collections.LinkedHashSet


fun Application.speedRun(dataStore: IDataStore, subscriber: ISubscribe, publisher: IPublish) {
    routing {

        val connectionManagerChannel = connectionManagerActor(dataStore, publisher)
        val subscriberChannel = subscriberActor(dataStore, subscriber, connectionManagerChannel)

        webSocket("/speed-run/{quiz_id}/ws") {

            // Validate JWT token
            val token = call.request.queryParameters["token"]
            if (token.isNullOrEmpty()) {
                close(CloseReason(CloseReason.Codes.CANNOT_ACCEPT, "Missing 'token' query parameter"))
                return@webSocket
            }
            val tokenVerifier = buildJwtVerifier(environment)
            val jwtPrincipal: JWTPrincipal = try {
                val decodedToken = tokenVerifier.verify(token as String)
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
                log.info("New Host connection initiated from '$this' with quizId: $quizId")
                HostConnection(this, websocketClosed,quizId)
            } else {
                val userId = jwtPrincipal.payload.getClaim("userId").asString()
                log.info("New Participant connection initiated from '$this' with quizId: $quizId, userId: $userId")
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
                log.error("Error: $e")
            } finally {
                subscriberChannel.send(RemoveSubscription(quizId))
                log.info("Connection '$this' closed.")
            }
        }
    }
}
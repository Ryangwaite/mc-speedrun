package com.ryangwaite.routes

import com.auth0.jwt.JWT
import com.auth0.jwt.algorithms.Algorithm
import com.ryangwaite.configureRouting
import io.ktor.application.*
import io.ktor.config.*
import io.ktor.http.cio.websocket.*
import io.ktor.server.testing.*
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test
import org.junit.jupiter.params.ParameterizedTest
import org.junit.jupiter.params.provider.CsvSource
import java.util.*
import kotlin.test.assertIs

const val JWT_TEST_AUDIENCE = "http://test.audience:8080/"
const val JWT_TEST_ISSUER = "http://test.issuer:8080/"
const val JWT_TEST_SECRET = "default-secret"

fun createTestHostJwtToken(
    audience: String = JWT_TEST_AUDIENCE,
    issuer: String = JWT_TEST_ISSUER,
    quizId: String = "12345",
    isHost: String = "true",            // NOTE: this is a bool, but it's typed as a string to facilitate passing invalid values in tests
    secret: String = JWT_TEST_SECRET
): String = JWT.create()
        .withAudience(audience)
        .withIssuer(issuer)
        .withClaim("quizId", quizId)
        .withClaim("isHost", isHost)
        .withExpiresAt(Calendar.getInstance().run {add(Calendar.YEAR, 1); time}) // 1 year in future
        .sign(Algorithm.HMAC256(secret))

class SpeedRunTest {

    @Test
    fun `No token provided`() {
        withTestApplication({
            install(io.ktor.websocket.WebSockets)
            configureRouting()
        }) {
            val quizId = "12345"
            handleWebSocketConversation("/speed-run/$quizId/ws") {incoming, outgoing ->
                val closeFrame = incoming.receive() as Frame.Close
                assertEquals("Missing 'token' query parameter", closeFrame.readReason()!!.message)
            }
        }
    }

    @Test
    fun `JWT fails verification`() {
        withTestApplication({
            // Create the environment for verifying the JWT token
            (environment.config as MapApplicationConfig).apply {
                put("jwt.secret", JWT_TEST_SECRET)
                put("jwt.issuer", JWT_TEST_ISSUER)
                put("jwt.audience", JWT_TEST_AUDIENCE)
            }
            install(io.ktor.websocket.WebSockets)
            configureRouting()
        }) {
            val invalidToken = createTestHostJwtToken(secret = JWT_TEST_SECRET + "invalid")
            val quizId = "12345"
            handleWebSocketConversation("/speed-run/$quizId/ws?token=$invalidToken") {incoming, outgoing ->
                val closeFrame = incoming.receive() as Frame.Close
                assertEquals("Invalid token '${invalidToken}' received. Reason: The Token's Signature resulted invalid when verified using the Algorithm: HmacSHA256", closeFrame.readReason()!!.message)
            }

        }
    }

    @ParameterizedTest
    @CsvSource(
        "true,      ''",        // invalid quizId
        "yes,       12345",     // invalid isHost
    )
    fun `JWT fails validation`(isHost: String, quizId: String) {
        withTestApplication({
            // Create the environment for verifying the JWT token
            (environment.config as MapApplicationConfig).apply {
                put("jwt.secret", JWT_TEST_SECRET)
                put("jwt.issuer", JWT_TEST_ISSUER)
                put("jwt.audience", JWT_TEST_AUDIENCE)
            }
            install(io.ktor.websocket.WebSockets)
//            installJwtAuthentication()
            configureRouting()
        }) {
            val invalidToken = createTestHostJwtToken(isHost = isHost, quizId = quizId)
            handleWebSocketConversation("/speed-run/12345/ws?token=$invalidToken") {incoming, outgoing ->
                // The first frame received should be a close due to an error
                assertIs<Frame.Close>(incoming.receive())
            }

        }
    }
}
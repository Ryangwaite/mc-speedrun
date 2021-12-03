package com.ryangwaite.routes

import com.auth0.jwt.JWT
import com.auth0.jwt.algorithms.Algorithm
import com.ryangwaite.configureRedis
import com.ryangwaite.configureRouting
import com.ryangwaite.installJwtAuthentication
import com.ryangwaite.module
import io.ktor.application.*
import io.ktor.config.*
import io.ktor.http.*
import io.ktor.http.cio.websocket.*
import io.ktor.server.testing.*
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test
import org.junit.jupiter.params.ParameterizedTest
import org.junit.jupiter.params.provider.CsvSource
import java.util.*

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
    fun `JWT fails verification`() {
        withTestApplication({
            // Create the environment for verifying the JWT token
            (environment.config as MapApplicationConfig).apply {
                put("jwt.secret", JWT_TEST_SECRET)
                put("jwt.issuer", JWT_TEST_ISSUER)
                put("jwt.audience", JWT_TEST_AUDIENCE)
            }
            install(io.ktor.websocket.WebSockets)
            installJwtAuthentication()
            configureRouting()
        }) {
            val invalidToken = createTestHostJwtToken(secret = JWT_TEST_SECRET + "invalid")
            val quizId = "12345"
            handleWebSocket("/speed-run/$quizId/ws") {
                addHeader("Authorization", "Bearer $invalidToken")
            }.apply {
                assertEquals(HttpStatusCode.Unauthorized, response.status())
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
            installJwtAuthentication()
            configureRouting()
        }) {
            val invalidToken = createTestHostJwtToken(isHost = isHost, quizId = quizId)
            handleWebSocket("/speed-run/12345/ws") {
                addHeader("Authorization", "Bearer $invalidToken")
            }.apply {
                assertEquals(HttpStatusCode.Unauthorized, response.status())
            }

        }
    }
}
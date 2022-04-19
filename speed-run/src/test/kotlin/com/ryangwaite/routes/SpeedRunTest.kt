package com.ryangwaite.routes

import com.auth0.jwt.JWT
import com.auth0.jwt.algorithms.Algorithm
import com.ryangwaite.configureRouting
import com.ryangwaite.connection.IPublish
import com.ryangwaite.notify.INotifier
import com.ryangwaite.redis.IDataStore
import com.ryangwaite.subscribe.ISubscribe
import io.ktor.client.plugins.websocket.*
import io.ktor.server.application.*
import io.ktor.server.config.*
import io.ktor.server.testing.*
import io.ktor.server.websocket.*
import io.ktor.client.plugins.websocket.WebSockets as ClientWebSockets
import io.mockk.impl.annotations.MockK
import io.mockk.junit5.MockKExtension
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.junit.jupiter.params.ParameterizedTest
import org.junit.jupiter.params.provider.CsvSource
import java.util.*
import kotlin.test.assertTrue

const val JWT_TEST_AUDIENCE = "http://test.audience:8080/"
const val JWT_TEST_ISSUER = "http://test.issuer:8080/"
const val JWT_TEST_SECRET = "default-secret"

/**
 * Wraps the 'testApplication' method with common setup for all tests.
 */
fun wrappedTestApplication(
    block: suspend ApplicationTestBuilder.() -> Unit
): Unit = testApplication {
    // NOTE: Without this environment block, 'testApplication' will automatically
    // run Application.module()
    environment {
        config = MapApplicationConfig(
            "jwt.secret" to JWT_TEST_SECRET,
            "jwt.issuer" to JWT_TEST_ISSUER,
            "jwt.audience" to JWT_TEST_AUDIENCE,
        )
    }
    block()
}

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

@ExtendWith(MockKExtension::class)
class SpeedRunTest {

    @MockK
    lateinit var datastore: IDataStore

    @MockK
    lateinit var subscriber: ISubscribe

    @MockK
    lateinit var publisher: IPublish

    @MockK
    lateinit var notifier: INotifier

    @Test
    fun `No token provided`() = wrappedTestApplication {
        application {
            install(WebSockets)
            configureRouting(datastore, subscriber, publisher, notifier)
        }
        val wsClient = createClient {
            install(ClientWebSockets)
        }
        val quizId = "12345"
        wsClient.webSocket("/speed-run/$quizId/ws") {
            assertEquals("Missing 'token' query parameter", closeReason.await()?.message)
        }
    }

    @Test
    fun `JWT fails verification`() = wrappedTestApplication {
        application {
            install(WebSockets)
            configureRouting(datastore, subscriber, publisher, notifier)
        }
        val client = createClient {
            install(ClientWebSockets)
        }
        val invalidToken = createTestHostJwtToken(secret = JWT_TEST_SECRET + "invalid")
        val quizId = "12345"
        client.webSocket("/speed-run/$quizId/ws?token=$invalidToken") {
            assertEquals("Invalid token '${invalidToken}' received. Reason: The Token's Signature resulted invalid when verified using the Algorithm: HmacSHA256",
                closeReason.await()?.message)
        }
    }

    @ParameterizedTest
    @CsvSource(
        "true,      ''",        // invalid quizId
        "yes,       12345",     // invalid isHost
    )
    fun `JWT fails validation`(isHost: String, quizId: String) = wrappedTestApplication {
        application {
            install(WebSockets)
            configureRouting(datastore, subscriber, publisher, notifier)
        }
        val client = createClient {
            install(ClientWebSockets)
        }

        val invalidToken = createTestHostJwtToken(isHost = isHost, quizId = quizId)
        client.webSocket("/speed-run/12345/ws?token=$invalidToken") {
            // The first frame received should be a close due to an error
            assertTrue("Invalid token '${invalidToken}' received." in closeReason.await()?.message!!)
        }
    }
}
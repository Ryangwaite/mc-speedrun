package com.ryangwaite.routes

import com.auth0.jwt.JWT
import com.auth0.jwt.algorithms.Algorithm
import com.ryangwaite.models.AuthorizationResponse
import com.ryangwaite.module
import com.ryangwaite.utilities.MemoryRepository
import io.ktor.application.*
import io.ktor.config.*
import io.ktor.features.*
import io.ktor.http.*
import io.ktor.serialization.*
import kotlin.test.*
import io.ktor.server.testing.*
import kotlinx.serialization.json.Json
import kotlinx.serialization.decodeFromString
import org.junit.jupiter.api.assertDoesNotThrow

class ParticipantTest {
    @Test
    fun `Omitting code returns bad request`() {
        withTestApplication({ participant(MemoryRepository()) }) {
            handleRequest(HttpMethod.Post, "/sign-on/join").apply {
                assertEquals(HttpStatusCode.NotFound, response.status())
            }
        }
    }

    @Test
    fun `Bad code returns not found`() {
        withTestApplication({ participant(MemoryRepository()) }) {
            handleRequest(HttpMethod.Post, "/sign-on/badcode/join").apply {
                assertEquals(HttpStatusCode.NotFound, response.status())
                assertEquals("Invalid quiz ID 'badcode' provided", response.content)
            }
        }
    }

    @Test
    fun `create participant JWT`() = withTestApplication({install(ContentNegotiation) {json()} }) {
        // Create the environment for forming the JWT params
        val TEST_SECRET = "test-secret"
        val TEST_ISSUER = "http://test.issuer:8080/"
        val TEST_AUDIENCE = "http://test.audience:8080/"
        (environment.config as MapApplicationConfig).apply {
            put("jwt.secret", TEST_SECRET)
            put("jwt.issuer", TEST_ISSUER)
            put("jwt.audience", TEST_AUDIENCE)
        }
        val quizId = "testCode1234"
        val repository = MemoryRepository()
        repository.createQuiz(quizId)
        application.participant(repository)

        with(handleRequest(HttpMethod.Post, "/sign-on/$quizId/join") {
            // NOTE: Add headers and body if needed
        }) {
            // Assertions
            val payload = Json.decodeFromString<AuthorizationResponse>(response.content!!)
            val jwtVerifier = JWT.require(Algorithm.HMAC256(TEST_SECRET))
                .withAudience(TEST_AUDIENCE)
                .withIssuer(TEST_ISSUER)
                .withClaim("quizId", quizId)
                .withClaim("isHost", false)
                .build()
            assertDoesNotThrow { jwtVerifier.verify(payload.access_token) }
            // todo: assert the other attributes of the payload
            return@withTestApplication // Note: need the explicit return else its the result of the above command that's returned
        }
    }
}
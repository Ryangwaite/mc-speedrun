package com.ryangwaite.routes

import com.auth0.jwt.JWT
import com.auth0.jwt.algorithms.Algorithm
import com.ryangwaite.models.AuthorizationResponse
import com.ryangwaite.utilities.MemoryRepository
import io.ktor.application.*
import io.ktor.config.*
import io.ktor.features.*
import io.ktor.http.*
import io.ktor.serialization.*
import kotlin.test.*
import io.ktor.server.testing.*
import io.mockk.every
import io.mockk.mockkStatic
import kotlinx.serialization.json.Json
import kotlinx.serialization.decodeFromString
import org.junit.jupiter.api.assertDoesNotThrow

class HostTest {

    @Test
    fun `create Host JWT`() = withTestApplication({install(ContentNegotiation) {json()} }) {
        // Create the environment for forming the JWT params
        val TEST_SECRET = "test-secret"
        val TEST_ISSUER = "http://test.issuer:8080/"
        val TEST_AUDIENCE = "http://test.audience:8080/"
        (environment.config as MapApplicationConfig).apply {
            put("jwt.secret", TEST_SECRET)
            put("jwt.issuer", TEST_ISSUER)
            put("jwt.audience", TEST_AUDIENCE)
        }
        val quizId = "12345678"
        val quizName = "quizzesname"
        val repository = MemoryRepository()
        application.host(repository)

        // Mock the generateQuizId. See the following for details on
        // how this works:https://blog.kotlin-academy.com/mocking-is-not-rocket-science-mockk-advanced-features-42277e5983b5
        mockkStatic(::generateCodeImpl)
        every { generateCodeImpl() } returns quizId

        with(handleRequest(HttpMethod.Post, "/sign-on/host/$quizName") {
            // NOTE: Add headers and body if needed
        }) {
            // Assertions
            val payload = Json.decodeFromString<AuthorizationResponse>(response.content!!)
            val jwtVerifier = JWT.require(Algorithm.HMAC256(TEST_SECRET))
                .withAudience(TEST_AUDIENCE)
                .withIssuer(TEST_ISSUER)
                .withClaim("quizId", quizId)
                .withClaim("isHost", true)
                .build()
            assertDoesNotThrow { jwtVerifier.verify(payload.access_token) }
            // todo: assert the other attributes of the payload
        }
        assertEquals(1, repository.quizzes.size)
        assertEquals(quizName, repository.quizzes[quizId])
    }
}
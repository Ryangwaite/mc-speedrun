package com.ryangwaite.routes

import com.auth0.jwt.JWT
import com.auth0.jwt.algorithms.Algorithm
import com.auth0.jwt.interfaces.DecodedJWT
import com.ryangwaite.configureRouting
import com.ryangwaite.models.AuthorizationResponse
import com.ryangwaite.utilities.MemoryRepository
import com.ryangwaite.utilities.generateId
import io.ktor.client.request.*
import io.ktor.client.statement.*
import io.ktor.server.config.*
import io.ktor.serialization.kotlinx.json.*
import io.ktor.server.plugins.contentnegotiation.*
import kotlin.test.*
import io.ktor.server.testing.*
import io.mockk.every
import io.mockk.mockkStatic
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.decodeFromStream
import org.joda.time.DateTime
import org.junit.jupiter.api.assertDoesNotThrow

class HostTest {

    @Test
    fun `create Host JWT`() = testApplication {
        // Setup
        install(ContentNegotiation) {
            json()
        }
        // Create the environment for forming the JWT params
        val TEST_SECRET = "test-secret"
        val TEST_ISSUER = "http://test.issuer:8080/"
        val TEST_AUDIENCE = "http://test.audience:8080/"
        environment {
            config = MapApplicationConfig(
                "jwt.secret" to TEST_SECRET,
                "jwt.issuer" to TEST_ISSUER,
                "jwt.audience" to TEST_AUDIENCE,
            )
        }
        val repository = MemoryRepository()
        this.application { configureRouting(repository) }

        val quizId = "12345678"

        // Mock the generateId. See the following for details on
        // how this works:https://blog.kotlin-academy.com/mocking-is-not-rocket-science-mockk-advanced-features-42277e5983b5
        mockkStatic(::generateId)
        every { generateId() } returns quizId

        // Act
        val response = client.post("/api/sign-on/host")

        // Assert
        val payload = Json.decodeFromStream<AuthorizationResponse>(response.readBytes().inputStream())
        val jwtVerifier = JWT.require(Algorithm.HMAC256(TEST_SECRET))
            .withAudience(TEST_AUDIENCE)
            .withIssuer(TEST_ISSUER)
            .withClaim("quizId", quizId)
            .withClaim("isHost", true)
            .build()
        val decodedJwt: DecodedJWT = assertDoesNotThrow {
             jwtVerifier.verify(payload.access_token)
        }
        assertEquals("Bearer", payload.token_type)
        val expectedExpiry = DateTime(decodedJwt.issuedAt.time).plusSeconds(payload.expires_in)
        assertEquals(expectedExpiry, DateTime(decodedJwt.expiresAt.time))

        assertEquals(1, repository.quizzes.size)
    }
}
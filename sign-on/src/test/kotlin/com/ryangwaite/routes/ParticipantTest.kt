package com.ryangwaite.routes

import com.auth0.jwt.JWT
import com.auth0.jwt.algorithms.Algorithm
import com.auth0.jwt.interfaces.DecodedJWT
import com.ryangwaite.models.AuthorizationResponse
import com.ryangwaite.utilities.MemoryRepository
import com.ryangwaite.utilities.generateId
import io.ktor.client.request.*
import io.ktor.client.statement.*
import io.ktor.server.application.*
import io.ktor.server.config.*
import io.ktor.http.*
import io.ktor.serialization.kotlinx.json.*
import io.ktor.server.plugins.contentnegotiation.*
import kotlin.test.*
import io.ktor.server.testing.*
import io.ktor.utils.io.jvm.javaio.*
import io.mockk.every
import io.mockk.mockkStatic
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.decodeFromStream
import org.joda.time.DateTime
import org.junit.jupiter.api.assertDoesNotThrow

class ParticipantTest {
    @Test
    fun `Omitting code returns bad request`() = testApplication {
        application {
            participant(MemoryRepository())
        }

        val response = client.post("/api/sign-on/join")
        assertEquals(HttpStatusCode.NotFound, response.status)
    }

    @Test
    fun `Bad code returns not found`() = testApplication {
        application {
            participant(MemoryRepository())
        }

        val response = client.post("/api/sign-on/badcode/join")
        assertEquals(HttpStatusCode.NotFound, response.status)
        assertEquals("Invalid quiz ID 'badcode' provided", response.bodyAsText())
    }

    @Test
    fun `create participant JWT`() = testApplication {
        // Setup
        application {
            install(ContentNegotiation) {json()}
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
        val quizId = "testCode1234"
        val repository = MemoryRepository()
        repository.createQuiz(quizId)
        application {
            participant(repository)
        }

        val userId = "userid01"
        mockkStatic(::generateId)
        every { generateId() } returns userId

        // Act
        val response = client.post("/api/sign-on/$quizId/join")

        // Assert
        val payload = Json.decodeFromStream<AuthorizationResponse>(response.bodyAsChannel().toInputStream())
        val jwtVerifier = JWT.require(Algorithm.HMAC256(TEST_SECRET))
            .withAudience(TEST_AUDIENCE)
            .withIssuer(TEST_ISSUER)
            .withClaim("quizId", quizId)
            .withClaim("isHost", false)
            .withClaim("userId", userId)
            .build()
        val decodedJwt: DecodedJWT = assertDoesNotThrow {
            jwtVerifier.verify(payload.access_token)
        }
        assertEquals("Bearer", payload.token_type)
        val expectedExpiry = DateTime(decodedJwt.issuedAt.time).plusSeconds(payload.expires_in)
        assertEquals(expectedExpiry, DateTime(decodedJwt.expiresAt.time))
    }
}
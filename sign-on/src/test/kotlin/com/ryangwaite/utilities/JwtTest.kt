package com.ryangwaite.utilities

import com.auth0.jwt.JWT
import com.auth0.jwt.algorithms.Algorithm
import com.auth0.jwt.interfaces.DecodedJWT
import io.ktor.server.application.*
import io.ktor.server.config.*
import io.ktor.server.testing.*
import io.mockk.every
import io.mockk.mockkStatic
import org.joda.time.DateTime
import org.junit.jupiter.api.assertDoesNotThrow
import kotlin.test.*

class JwtTest {
    val TEST_SECRET = "test-secret"
    val TEST_ISSUER = "http://test.issuer:8080/"
    val TEST_AUDIENCE = "http://test.audience:8080/"
    val USER_ID = "userid01"

    lateinit var environment: ApplicationEnvironment

    @BeforeTest
    fun `setup`() {
        val testEnvironment =  createTestEnvironment {
            config = MapApplicationConfig(
                "jwt.secret" to TEST_SECRET,
                "jwt.issuer" to TEST_ISSUER,
                "jwt.audience" to TEST_AUDIENCE,
            )
        }
        this.environment = testEnvironment.application.environment

        mockkStatic(::generateId)
        every { generateId() } returns USER_ID
    }

    @Test
    fun `creates host JWT`() {
        val quizId = "testCode1234"
        val (token, expiresInSecs) = createJwtToken(environment, quizId, true)
        val jwtVerifier = JWT.require(Algorithm.HMAC256(TEST_SECRET))
            .withAudience(TEST_AUDIENCE)
            .withIssuer(TEST_ISSUER)
            .withClaim("quizId", quizId)
            .withClaim("isHost", true)
            .build()
        val decodedJwt: DecodedJWT = assertDoesNotThrow {
            jwtVerifier.verify(token)
        }
        val expectedExpiry = DateTime(decodedJwt.issuedAt.time).plusSeconds(expiresInSecs)
        assertEquals(expectedExpiry, DateTime(decodedJwt.expiresAt.time))
    }

    @Test
    fun `creates participant JWT`() {
        val quizId = "testCode1234"
        val (token, expiresInSecs) = createJwtToken(environment, quizId, false)
        val jwtVerifier = JWT.require(Algorithm.HMAC256(TEST_SECRET))
            .withAudience(TEST_AUDIENCE)
            .withIssuer(TEST_ISSUER)
            .withClaim("quizId", quizId)
            .withClaim("isHost", false)
            .withClaim("userId", USER_ID)
            .build()
        val decodedJwt: DecodedJWT = assertDoesNotThrow {
            jwtVerifier.verify(token)
        }
        val expectedExpiry = DateTime(decodedJwt.issuedAt.time).plusSeconds(expiresInSecs)
        assertEquals(expectedExpiry, DateTime(decodedJwt.expiresAt.time))
    }
}

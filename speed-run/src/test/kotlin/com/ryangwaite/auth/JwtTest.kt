package com.ryangwaite.auth

import com.auth0.jwt.JWT
import com.auth0.jwt.algorithms.Algorithm
import com.auth0.jwt.exceptions.JWTVerificationException
import io.ktor.server.auth.jwt.*
import io.ktor.server.config.*
import org.joda.time.DateTime
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertDoesNotThrow
import org.junit.jupiter.api.assertThrows
import org.junit.jupiter.params.ParameterizedTest
import org.junit.jupiter.params.provider.CsvSource
import java.util.*

/**
 * Creates the JWT token with the given parameters, any omitted fields are
 * not defaulted and they are not added to the token
 */
fun createJwtToken(
    secret: String, audience: String? = null, issuer: String? = null,
    quizId: String? = null, isHost: String? = null, userId: String? = null
): String {
    val issueDate = DateTime.now()
    val expiresInSecs = 365 * 24 * 60 * 60
    val expiryDate: Date = issueDate.plusSeconds(expiresInSecs).toDate()

    val tokenBuilder = JWT.create()
        .withIssuedAt(issueDate.toDate())
        .withExpiresAt(expiryDate)

    if (audience != null) tokenBuilder.withAudience(audience)
    if (issuer != null) tokenBuilder.withIssuer(issuer)
    if (quizId != null) tokenBuilder.withClaim("quizId", quizId)
    if (userId != null) tokenBuilder.withClaim("userId", userId)

    if (isHost != null) {
        // The isHost param is a string to enable passing in invalid vars
        // but if the string represents a bool convert it to that type before
        // setting in the token, as per a real token
        val isHostValueParsed = isHost.toBooleanStrictOrNull()
        if (isHostValueParsed != null) {
            tokenBuilder.withClaim("isHost", isHostValueParsed)
        } else {
            tokenBuilder.withClaim("isHost", isHost)
        }
    }

    return tokenBuilder.sign(Algorithm.HMAC256(secret))
}

private const val TEST_SECRET = "testsecret"
private const val TEST_ISSUER = "http://test.issuer:8080/"
private const val TEST_AUDIENCE = "http://test.audience:8080/"

class JwtTest {

    private val config = MapApplicationConfig(
        "jwt.secret" to TEST_SECRET,
        "jwt.issuer" to TEST_ISSUER,
        "jwt.audience" to TEST_AUDIENCE,
    )

    @Test
    fun `jwt verifier verifies valid token`() {
        val verifier = buildJwtVerifier(config)
        val token = createJwtToken(TEST_SECRET, TEST_AUDIENCE, TEST_ISSUER, "quizid", "true")
        assertDoesNotThrow { verifier.verify(token) }

    }

    @ParameterizedTest
    @CsvSource(
        "badsecret,         ${TEST_AUDIENCE},     ${TEST_ISSUER},   quizid,     true",      // invalid secret
        "${TEST_SECRET},    null,                 ${TEST_ISSUER},   quizid,     true",      // missing audience
        "${TEST_SECRET},    ${TEST_AUDIENCE},     ,                 quizid,     true",      // missing issuer
        "${TEST_SECRET},    ${TEST_AUDIENCE},     ${TEST_ISSUER},   ,           true",      // missing quizId claim
        "${TEST_SECRET},    ${TEST_AUDIENCE},     ${TEST_ISSUER},   quizid,         ",      // missing isHost claim
    )
    fun `jwt verifier verifies invalid token`(secret: String, audience: String?, issuer: String?, quizId: String?, isHost: String?) {
        val verifier = buildJwtVerifier(config)
        val token = createJwtToken(secret, audience, issuer, quizId, isHost)
        assertThrows<JWTVerificationException> { verifier.verify(token) }
    }

    @Test
    fun `validate jwt valid token`() {
        val verifier = buildJwtVerifier(config)
        val token = createJwtToken(TEST_SECRET, TEST_AUDIENCE, TEST_ISSUER, "quizid", "false", "userId")
        val decodedJwt = verifier.verify(token)
        assertDoesNotThrow { validateJwt(JWTCredential(decodedJwt)) }
    }

    @ParameterizedTest
    @CsvSource(
        "'',        true,       userId",            // empty quizId
        "quizId,    notbool,    userId",            // not boolean isHost
        "quizId,    false,      ''    ",            // empty userId
    )
    fun `validate jwt invalid token`(quizId: String?, isHost: String?, userId: String?) {
        val verifier = buildJwtVerifier(config)
        val token = createJwtToken(TEST_SECRET, TEST_AUDIENCE, TEST_ISSUER, quizId, isHost, userId)
        val decodedJwt = verifier.verify(token)
        assertThrows<JWTVerificationException> { validateJwt(JWTCredential(decodedJwt)) }
    }
}
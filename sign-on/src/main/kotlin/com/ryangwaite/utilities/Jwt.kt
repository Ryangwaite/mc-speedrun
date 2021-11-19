package com.ryangwaite.utilities

import com.auth0.jwt.JWT
import com.auth0.jwt.algorithms.Algorithm
import io.ktor.application.*
import io.ktor.config.*
import org.joda.time.DateTime
import java.util.*

/**
 * Create the JWT token for the given session [quizId] for both hosts
 * and participants depending on the value of [isHost]
 */
fun createJwtToken(environment: ApplicationEnvironment, quizId: String, isHost: Boolean): Pair<String, Int> {
    val secret = environment.config.property("jwt.secret").getString()
    val issuer = environment.config.property("jwt.issuer").getString()
    val audience = environment.config.property("jwt.audience").getString()

    if (secret.isNullOrEmpty()) throw ApplicationConfigurationException("Couldn't read JWT secret from environment")
    if (issuer.isNullOrEmpty()) throw ApplicationConfigurationException("Couldn't read JWT issuer from environment")
    if (audience.isNullOrEmpty()) throw ApplicationConfigurationException("Couldn't read JWT audience from environment")

    // Expire in 1 year which is way too high, but it's a stopgap till the logic for
    // refreshing the JWT token is implemented
    val expiresInSecs = 365 * 24 * 60 * 60
    val expiryDate: Date = DateTime().plusSeconds(expiresInSecs).toDate()

    val token = JWT.create()
        .withAudience(audience)
        .withIssuer(issuer)
        .withClaim("quizId", quizId)
        .withClaim("isHost", isHost)
        .withExpiresAt(expiryDate)
        .sign(Algorithm.HMAC256(secret))

    return Pair(token, expiresInSecs)
}
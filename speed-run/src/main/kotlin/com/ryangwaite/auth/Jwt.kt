package com.ryangwaite.auth

import com.auth0.jwt.JWT
import com.auth0.jwt.algorithms.Algorithm
import com.auth0.jwt.exceptions.JWTVerificationException
import io.ktor.application.*
import io.ktor.auth.jwt.*
import io.ktor.config.*

/**
 * Builds the JWT verifier from the environment config.
 * This only verifies the constant config across participant and host JWTs.
 */
fun buildJwtVerifier(environment: ApplicationEnvironment): com.auth0.jwt.interfaces.JWTVerifier {
    val secret = environment.config.property("jwt.secret").getString()
    val issuer = environment.config.property("jwt.issuer").getString()
    val audience = environment.config.property("jwt.audience").getString()

    if (secret.isEmpty()) throw ApplicationConfigurationException("Couldn't read JWT secret from environment")
    if (issuer.isEmpty()) throw ApplicationConfigurationException("Couldn't read JWT issuer from environment")
    if (audience.isEmpty()) throw ApplicationConfigurationException("Couldn't read JWT audience from environment")

    return JWT
        .require(Algorithm.HMAC256(secret))
        .withAudience(audience)
        .withIssuer(issuer)
        .withClaimPresence("isHost")
        .withClaimPresence("quizId")
        .build()
}


/**
 * Validates the jwt returning a string containing the error message
 * when invalid, else returns JWtPrincipal
 */
fun validateJwt(credential: JWTCredential): JWTPrincipal {
    // Check that the claims are the correct format
    val quizId = credential.payload.getClaim("quizId").asString()
    if (quizId.isNullOrEmpty()) {
        throw JWTVerificationException("quizId '$quizId' is invalid. Must be non-empty.")
    }
    val isHost = credential.payload.getClaim("isHost").asBoolean()
        ?: throw JWTVerificationException("isHost '${credential.payload.getClaim("isHost")}' is invalid. Must be a boolean.")
    if (!isHost) {
        val userId = credential.payload.getClaim("userId").asString()
        if (userId.isNullOrEmpty()) {
            throw JWTVerificationException("userId '$userId' is invalid. Must be non-empty.")
        }
    }

    // JWT is valid
    return JWTPrincipal(credential.payload)
}
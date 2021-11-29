package com.ryangwaite

import com.auth0.jwt.JWT
import com.auth0.jwt.JWTVerifier
import com.auth0.jwt.algorithms.Algorithm
import com.ryangwaite.routes.speedRun
import io.ktor.application.*
import io.ktor.auth.*
import io.ktor.auth.jwt.*
import io.ktor.config.*
import io.ktor.response.*
import io.ktor.routing.*
import io.ktor.server.netty.*
import io.ktor.websocket.*
import io.ktor.http.cio.websocket.*

fun main(args: Array<String>): Unit = EngineMain.main(args)

fun Application.module(testing: Boolean = false) {
    install(WebSockets)

    install(Authentication) {
        jwt {
            verifier(buildJwtVerifier(environment))
            validate { credential ->
                // Check that the claims are the correct format
                val quizId = credential.payload.getClaim("quizId").asString() ?: return@validate null // auth fail
                if (quizId.isEmpty()) return@validate null
                credential.payload.getClaim("isHost").asBoolean() ?: return@validate null

                // JWT is valid
                JWTPrincipal(credential.payload)
            }
        }
    }

    configureRouting()
}

/**
 * Configure routing via extension so that it can be tested
 * independent of module.
 */
fun Application.configureRouting() {
    speedRun()
}

/**
 * Builds the JWT verifier from the environment config
 */
fun buildJwtVerifier(environment: ApplicationEnvironment): JWTVerifier {
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
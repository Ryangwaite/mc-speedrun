package com.ryangwaite

import com.auth0.jwt.JWT
import com.auth0.jwt.algorithms.Algorithm
import com.ryangwaite.routes.speedRun
import io.ktor.application.*
import io.ktor.auth.*
import io.ktor.auth.jwt.*
import io.ktor.config.*
import io.ktor.server.netty.*
import io.ktor.websocket.*

fun main(args: Array<String>): Unit = EngineMain.main(args)

fun Application.module(testing: Boolean = false) {
    install(WebSockets)
    installJwtAuthentication()
    configureRedis()
    configureRouting()
}

fun Application.installJwtAuthentication() {
    install(Authentication) {
        jwt {
            verifier(buildJwtVerifier(environment))
            validate { credential ->
                // Check that the claims are the correct format
                val quizId = credential.payload.getClaim("quizId").asString()
                if (quizId.isNullOrEmpty()) {
                    log.warn("quizId '$quizId' is invalid. Must be non-empty.")
                    return@validate null
                }
                val isHost = credential.payload.getClaim("isHost").asBoolean()
                if (isHost == null) {
                    log.warn("isHost '${credential.payload.getClaim("isHost")}' is invalid. Must be a boolean.")
                    return@validate null
                }
                if (!isHost) {
                    val userId = credential.payload.getClaim("userId").asString()
                    if (userId.isNullOrEmpty()) {
                        log.warn("userId '$userId' is invalid. Must be non-empty.")
                        return@validate null
                    }
                }

                // JWT is valid
                JWTPrincipal(credential.payload)
            }
        }
    }
}

/**
 * Configure routing via extension so that it can be tested
 * independent of module.
 */
fun Application.configureRouting() {
    speedRun()
}

/**
 * Builds the JWT verifier from the environment config.
 * This only verifies the constant config across paricipant and host JWTs.
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

fun Application.configureRedis() {
    RedisClient.init(environment.config)
}
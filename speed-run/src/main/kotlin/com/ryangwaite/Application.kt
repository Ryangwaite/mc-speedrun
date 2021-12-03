package com.ryangwaite

import com.auth0.jwt.exceptions.JWTVerificationException
import com.ryangwaite.config.RedisClient
import com.ryangwaite.config.buildJwtVerifier
import com.ryangwaite.config.validateJwt
import com.ryangwaite.routes.speedRun
import io.ktor.application.*
import io.ktor.auth.*
import io.ktor.auth.jwt.*
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
            validate { credential -> try {
                    validateJwt(credential)
                } catch (e: JWTVerificationException) {
                    log.warn(e.message)
                    null
                }
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

fun Application.configureRedis() {
    RedisClient.init(environment.config)
}
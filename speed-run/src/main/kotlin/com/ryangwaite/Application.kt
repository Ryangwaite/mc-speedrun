package com.ryangwaite

import com.ryangwaite.connection.IPublish
import com.ryangwaite.loader.QuizLoader
import com.ryangwaite.redis.IDataStore
import com.ryangwaite.redis.RedisClient
import com.ryangwaite.routes.speedRun
import com.ryangwaite.subscribe.ISubscribe
import io.ktor.application.*
import io.ktor.config.*
import io.ktor.features.*
import io.ktor.server.netty.*
import io.ktor.websocket.*

fun main(args: Array<String>): Unit = EngineMain.main(args)

fun Application.module(testing: Boolean = false) {
    install(WebSockets)

    configureQuizLoader()

    val redisClient = RedisClient(environment.config)
    configureRouting(
        redisClient,
        redisClient,
        redisClient
    )

    if (environment.developmentMode) {
        install(CORS) {
            log.info("Enabling CORS from any host")
            anyHost()
        }
    }
}

/**
 * Configure routing via extension so that it can be tested
 * independent of module.
 */
fun Application.configureRouting(dataStore: IDataStore, subscriber: ISubscribe, publisher: IPublish) {
    speedRun(dataStore, subscriber, publisher)
}

fun Application.configureQuizLoader() {
    val quizPath = environment.config.property("quiz.directory").getString()
    if (quizPath.isEmpty()) throw ApplicationConfigurationException("Couldn't read quiz directory from environment")
    QuizLoader.init(quizPath)
}
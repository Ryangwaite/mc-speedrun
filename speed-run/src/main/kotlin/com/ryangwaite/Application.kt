package com.ryangwaite

import com.ryangwaite.connection.IPublish
import com.ryangwaite.loader.QuizLoader
import com.ryangwaite.notify.INotifier
import com.ryangwaite.notify.RabbitMqNotifier
import com.ryangwaite.redis.IDataStore
import com.ryangwaite.redis.RedisClient
import com.ryangwaite.routes.speedRun
import com.ryangwaite.subscribe.ISubscribe
import io.ktor.server.application.*
import io.ktor.server.config.*
import io.ktor.server.netty.*
import io.ktor.server.plugins.cors.*
import io.ktor.server.websocket.*

fun main(args: Array<String>): Unit = EngineMain.main(args)

fun Application.module(testing: Boolean = false) {
    install(WebSockets)

    configureQuizLoader()

    val notifier = RabbitMqNotifier(environment.config)

    val redisClient = RedisClient(environment.config)
    configureRouting(
        redisClient,
        redisClient,
        redisClient,
        notifier,
    )

    if (environment.developmentMode) {
        install(CORS) {
            this@module.log.info("Enabling CORS from any host")
            anyHost()
        }
    }
}

/**
 * Configure routing via extension so that it can be tested
 * independent of module.
 */
fun Application.configureRouting(dataStore: IDataStore, subscriber: ISubscribe, publisher: IPublish, notifier: INotifier) {
    speedRun(dataStore, subscriber, publisher, notifier)
}

fun Application.configureQuizLoader() {
    val quizPath = environment.config.property("quiz.directory").getString()
    if (quizPath.isEmpty()) throw ApplicationConfigurationException("Couldn't read quiz directory from environment")
    QuizLoader.init(quizPath)
}
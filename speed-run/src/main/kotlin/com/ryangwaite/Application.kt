package com.ryangwaite

import com.ryangwaite.connection.IPublish
import com.ryangwaite.loader.QuizLoader
import com.ryangwaite.notify.*
import com.ryangwaite.redis.IDataStore
import com.ryangwaite.redis.RedisClient
import com.ryangwaite.routes.healthCheck
import com.ryangwaite.routes.speedRun
import com.ryangwaite.subscribe.ISubscribe
import io.ktor.server.application.*
import io.ktor.server.config.*
import io.ktor.server.netty.*
import io.ktor.server.plugins.cors.*
import io.ktor.server.websocket.*
import kotlinx.datetime.Clock
import kotlinx.datetime.Instant

fun main(args: Array<String>): Unit = EngineMain.main(args)

fun Application.module(testing: Boolean = false) {

    // Load notifier
    val notifier = when(val notifierType = environment.config.property("notify.destination_type").getString()) {
        "rabbitmq" -> RabbitMqNotifier(environment.config)
        "sqs" -> SqsNotifier(environment.config)
        else -> throw ApplicationConfigurationException("Invalid notifier destination type '$notifierType'")
    }

    configureQuizLoader()

    notifier.notify(Event("test", "somwhere", "id", Clock.System.now(), EventData("quizid")))

    val redisClient = RedisClient(environment.config)

    install(WebSockets)
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
    healthCheck()
}

fun Application.configureQuizLoader() {
    val quizPath = environment.config.property("quiz.directory").getString()
    if (quizPath.isEmpty()) throw ApplicationConfigurationException("Couldn't read quiz directory from environment")
    QuizLoader.init(quizPath)
}
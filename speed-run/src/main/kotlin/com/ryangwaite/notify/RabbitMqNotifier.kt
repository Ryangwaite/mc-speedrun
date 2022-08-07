package com.ryangwaite.notify

import com.rabbitmq.jms.admin.RMQConnectionFactory
import com.rabbitmq.jms.admin.RMQDestination
import io.ktor.server.config.*
import javax.jms.Destination

/**
 * Notifier for sending messages to RabbitMQ levaraging the Java
 * Message Service API
 */
class RabbitMqNotifier(val config: ApplicationConfig): JmsNotifier() {
    override val connectionFactory = RMQConnectionFactory().apply {
        host = config.property("notify.rabbitmq.host").getString()
        port = config.property("notify.rabbitmq.port").getString().toInt()
        username = config.property("notify.rabbitmq.username").getString()
        password = config.property("notify.rabbitmq.password").getString()
    }

    override val destination: Destination
    init {
        val queueName = config.property("notify.queue_name").getString()
        destination = RMQDestination(queueName, true, false).apply {
        }
    }
}
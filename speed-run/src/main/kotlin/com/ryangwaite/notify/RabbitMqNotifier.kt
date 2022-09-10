package com.ryangwaite.notify

import com.rabbitmq.client.Connection
import com.rabbitmq.client.ConnectionFactory
import com.rabbitmq.client.MessageProperties
import io.ktor.server.config.*
import kotlinx.serialization.ExperimentalSerializationApi
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.encodeToStream
import java.io.ByteArrayOutputStream

class RabbitMqNotifier(val config: ApplicationConfig): INotifier {

    private val queueName = config.property("notify.queue_name").getString()

    private val factory: ConnectionFactory = ConnectionFactory().apply {
        host = config.property("notify.rabbitmq.host").getString()
        port = config.property("notify.rabbitmq.port").getString().toInt()
        username = config.property("notify.rabbitmq.username").getString()
        password = config.property("notify.rabbitmq.password").getString()
    }
    private val connection: Connection = factory.newConnection()

    /**
     * Publishes the [event] on the RabbitMQ queue
     */
    @ExperimentalSerializationApi
    override fun notify(event: Event) {
        // FIXME: It is expensive to reopen a channel just for a single operation. Change
        // this to re-use a channel per notification.
        connection.createChannel().use {channel ->
            channel.queueDeclare(this.queueName, true, false, false, null)

            val eventByteStream = ByteArrayOutputStream()
            Json.encodeToStream(event, eventByteStream)
            channel.basicPublish(
                "", // Use default exchange which enqueues msg into the queue with the same name as the routing key
                this.queueName,
                MessageProperties.PERSISTENT_TEXT_PLAIN,
                eventByteStream.toByteArray(),
            )
        }
    }
}
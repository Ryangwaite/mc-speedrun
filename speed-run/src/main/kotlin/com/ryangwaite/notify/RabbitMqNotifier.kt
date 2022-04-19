package com.ryangwaite.notify

import com.rabbitmq.client.Connection
import com.rabbitmq.client.ConnectionFactory
import com.rabbitmq.client.MessageProperties
import io.ktor.server.config.*
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.encodeToStream
import java.io.ByteArrayOutputStream

class RabbitMqNotifier(val config: ApplicationConfig): INotifier {

    private val queueName = config.property("rabbitmq.queue_name").getString()

    private val factory: ConnectionFactory = ConnectionFactory().apply {
        host = config.property("rabbitmq.host").getString()
        port = config.property("rabbitmq.port").getString().toInt()
        username = config.property("rabbitmq.username").getString()
        password = config.property("rabbitmq.password").getString()
    }
    private val connection: Connection = factory.newConnection()

    override fun notify(event: Event) {
        connection.createChannel().use {channel ->
            channel.queueDeclare(this.queueName, true, false, false, null)

            val eventByteStream = ByteArrayOutputStream()
            Json.encodeToStream(event, eventByteStream)
            channel.basicPublish(
                "",
                this.queueName,
                MessageProperties.PERSISTENT_TEXT_PLAIN,
                eventByteStream.toByteArray(),
            )
        }
    }
}
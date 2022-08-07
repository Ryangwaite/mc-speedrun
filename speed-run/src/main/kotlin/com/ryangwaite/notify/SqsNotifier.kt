package com.ryangwaite.notify

import com.amazon.sqs.javamessaging.ProviderConfiguration
import com.amazon.sqs.javamessaging.SQSConnectionFactory
import io.ktor.server.config.*
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider
import software.amazon.awssdk.services.sqs.SqsClient
import javax.jms.ConnectionFactory
import javax.jms.Destination

class SqsNotifier(val config: ApplicationConfig): JmsNotifier() {

    override val connectionFactory: ConnectionFactory
    init {
        val clientBuilder = SqsClient.builder()
            .credentialsProvider(DefaultCredentialsProvider.builder().build())
        connectionFactory = SQSConnectionFactory(
            ProviderConfiguration(),
            clientBuilder,
        )
    }

    override val destination: Destination
    init {
        val queueName = config.property("notify.queue_name").getString()
        connectIfDisconnected()
        destination = session!!.createQueue(queueName)
    }
}
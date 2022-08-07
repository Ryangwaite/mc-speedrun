package com.ryangwaite.notify

import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import javax.jms.Connection
import javax.jms.ConnectionFactory
import javax.jms.Destination
import javax.jms.Session
import kotlin.random.Random

abstract class JmsNotifier: INotifier {
    abstract val connectionFactory: ConnectionFactory
    abstract val destination: Destination

    private var connection: Connection? = null
    protected var session: Session? = null

    /**
     * Establishes both a connection and session if either is not
     * yet established
     */
    protected fun connectIfDisconnected() {
        if (this.connection == null) {
            this.connection = connectionFactory.createConnection()
        }
        if (this.session == null) {
            this.session = this.connection?.createSession(false, Session.AUTO_ACKNOWLEDGE)
        }
    }

    override fun notify(event: Event) {
        connectIfDisconnected()

        val producer = this.session!!.createProducer(this.destination)
        val serializedEvent = Json.encodeToString(event)
        val msg = session!!.createTextMessage(serializedEvent).apply {
            // Use a unique group id per message since ordering isn't important at all and this gives more throughput.
            // Also this is required for AWS FIFO queues.
            // See: https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/using-messagegroupid-property.html#avoding-processing-duplicates-in-multiple-producer-consumer-system
            setStringProperty("JMSXGroupID", Random.nextInt().toString())
            // Note for RabbitMQ the Content-Type in the Content-Header frame is always application/octet-stream
            // See https://github.com/rabbitmq/rabbitmq-jms-client/issues/19 for a discussion. As a workaround,
            // the content-type is set in a JMS header.
            setStringProperty("content-type", "application/json")
        }

        producer.send(msg)
        producer.close()
    }
}
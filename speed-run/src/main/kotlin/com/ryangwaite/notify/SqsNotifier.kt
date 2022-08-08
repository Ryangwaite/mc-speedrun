package com.ryangwaite.notify

import io.ktor.server.config.*
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider
import software.amazon.awssdk.services.sqs.SqsClient
import software.amazon.awssdk.services.sqs.model.GetQueueUrlRequest
import software.amazon.awssdk.services.sqs.model.MessageAttributeValue
import software.amazon.awssdk.services.sqs.model.SendMessageRequest
import kotlin.random.Random

class SqsNotifier(val config: ApplicationConfig): INotifier {

    private val client = SqsClient.builder()
        .credentialsProvider(DefaultCredentialsProvider.builder().build())
        .build()

    private val queueUrl: String
    init {
        val queueName = config.property("notify.queue_name").getString()
        val getQueueUrlReq = GetQueueUrlRequest.builder()
            .queueName(queueName)
            .build()
        queueUrl = client.getQueueUrl(getQueueUrlReq).queueUrl()
    }

    override fun notify(event: Event) {
        val serializedEvent = Json.encodeToString(event)

        val sendMsgRequest = SendMessageRequest.builder()
            .queueUrl(queueUrl)
            .messageGroupId(Random.nextInt().toString())
            .messageAttributes(mapOf(
                "content-type" to MessageAttributeValue.builder()
                    .dataType("String")
                    .stringValue("application/json")
                    .build()
            ))
            .messageBody(serializedEvent)
            .build()

        this.client.sendMessage(sendMsgRequest)
    }
}
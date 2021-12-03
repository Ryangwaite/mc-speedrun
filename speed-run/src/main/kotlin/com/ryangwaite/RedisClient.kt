package com.ryangwaite

import io.ktor.config.*
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.reactive.asFlow
import org.redisson.Redisson
import org.redisson.api.RedissonRxClient
import org.redisson.client.codec.StringCodec
import org.redisson.config.Config

object RedisClient {

    private var INSTANCE: RedissonRxClient? = null

    fun init(config: ApplicationConfig) {

        val host = config.property("redis.host").getString()
        val port = config.property("redis.port").getString()

        if (host.isEmpty()) throw ApplicationConfigurationException("Couldn't read Redis host from environment")
        if (port.isEmpty()) throw ApplicationConfigurationException("Couldn't read Redis port from environment")

        val address = "redis://$host:$port"

        val config = Config().apply {
            // Note: dont use cluster mode cos docker doesn't support it in bridge networking mode apparantly??? Need to check this
            useSingleServer().setAddress(address)
        }

        this.INSTANCE = Redisson.create(config).rxJava()
        println("Configured redis client for instance '$address'") // todo replace with proper log
    }

    /**
     * Get a Flow for the topic pointed to by topicKey
     */
    fun subscribeToTopic(topicKey: String): Flow<String> {
        val topic = INSTANCE!!.getTopic(topicKey, StringCodec())
        val flow = topic.getMessages(String::class.java).asFlow()
        return flow
    }
}
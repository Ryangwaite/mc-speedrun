package com.ryangwaite.redis

import com.ryangwaite.connection.IPublish
import com.ryangwaite.subscribe.ISubscribe
import io.ktor.config.*
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.reactive.asFlow
import kotlinx.coroutines.rx3.await
import org.redisson.Redisson
import org.redisson.api.RedissonRxClient
import org.redisson.client.codec.StringCodec
import org.redisson.config.Config

class RedisClient(config: ApplicationConfig): IDataStore, ISubscribe, IPublish {

    private val redissonClient: RedissonRxClient
    init {
        val host = config.property("redis.host").getString()
        val port = config.property("redis.port").getString()

        if (host.isEmpty()) throw ApplicationConfigurationException("Couldn't read Redis host from environment")
        if (port.isEmpty()) throw ApplicationConfigurationException("Couldn't read Redis port from environment")

        val address = "redis://$host:$port"

        val config = Config().apply {
            // Note: dont use cluster mode cos docker doesn't support it in bridge networking mode apparantly??? Need to check this
            useSingleServer().setAddress(address)
            codec = StringCodec()
        }

        redissonClient = Redisson.create(config).rxJava()
        println("Configured redis client for instance '$address'") // todo replace with proper log
    }

    /**
     * Get a Flow for the topic pointed to by topicKey
     */
    override fun subscribeToTopic(topicKey: String): Flow<String> {
        val topic = this.redissonClient.getTopic(topicKey)
        val flow = topic.getMessages(String::class.java).asFlow()
        return flow
    }

    /**
     * Stores the username for the user, overriding any existing one
     */
    override suspend fun setUsername(quizId: String, userId: String, name: String) {
        val bucket = this.redissonClient.getBucket<String>("$quizId:$userId:username")
        bucket.set(name).await()
    }

    /**
     * Adds the item to the leaderboard if it doesn't yet exist for this userId,
     * else updates the score
     */
    override suspend fun addLeaderboardItem(quizId: String, userId: String, score: Int) {
        val leaderboard = this.redissonClient.getScoredSortedSet<String>("$quizId:leaderboard")
        leaderboard.add(score.toDouble(), userId).await()
    }
}
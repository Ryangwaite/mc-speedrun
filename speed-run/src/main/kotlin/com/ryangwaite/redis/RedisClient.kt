package com.ryangwaite.redis

import com.ryangwaite.connection.IPublish
import com.ryangwaite.models.LeaderboardItem
import com.ryangwaite.subscribe.ISubscribe
import com.ryangwaite.subscribe.SubscriptionMessages
import io.ktor.config.*
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.reactive.asFlow
import kotlinx.coroutines.rx3.await
import kotlinx.coroutines.rx3.awaitSingle
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
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

    // Redis key builders
    private fun usernameKey(quizId: String, userId: String) = "$quizId:$userId:username"
    private fun leaderboardKey(quizId: String) = "$quizId:leaderboard"
    private fun subscriptionKey(quizId: String) = "$quizId:subscribe"
    private fun quizNameKey(quizId: String) = "$quizId:quizName"
    private fun selectedCategoriesKey(quizId: String) = "$quizId:selectedCategories"
    private fun questionDurationKey(quizId: String) = "$quizId:questionDuration"
    private fun selectedQuestionIndexesKey(quizId: String) = "$quizId:selectedQuestionIndexes"

    /**
     * Get a Flow for the topic pointed to by topicKey
     */
    override fun subscribeToQuizEvents(quizId: String): Flow<String> {
        val topic = this.redissonClient.getTopic(subscriptionKey(quizId))
        return topic.getMessages(String::class.java).asFlow()
    }

    private suspend fun getUsername(quizId: String, userId: String): String {
        val bucket = this.redissonClient.getBucket<String>(usernameKey(quizId, userId))
        return bucket.get().awaitSingle()
    }

    /**
     * Stores the username for the user, overriding any existing one
     */
    override suspend fun setUsername(quizId: String, userId: String, name: String) {
        val bucket = this.redissonClient.getBucket<String>(usernameKey(quizId, userId))
        bucket.set(name).await()
    }

    /**
     * Adds the item to the leaderboard if it doesn't yet exist for this userId,
     * else updates the score
     */
    override suspend fun addLeaderboardItem(quizId: String, userId: String, score: Int) {
        val leaderboard = this.redissonClient.getScoredSortedSet<String>(leaderboardKey(quizId))
        leaderboard.add(score.toDouble(), userId).await()
    }

    override suspend fun getLeaderboard(quizId: String): List<LeaderboardItem> {
        val leaderboard = this.redissonClient.getScoredSortedSet<String>(leaderboardKey(quizId))
        val items = leaderboard.readAll().await()
        return items.map {userId: String ->
            // Note: This could be a bit of a bottleneck
            val userName = this.getUsername(quizId, userId)
            val score = leaderboard.getScore(userId).awaitSingle().toInt()
            LeaderboardItem(userId, userName, score)
        }
    }

    override suspend fun setQuizName(quizId: String, name: String) {
        val bucket = this.redissonClient.getBucket<String>(quizNameKey(quizId))
        bucket.set(name).await()
    }

    override suspend fun setSelectedCategories(quizId: String, categories: List<String>) {
        val list = redissonClient.getList<String>(selectedCategoriesKey(quizId))
        list.addAll(categories).await()
    }

    override suspend fun setQuestionDuration(quizId: String, duration: Int) {
        val bucket = this.redissonClient.getBucket<Int>(questionDurationKey(quizId))
        bucket.set(duration).await()
    }

    override suspend fun setSelectedQuestionIndexes(quizId: String, indexes: List<Int>) {
        val list = redissonClient.getList<Int>(selectedQuestionIndexesKey(quizId))
        list.addAll(indexes).await()
    }

    override suspend fun publishQuizEvent(quizId: String, msg: SubscriptionMessages) {
        val topic = this.redissonClient.getTopic(subscriptionKey(quizId))
        topic.publish(Json.encodeToString(msg)).await()
    }
}
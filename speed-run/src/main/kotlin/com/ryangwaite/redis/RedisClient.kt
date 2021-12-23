package com.ryangwaite.redis

import com.ryangwaite.connection.IPublish
import com.ryangwaite.loader.QuizLoader
import com.ryangwaite.models.*
import com.ryangwaite.subscribe.ISubscribe
import com.ryangwaite.subscribe.SubscriptionMessages
import io.ktor.config.*
import kotlinx.coroutines.async
import kotlinx.coroutines.awaitAll
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.toCollection
import kotlinx.coroutines.reactive.asFlow
import kotlinx.coroutines.reactive.awaitSingle
import kotlinx.coroutines.rx3.await
import kotlinx.coroutines.rx3.awaitSingle
import kotlinx.serialization.Serializable
import kotlinx.serialization.decodeFromString
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import org.redisson.Redisson
import org.redisson.api.RListRx
import org.redisson.api.RedissonRxClient
import org.redisson.client.codec.IntegerCodec
import org.redisson.client.codec.LongCodec
import org.redisson.client.codec.StringCodec
import org.redisson.config.Config
import kotlin.math.exp


@Serializable
internal data class ParticipantAnswer(
    val selectedOptionIndexes: List<Int>,
    val answeredInDuration: Int
)

private enum class Mark {
    CORRECT, INCORRECT, `TIME-EXPIRED`
}

/**
 * Container for holding 4 elements
 */
private data class Quad<T1, T2, T3, T4>(val t1: T1, val t2: T2,val t3: T3, val t4: T4)

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

    // Redis individual key builders
    private fun userIdsKey(quizId: String) = "$quizId:userIds"
    private fun usernameKey(quizId: String, userId: String) = "$quizId:$userId:username"
    private fun leaderboardKey(quizId: String) = "$quizId:leaderboard"
    private fun subscriptionKey(quizId: String) = "$quizId:subscribe"
    private fun quizNameKey(quizId: String) = "$quizId:quizName"
    private fun selectedCategoriesKey(quizId: String) = "$quizId:selectedCategories"
    private fun questionDurationKey(quizId: String) = "$quizId:questionDuration"
    private fun selectedQuestionIndexesKey(quizId: String) = "$quizId:selectedQuestionIndexes"
    private fun participantAnswerKey(quizId: String, userId: String, questionIndex: Int) = "$quizId:$userId:answer:$questionIndex"

    override suspend fun addUserId(quizId: String, userId: String) {
        val userIds = this.redissonClient.getList<String>(userIdsKey(quizId))
        userIds.add(userId).await()
    }

    override suspend fun getUserIds(quizId: String): List<String> {
        val userIds = this.redissonClient.getList<String>(userIdsKey(quizId))
        return userIds.readAll().await()
    }

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
    override suspend fun setLeaderboardItem(quizId: String, userId: String, score: Int) {
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

    override suspend fun getUserScore(quizId: String, userId: String): Int {
        val leaderboard = this.redissonClient.getScoredSortedSet<String>(leaderboardKey(quizId))
        val score = leaderboard.getScore(userId).awaitSingle().toInt()
        return score
    }

    override suspend fun setQuizName(quizId: String, name: String) {
        val bucket = this.redissonClient.getBucket<String>(quizNameKey(quizId))
        bucket.set(name).await()
    }

    override suspend fun setSelectedCategories(quizId: String, categories: List<String>) {
        val list = redissonClient.getList<String>(selectedCategoriesKey(quizId))
        list.addAll(categories).await()
    }

    override suspend fun getQuestionDuration(quizId: String): Int {
        val bucket = this.redissonClient.getBucket<Int>(questionDurationKey(quizId), IntegerCodec())
        return bucket.get().awaitSingle()
    }

    override suspend fun setQuestionDuration(quizId: String, duration: Int) {
        val bucket = this.redissonClient.getBucket<Int>(questionDurationKey(quizId), IntegerCodec())
        bucket.set(duration).await()
    }

    override suspend fun setSelectedQuestionIndexes(quizId: String, indexes: List<Int>) {
        val list = redissonClient.getList<Int>(selectedQuestionIndexesKey(quizId), IntegerCodec())
        list.addAll(indexes).await()
    }

    override suspend fun getSelectedQuestionIndexes(quizId: String): List<Int> {
        val list = redissonClient.getList<Int>(selectedQuestionIndexesKey(quizId), IntegerCodec())
        return list.readAll().await()
    }

    override suspend fun setParticipantAnswer(
        quizId: String,
        userId: String,
        questionIndex: Int,                         // This is the index in the original non-filtered question set
        selectedOptionIndexes: List<Int>,
        answeredInDuration: Int
    ) {
        val bucket = redissonClient.getBucket<String>(participantAnswerKey(quizId, userId, questionIndex))
        val content = Json.encodeToString(ParticipantAnswer(selectedOptionIndexes, answeredInDuration))
        bucket.set(content).await()
    }

    /**
     * Gets the quiz summary
     *
     * TODO: split into multiple methods
     */
    override suspend fun getQuizSummary(quizId: String): List<VerboseQuestionSummary> {
        val userIds = getUserIds(quizId)
        val selectedQuestionIndexes = getSelectedQuestionIndexes(quizId)
        val answerKeys = userIds.flatMap { userId ->
            selectedQuestionIndexes.map { questionIndex ->
                participantAnswerKey(quizId, userId, questionIndex)
            }
        }

        val originalQuestions = QuizLoader.load(quizId)
        val questionDuration = getQuestionDuration(quizId)

        val participantAnswers = coroutineScope {
            answerKeys.map { key ->
                async {
                    // Fetch and decode the answer from Redis
                    val bucket = this@RedisClient.redissonClient.getBucket<String>(key)
                    if (!bucket.isExists.await()) {
                        // Question hasn't been answered yet
                        return@async null
                    }

                    val serializedAnswer = bucket.get().awaitSingle()
                    val participantAnswer = Json.decodeFromString<ParticipantAnswer>(serializedAnswer)

                    val keyParts = key.split(":") // key is of the form ""$quizId:$userId:answer:$questionIndex""
                    val userId = keyParts[1]
                    val questionIndex = keyParts.last().toInt()
                    val username = getUsername(quizId, userId)

                    // See if time expired
                    if (participantAnswer.answeredInDuration > questionDuration) {
                        return@async Quad(key, username, participantAnswer, Mark.`TIME-EXPIRED`)
                    }

                    // Find the corresponding question
                    val correctAnswers = originalQuestions[questionIndex].answers

                    // Mark it
                    val mark = if (participantAnswer.selectedOptionIndexes.containsAll(correctAnswers) && correctAnswers.containsAll(participantAnswer.selectedOptionIndexes)) {
                        Mark.CORRECT
                    } else {
                        Mark.INCORRECT
                    }
                    return@async Quad(key, username, participantAnswer, mark)
                }
            }.awaitAll().filterNotNull()
        }

        val selectedOptionIndexes = getSelectedQuestionIndexes(quizId)

        val questionSummaries = selectedOptionIndexes.map { questionIndex ->
            val qAndA = originalQuestions[questionIndex]
            val correctAnswerers = mutableListOf<AnswererWithOptions>()
            val incorrectAnswerers = mutableListOf<AnswererWithOptions>()
            val timeExpiredAnswerers = mutableListOf<AnswererWithOptions>()

            participantAnswers.forEach { (key, username, participantAnswer, mark) ->
                if (!key.endsWith(":$questionIndex")) {
                    // Not an answer for this summary
                    return@forEach
                }
                val userId = key.split(":")[1]
                val answerer = AnswererWithOptions(userId, username, participantAnswer.selectedOptionIndexes)
                when (mark) {
                    Mark.CORRECT -> correctAnswerers.add(answerer)
                    Mark.INCORRECT -> incorrectAnswerers.add(answerer)
                    Mark.`TIME-EXPIRED` -> timeExpiredAnswerers.add(answerer)
                }
            }
            return@map VerboseQuestionSummary(qAndA.question, qAndA.options, qAndA.answers, correctAnswerers, incorrectAnswerers, timeExpiredAnswerers)
        }
        return questionSummaries
    }

    override suspend fun isQuizFinished(quizId: String): Boolean {
        // Get the list of participants in the quiz
        val userIds = getUserIds(quizId) // TODO: Fix this. It is returning an empty list
        val questionIndexes = getSelectedQuestionIndexes(quizId)

        val expectedQuestionAnswerKeys = userIds.flatMap { userId ->
            questionIndexes.map { questionIndex ->
                participantAnswerKey(quizId, userId, questionIndex)
            }
        }

        print("userIds = ${userIds}, questionIndexes = ${questionIndexes}, expectedQuestionAnswerKeys = ${expectedQuestionAnswerKeys}")

        // If all questions have an answer then the quiz is finished
        val quizFinished = coroutineScope {
            expectedQuestionAnswerKeys.map {
                async {
                    this@RedisClient.redissonClient.getBucket<String>(it).isExists.await()
                }
            }.awaitAll().all { it }
        }
        return quizFinished
    }

    override suspend fun publishQuizEvent(quizId: String, msg: SubscriptionMessages) {
        val topic = this.redissonClient.getTopic(subscriptionKey(quizId))
        topic.publish(Json.encodeToString(msg)).await()
    }
}
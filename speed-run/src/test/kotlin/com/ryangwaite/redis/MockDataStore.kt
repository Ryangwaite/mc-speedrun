package com.ryangwaite.redis

import com.ryangwaite.models.*
import kotlinx.datetime.Clock
import kotlinx.datetime.Instant
import kotlinx.serialization.decodeFromString
import kotlinx.serialization.json.Json
import java.io.File
import kotlin.math.roundToInt

private data class Quiz(
    var name: String = "",
    var selectedCategories: MutableList<String> = mutableListOf(),
    var questionDuration: Int = 120,
    var selectedQuestionIndexes: MutableList<Int> = mutableListOf(),
    var quizStartTime: Instant = Clock.System.now(),
    var quizStopTime: Instant = Clock.System.now(),
)

data class ParticipantAnswer(
    var questionIndex: Int,
    var selectedOptionIndexes: List<Int>,
    var answeredInDuration: Int
)

private data class User(
    var userId: String,
    var username: String = "",
    var score: Int = 0,
    var answers: MutableList<ParticipantAnswer> = mutableListOf(),
    var stopTime: Instant = Clock.System.now(),
)

class MockDataStore(val questionsFile: String): IDataStore {
    private var questions: List<QuestionAndAnswers>
    init {
        val file = File(questionsFile)
        questions = Json.decodeFromString(file.readText())
    }

    private val quizzes = mutableMapOf<String, Quiz>()
    private val users = mutableMapOf<String, MutableMap<String, User>>()

    override suspend fun addUserId(quizId: String, userId: String) {
        if (!users.containsKey(quizId)) users[quizId] = mutableMapOf()
        users[quizId]!![userId] = User(userId)
    }

    override suspend fun getUserIds(quizId: String): List<String> {
        return users[quizId]?.keys?.toList() ?: listOf()
    }

    override suspend fun setUsername(quizId: String, userId: String, name: String) {
        users[quizId]!![userId]!!.username = name
    }

    override suspend fun setLeaderboardItem(quizId: String, userId: String, score: Int) {
        users[quizId]!![userId]!!.score = score
    }

    override suspend fun getLeaderboard(quizId: String): List<LeaderboardItem> {
        return users[quizId]?.map {
            LeaderboardItem(it.key, it.value.username, it.value.score)
        } ?: listOf()
    }

    override suspend fun getUserScore(quizId: String, userId: String): Int {
        return users[quizId]!![userId]!!.score
    }

    override suspend fun setQuizName(quizId: String, name: String) {
        createQuizIfNotExists(quizId)
        quizzes[quizId]!!.name = name
    }

    override suspend fun setSelectedCategories(quizId: String, categories: List<String>) {
        createQuizIfNotExists(quizId)
        quizzes[quizId]!!.selectedCategories = categories.toMutableList()
    }

    override suspend fun setQuestionDuration(quizId: String, duration: Int) {
        createQuizIfNotExists(quizId)
        quizzes[quizId]!!.questionDuration = duration
    }

    override suspend fun getQuestionDuration(quizId: String): Int {
        return quizzes[quizId]!!.questionDuration
    }

    override suspend fun setSelectedQuestionIndexes(quizId: String, indexes: List<Int>) {
        createQuizIfNotExists(quizId)
        quizzes[quizId]!!.selectedQuestionIndexes = indexes.toMutableList()
    }

    override suspend fun getSelectedQuestionIndexes(quizId: String): List<Int> {
        return quizzes[quizId]!!.selectedQuestionIndexes
    }

    override suspend fun setQuizStartTime(quizId: String, time: Instant) {
        createQuizIfNotExists(quizId)
        quizzes[quizId]!!.quizStartTime = time
    }

    override suspend fun getQuizStartTime(quizId: String): Instant {
        return quizzes[quizId]!!.quizStartTime
    }

    override suspend fun setQuizStopTime(quizId: String, time: Instant) {
        createQuizIfNotExists(quizId)
        quizzes[quizId]!!.quizStopTime = time
    }

    override suspend fun getQuizStopTime(quizId: String): Instant {
        return quizzes[quizId]!!.quizStopTime
    }

    override suspend fun setParticipantAnswer(
        quizId: String,
        userId: String,
        questionIndex: Int,
        selectedOptionIndexes: List<Int>,
        answeredInDuration: Int
    ) {
        users[quizId]!![userId]!!.answers.add(ParticipantAnswer(questionIndex, selectedOptionIndexes, answeredInDuration))
    }

    override suspend fun getQuizSummary(quizId: String): List<VerboseQuestionSummary> {
        val quiz = quizzes[quizId]!!
        val users = users[quizId]!!
        return questions.mapIndexed { index, qAndA, ->
            if (!quiz.selectedQuestionIndexes.contains(index)) return@mapIndexed null
            val correctAnswerers = mutableListOf<AnswererWithOptions>()
            val incorrectAnswerers = mutableListOf<AnswererWithOptions>()
            val timeExpiredAnswerers = mutableListOf<AnswererWithOptions>()

            users.values.forEach { user ->
                // Find the answer for this question
                val answeredQuestion = user.answers.find { it.questionIndex == index}
                val answererWithOptions = AnswererWithOptions(user.userId, user.username, answeredQuestion!!.selectedOptionIndexes, answeredQuestion.answeredInDuration)
                if (answeredQuestion.answeredInDuration > quiz.questionDuration) {
                    // Time expired user
                    timeExpiredAnswerers.add(answererWithOptions)
                } else if (qAndA.answers.toSet() == answeredQuestion.selectedOptionIndexes.toSet()) {
                    // Correct answer by user
                    correctAnswerers.add(answererWithOptions)
                } else {
                    // Incorrect answer by user
                    incorrectAnswerers.add(answererWithOptions)
                }
            }
            VerboseQuestionSummary(qAndA.question, qAndA.options, qAndA.answers, correctAnswerers, incorrectAnswerers, timeExpiredAnswerers)
        }.filterNotNull()
    }

    override suspend fun isQuizFinished(quizId: String): Boolean {
        return users[quizId]!!.keys.all { isParticipantFinished(quizId, it) }
    }

    override suspend fun isParticipantFinished(quizId: String, userId: String): Boolean {
        val completedQuestionIndexes = users[quizId]!![userId]!!.answers.map { it.questionIndex }
        return completedQuestionIndexes.toSet() == quizzes[quizId]!!.selectedQuestionIndexes.toSet()
    }

    override suspend fun setParticipantStopTime(quizId: String, userId: String, time: Instant) {
        users[quizId]!![userId]!!.stopTime = time
    }

    override suspend fun getParticipantStopTime(quizId: String, userId: String): Instant {
        return users[quizId]!![userId]!!.stopTime
    }

    /**
     * Adds a new quiz object for the given id if one doesn't yet exist
     */
    private fun createQuizIfNotExists(quizId: String) = if (!quizzes.containsKey(quizId)) {
        quizzes[quizId] = Quiz()
    } else Unit

    /**
     * Returns the users answer for the [selectedQuestionIndex]
     */
    fun getParticipantAnswer(quizId: String, userId: String, selectedQuestionIndex: Int): ParticipantAnswer {
        return users[quizId]!![userId]!!.answers.find { it.questionIndex == selectedQuestionIndex }!!
    }

    /**
     * Returns the quiz summary for the host
     */
    suspend fun getHostQuizSummary(quizId: String): Triple<Long, Int, List<HostQuestionSummary>> {
        val quizSummary = this.getQuizSummary(quizId)
        val answerDurations = mutableListOf<Int>()
        val hostQuestionSummary = quizSummary.map {
            // Only interested in the durations for non-timed out questions
            answerDurations.addAll(it.correctAnswerers.map { it.answeredInDuration })
            answerDurations.addAll(it.incorrectAnswerers.map { it.answeredInDuration })
            HostQuestionSummary(
                it.question,
                it.options,
                it.correctOptions,
                it.correctAnswerers.map { Answerer(it.userId, it.name) },
                it.incorrectAnswerers.map { Answerer(it.userId, it.name) },
                it.timeExpiredAnswerers.map { Answerer(it.userId, it.name) }
            )
        }
        val avgAnswerTimeMillis = if (answerDurations.size > 0) (answerDurations.average() * 1000).roundToInt() else 0
        val totalTimeElapsed = Clock.System.now().epochSeconds - this.getQuizStartTime(quizId).epochSeconds

        return Triple(totalTimeElapsed, avgAnswerTimeMillis, hostQuestionSummary)
    }

    /**
     * Returns the quiz summary for the participant
     */
    suspend fun getParticipantQuizSummary(quizId: String, userId: String): Triple<Long, Int, List<ParticipantQuestionSummary>> {
        val quizSummary = this.getQuizSummary(quizId)
        val answerDurations = mutableListOf<Int>()
        val participantQuestionSummary = quizSummary.map {
            val participantAnswer = (it.correctAnswerers + it.incorrectAnswerers + it.timeExpiredAnswerers).first {
                it.userId == userId
            }

            if (!it.timeExpiredAnswerers.contains(participantAnswer)) {
                answerDurations.add(participantAnswer.answeredInDuration)
            }

            ParticipantQuestionSummary(
                it.question,
                it.options,
                it.correctOptions,
                participantAnswer.participantOptions,
                it.correctAnswerers.map { Answerer(it.userId, it.name) },
                it.incorrectAnswerers.map { Answerer(it.userId, it.name) },
                it.timeExpiredAnswerers.map { Answerer(it.userId, it.name) },
            )
        }

        val totalElapsedTime = this.getParticipantStopTime(quizId, userId).epochSeconds - this.getQuizStartTime(quizId).epochSeconds
        val avgAnswerTime = if (answerDurations.size > 0) (answerDurations.average() * 1000).roundToInt() else 0

        return Triple(totalElapsedTime, avgAnswerTime, participantQuestionSummary)
    }
}
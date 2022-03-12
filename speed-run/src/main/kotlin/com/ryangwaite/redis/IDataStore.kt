package com.ryangwaite.redis

import com.ryangwaite.models.LeaderboardItem
import com.ryangwaite.models.VerboseQuestionSummary
import kotlinx.datetime.Instant

interface IDataStore {
    suspend fun addUserId(quizId: String, userId: String)
    suspend fun getUserIds(quizId: String): List<String>
    suspend fun setUsername(quizId: String, userId: String, name: String)
    suspend fun setLeaderboardItem(quizId: String, userId: String, score: Int)
    suspend fun getLeaderboard(quizId: String): List<LeaderboardItem>
    suspend fun getUserScore(quizId: String, userId: String): Int
    suspend fun setQuizName(quizId: String, name: String)
    suspend fun setSelectedCategories(quizId: String, categories: List<String>)
    suspend fun setQuestionDuration(quizId: String, duration: Int)
    suspend fun getQuestionDuration(quizId: String): Int
    suspend fun setSelectedQuestionIndexes(quizId: String, indexes: List<Int>)
    suspend fun getSelectedQuestionIndexes(quizId: String): List<Int>
    suspend fun setQuizStartTime(quizId: String, time: Instant)
    suspend fun getQuizStartTime(quizId: String): Instant
    suspend fun setQuizStopTime(quizId: String, time: Instant)
    suspend fun getQuizStopTime(quizId: String): Instant
    suspend fun setParticipantAnswer(quizId: String, userId: String, questionIndex: Int, selectedOptionIndexes: List<Int>, answeredInDuration: Int)
    suspend fun getQuizSummary(quizId: String): List<VerboseQuestionSummary>
    suspend fun isQuizFinished(quizId: String): Boolean
    suspend fun isParticipantFinished(quizId: String, userId: String): Boolean
    suspend fun setParticipantStopTime(quizId: String, userId: String, time: Instant)
    suspend fun getParticipantStopTime(quizId: String, userId: String): Instant
}
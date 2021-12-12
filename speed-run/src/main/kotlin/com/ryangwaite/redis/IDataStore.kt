package com.ryangwaite.redis

import com.ryangwaite.models.LeaderboardItem

interface IDataStore {
    suspend fun setUsername(quizId: String, userId: String, name: String)
    suspend fun addLeaderboardItem(quizId: String, userId: String, score: Int)
    suspend fun getLeaderboard(quizId: String): List<LeaderboardItem>
    suspend fun setQuizName(quizId: String, name: String)
    suspend fun setSelectedCategories(quizId: String, categories: List<String>)
    suspend fun setQuestionDuration(quizId: String, duration: Int)
    suspend fun setSelectedQuestionIndexes(quizId: String, indexes: List<Int>)
}
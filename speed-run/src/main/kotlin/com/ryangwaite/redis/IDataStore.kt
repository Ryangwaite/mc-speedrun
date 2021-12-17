package com.ryangwaite.redis

import com.ryangwaite.models.LeaderboardItem

interface IDataStore {
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
    suspend fun setParticipantAnswer(quizId: String, userId: String, questionIndex: Int, selectedOptionIndexes: List<Int>, answeredInDuration: Int)
}
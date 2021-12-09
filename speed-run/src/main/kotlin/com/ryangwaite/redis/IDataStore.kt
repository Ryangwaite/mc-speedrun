package com.ryangwaite.redis

interface IDataStore {
    suspend fun setUsername(quizId: String, userId: String, name: String)
    suspend fun addLeaderboardItem(quizId: String, userId: String, score: Int)
}
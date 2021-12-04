package com.ryangwaite.models

import kotlinx.serialization.Serializable

@Serializable
data class LeaderboardItem(
    val userId: String,
    val name: String,
    val score: Int,
)
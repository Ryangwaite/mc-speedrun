package com.ryangwaite.models

import kotlinx.serialization.Serializable

@Serializable
data class QuestionAndAnswers(
    val question: String,
    val category: String,
    val options: List<String>,
    val answers: List<Int>,
)
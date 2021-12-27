package com.ryangwaite.models

import kotlinx.serialization.Serializable

@Serializable
data class AnswererWithOptions(
    val userId: String,
    val name: String,
    val participantOptions: List<Int>,
    val answeredInDuration: Int
)

@Serializable
data class VerboseQuestionSummary(
    val question: String,
    val options: List<String>,
    val correctOptions: List<Int>,
    val correctAnswerers: List<AnswererWithOptions>,
    val incorrectAnswerers: List<AnswererWithOptions>,
    val timeExpiredAnswerers: List<AnswererWithOptions>,
)

@Serializable
data class Answerer(
    val userId: String,
    val name: String,
)

@Serializable
data class ParticipantQuestionSummary(
    val question: String,
    val options: List<String>,
    val correctOptions: List<Int>,
    val participantOptions: List<Int>,
    val correctAnswerers: List<Answerer>,
    val incorrectAnswerers: List<Answerer>,
    val timeExpiredAnswerers: List<Answerer>,
)

@Serializable
data class HostQuestionSummary(
    val question: String,
    val options: List<String>,
    val correctOptions: List<Int>,
    val correctAnswerers: List<Answerer>,
    val incorrectAnswerers: List<Answerer>,
    val timeExpiredAnswerers: List<Answerer>,
)
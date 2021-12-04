package com.ryangwaite.models

import kotlinx.serialization.Serializable

@Serializable
data class Answerer(
    val userId: String,
    val name: String,
)

@Serializable
data class ParticipantQuestion(
    val question: String,
    val options: List<String>,
    val correctOptions: List<Int>,
    val participantOptions: List<Int>,
    val correctAnswerers: List<Answerer>,
    val incorrectAnswerers: List<Answerer>,
    val timeExpiredAnswerers: List<Answerer>,
)

@Serializable
data class HostQuestion(
    val question: String,
    val options: List<String>,
    val correctOptions: List<Int>,
    val correctAnswerers: List<Answerer>,
    val incorrectAnswerers: List<Answerer>,
    val timeExpiredAnswerers: List<Answerer>,
)
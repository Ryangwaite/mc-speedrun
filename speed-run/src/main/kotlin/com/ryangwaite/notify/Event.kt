package com.ryangwaite.notify

import kotlinx.datetime.Instant
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonObject

@Serializable
data class Event(
    val type: String,
    val source: String,
    val id: String,
    val time: Instant,
    val data: EventData
)

@Serializable
sealed class IEventData

@Serializable
data class EventData(
    val quizId: String,
): IEventData()
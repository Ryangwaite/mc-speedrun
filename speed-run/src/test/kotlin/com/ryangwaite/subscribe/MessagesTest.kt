package com.ryangwaite.subscribe

import kotlinx.serialization.decodeFromString
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import org.junit.jupiter.api.Test
import kotlin.test.assertEquals

class MessagesTest {
    @Test
    fun `test serialize LEADERBOARD-UPDATED message`() {

        val msg = SubscriptionMessages.`LEADERBOARD-UPDATED`
        val serializedMsg = Json.encodeToString(msg)
        assertEquals(
            """"LEADERBOARD-UPDATED"""",
            serializedMsg
        )
    }

    @Test
    fun `test deserialize LEADERBOARD-UPDATED message`() {

        val json = """"LEADERBOARD-UPDATED""""
        val deserializedMsg = Json.decodeFromString<SubscriptionMessages>(json)
        assertEquals(SubscriptionMessages.`LEADERBOARD-UPDATED`, deserializedMsg)
    }
}
package com.ryangwaite.protocol

import com.ryangwaite.models.Answerer
import com.ryangwaite.models.HostQuestionSummary
import com.ryangwaite.models.LeaderboardItem
import kotlinx.serialization.encodeToString
import kotlinx.serialization.decodeFromString
import kotlinx.serialization.json.Json
import org.junit.jupiter.api.Test
import kotlin.test.assertEquals
import kotlin.test.assertIs

class testPacket {
    @Test
    fun `test serialize HOST-CONFIG packet`() {

        val msg = Packet(ProtocolMsg.Type.`HOST-CONFIG`, HostConfigMsg("quizName", mutableListOf("category1", "category2"), 1000, listOf(1, 2)))
        val serializedMsg = Json.encodeToString(msg)
        assertEquals(
            """{"type":"HOST-CONFIG","payload":{"quizName":"quizName","categories":["category1","category2"],"duration":1000,"selectedQuestionIndexes":[1,2]}}""",
            serializedMsg
        )
    }

    @Test
    fun `test deserialize HOST-CONFIG packet`() {
        val json = """{"type":"HOST-CONFIG","payload":{"quizName":"quizName","categories":["category1","category2"],"duration":1000,"selectedQuestionIndexes":[1,2]}}"""
        val deserializedPacket = Json.decodeFromString<Packet>(json)
        assertIs<HostConfigMsg>(deserializedPacket.payload)
        assertEquals(ProtocolMsg.Type.`HOST-CONFIG`, deserializedPacket.type)
    }

    @Test
    fun `test serialize REQUEST-HOST-QUIZ-SUMMARY packet`() {
        val msg = Packet(ProtocolMsg.Type.`REQUEST-HOST-QUIZ-SUMMARY`, RequestHostQuizSummaryMsg())
        val serializedMsg = Json.encodeToString(msg)
        assertEquals(
            """{"type":"REQUEST-HOST-QUIZ-SUMMARY","payload":{}}""",
            serializedMsg
        )
    }

    @Test
    fun `test deserialize REQUEST-HOST-QUIZ-SUMMARY packet`() {
        val json = """{"type":"REQUEST-HOST-QUIZ-SUMMARY","payload":{}}"""
        val deserializedPacket = Json.decodeFromString<Packet>(json)
        assertIs<RequestHostQuizSummaryMsg>(deserializedPacket.payload)
        assertEquals(ProtocolMsg.Type.`REQUEST-HOST-QUIZ-SUMMARY`, deserializedPacket.type)
    }

    @Test
    fun `test serialize RESPONSE-HOST-QUIZ-SUMMARY packet`() {
        val msg = Packet(ProtocolMsg.Type.`RESPONSE-HOST-QUIZ-SUMMARY`, ResponseHostQuizSummaryMsg(
            1234,
            listOf(
                HostQuestionSummary(
                    "question 1",
                    listOf("option1", "option2", "option3", "option4"),
                    listOf(1),
                    correctAnswerers = listOf(
                        Answerer("userid1", "participant1"),
                        Answerer("userid2", "participant2")
                    ),
                    incorrectAnswerers = listOf(
                        Answerer("userid3", "participant3"),
                        Answerer("userid4", "participant4")
                    ),
                    timeExpiredAnswerers = listOf(
                        Answerer("userid5", "participant5"),
                        Answerer("userid6", "participant6")
                    ),
                ),
                HostQuestionSummary(
                    "question 2",
                    listOf("optionA", "optionB", "optionC", "optionD"),
                    listOf(1,3),
                    correctAnswerers = listOf(),
                    incorrectAnswerers = listOf(),
                    timeExpiredAnswerers = listOf(),
                ),
            )
        ))
        val serializedMsg = Json.encodeToString(msg)
        assertEquals(
            """{"type":"RESPONSE-HOST-QUIZ-SUMMARY","payload":{"totalTimeElapsed":1234,"questions":[{"question":"question 1","options":["option1","option2","option3","option4"],"correctOptions":[1],"correctAnswerers":[{"userId":"userid1","name":"participant1"},{"userId":"userid2","name":"participant2"}],"incorrectAnswerers":[{"userId":"userid3","name":"participant3"},{"userId":"userid4","name":"participant4"}],"timeExpiredAnswerers":[{"userId":"userid5","name":"participant5"},{"userId":"userid6","name":"participant6"}]},{"question":"question 2","options":["optionA","optionB","optionC","optionD"],"correctOptions":[1,3],"correctAnswerers":[],"incorrectAnswerers":[],"timeExpiredAnswerers":[]}]}}""",
            serializedMsg
        )
    }

    @Test
    fun `test deserialize RESPONSE-HOST-QUIZ-SUMMARY packet`() {
        val json = """{"type":"RESPONSE-HOST-QUIZ-SUMMARY","payload":{"totalTimeElapsed":1234,"questions":[{"question":"question 1","options":["option1","option2","option3","option4"],"correctOptions":[1],"correctAnswerers":[{"userId":"userid1","name":"participant1"},{"userId":"userid2","name":"participant2"}],"incorrectAnswerers":[{"userId":"userid3","name":"participant3"},{"userId":"userid4","name":"participant4"}],"timeExpiredAnswerers":[{"userId":"userid5","name":"participant5"},{"userId":"userid6","name":"participant6"}]},{"question":"question 2","options":["optionA","optionB","optionC","optionD"],"correctOptions":[1,3],"correctAnswerers":[],"incorrectAnswerers":[],"timeExpiredAnswerers":[]}]}}"""
        val deserializedPacket = Json.decodeFromString<Packet>(json)
        assertIs<ResponseHostQuizSummaryMsg>(deserializedPacket.payload)
        assertEquals(ProtocolMsg.Type.`RESPONSE-HOST-QUIZ-SUMMARY`, deserializedPacket.type)
    }

    @Test
    fun `test serialize BROADCAST-LEADERBOARD packet`() {
        val msg = Packet(ProtocolMsg.Type.`BROADCAST-LEADERBOARD`, BroadcastLeaderboardMsg(
            leaderboard = listOf(
                LeaderboardItem("userid1", "participant1", 9999),
                LeaderboardItem("userid2", "participant2", 8888),
                LeaderboardItem("userid3", "participant3", 7777),
            )
        ))
        val serializedMsg = Json.encodeToString(msg)
        assertEquals(
            """{"type":"BROADCAST-LEADERBOARD","payload":{"leaderboard":[{"userId":"userid1","name":"participant1","score":9999},{"userId":"userid2","name":"participant2","score":8888},{"userId":"userid3","name":"participant3","score":7777}]}}""",
            serializedMsg
        )
    }

    @Test
    fun `test deserialize BROADCAST-LEADERBOARD packet`() {
        val json = """{"type":"BROADCAST-LEADERBOARD","payload":{"leaderboard":[{"userId":"userid1","name":"participant1","score":9999},{"userId":"userid2","name":"participant2","score":8888},{"userId":"userid3","name":"participant3","score":7777}]}}"""
        val deserializedPacket = Json.decodeFromString<Packet>(json)
        assertIs<BroadcastLeaderboardMsg>(deserializedPacket.payload)
        assertEquals(ProtocolMsg.Type.`BROADCAST-LEADERBOARD`, deserializedPacket.type)
    }
}
package com.ryangwaite.protocol

import com.ryangwaite.models.HostQuestion
import com.ryangwaite.models.LeaderboardItem
import com.ryangwaite.models.ParticipantQuestion
import kotlinx.serialization.Serializable

sealed class Msg {
    @Serializable
    enum class Type {
        // Messages from the quiz host to the server which a response is not sent back for
        `HOST-CONFIG`,
        `HOST-START`,
        // Messsages sent from the server to the quiz which a response is not sent back for
        `NOTIFY-HOST-ANSWER`,
        // Request and response messages between quiz host and server
        `REQUEST-HOST-QUIZ-SUMMARY`,
        `RESPONSE-HOST-QUIZ-SUMMARY`,
        // Messages from a participant to the server which a response is not sent back for
        `PARTICIPANT-CONFIG`,
        `PARTICIPANT-ANSWER`,
        `PARTICIPANT-ANSWER-TIMEOUT`,
        // Request and response messages between a quiz participant and server
        `REQUEST-PARTICIPANT-QUESTION`,
        `RESPONSE-PARTICIPANT-QUESTION`,
        `REQUEST-PARTICIPANT-RESULTS`,
        `RESPONSE-PARTICIPANT-RESULTS`,
        // Messages which are sent from the server to the host and all participants which a response is not sent back for
        `BROADCAST-PARTICIPANT-CONFIG`,
        `BROADCAST-START`,
        `BROADCAST-LEADERBOARD`,
    }
}

@Serializable
data class HostConfigMsg(
    val quizName: String,
    val categories: List<String>,
    val duration: Int,
): Msg()

@Serializable
class HostStartMsg: Msg()

@Serializable
data class NotifyHostAnswerMsg(
    val userId: String,
    val questionIndex: Int,
    val answerResult: String,
): Msg()

@Serializable
class RequestHostQuizSummaryMsg: Msg()

@Serializable
data class ResponseHostQuizSummaryMsg(
    val totalTimeElapsed: Int, // milliseconds
    val questions: List<HostQuestion>,
): Msg()

@Serializable
data class ParticipantConfigMsg(
    val name: String,
): Msg()

@Serializable
data class ParticipantAnswerMsg(
    val questionIndex: Int,
    val selectedOptionIndexes: List<Int>,
    val answeredInDuration: Int, // milliseconds
): Msg()

@Serializable
data class ParticipantAnswerTimeoutMsg(
    val questionIndex: Int
): Msg()

@Serializable
data class RequestParticipantQuestionMsg(
    val questionIndex: Int,
): Msg()

@Serializable
data class ResponseParticipantQuestionMsg(
    val questionIndex: Int,
    val options: List<String>,
    val numberOfOptionsToSelect: Int,
): Msg()

@Serializable
data class RequestParticipantResultsMsg(
    val userId: String,
): Msg()

@Serializable
data class ResponseParticipantResultsMsg(
    val userId: String,
    val totalTimeElapsed: Int,
    val questions: List<ParticipantQuestion>
): Msg()

@Serializable
data class BroadcastParticipantConfigMsg(
    val userId: String,
    val name: String,
): Msg()

@Serializable
class BroadcastStartMsg(): Msg()

@Serializable
data class BroadcastLeaderboardMsg(
    val leaderboard: List<LeaderboardItem>
): Msg()

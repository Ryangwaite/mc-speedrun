package com.ryangwaite.protocol

import com.ryangwaite.models.HostQuestionSummary
import com.ryangwaite.models.LeaderboardItem
import com.ryangwaite.models.ParticipantQuestionSummary
import com.ryangwaite.models.QuestionAndAnswers
import kotlinx.serialization.Serializable

sealed class ProtocolMsg {
    @Serializable
    enum class Type {
        // Messages from the quiz host to the server which a response is not sent back for
        `HOST-CONFIG`,
        `HOST-START`,
        // Messsages sent from the server to the quiz host which a response is not sent back for
        `NOTIFY-HOST-QUIZ-SUMMARY`,
        // Messages sent from the server to a single quiz participant which a response is not sent back for
        `NOTIFY-PARTICIPANT-QUIZ-SUMMARY`,
        // Request and response messages between quiz host and server
        `REQUEST-HOST-QUESTIONS`,
        `RESPONSE-HOST-QUESTIONS`,
        // Messages from a participant to the server which a response is not sent back for
        `PARTICIPANT-CONFIG`,
        `PARTICIPANT-ANSWER`,
        `PARTICIPANT-ANSWER-TIMEOUT`,
        // Request and response messages between a quiz participant and server
        `REQUEST-PARTICIPANT-QUESTION`,
        `RESPONSE-PARTICIPANT-QUESTION`,
        // Messages which are sent from the server to the host and all participants which a response is not sent back for
        `BROADCAST-PARTICIPANT-CONFIG`,
        `BROADCAST-START`,
        `LEADERBOARD`,
        `BROADCAST-PARTICIPANT-FINISHED`,
        `BROADCAST-QUIZ-FINISHED`,
    }
}

@Serializable
data class HostConfigMsg(
    val quizName: String,
    val categories: List<String>,
    val duration: Int,
    val selectedQuestionIndexes: List<Int>,
): ProtocolMsg()

@Serializable
class HostStartMsg: ProtocolMsg()

@Serializable
class RequestHostQuestionsMsg: ProtocolMsg()

@Serializable
data class ResponseHostQuestionsMsg(
    val questions: List<QuestionAndAnswers>,
): ProtocolMsg()

@Serializable
data class NotifyHostQuizSummaryMsg(
    val totalTimeElapsed: Long, // seconds
    val avgAnswerTime: Int,  // milliseconds
    val questions: List<HostQuestionSummary>,
): ProtocolMsg()

@Serializable
data class NotifyParticipantQuizSummaryMsg(
    // These metrics are just for this participant
    val totalTimeElapsed: Long, // seconds
    val avgAnswerTime: Int, // milliseconds
    val questions: List<ParticipantQuestionSummary>,
): ProtocolMsg()

@Serializable
data class ParticipantConfigMsg(
    val name: String,
): ProtocolMsg()

@Serializable
data class ParticipantAnswerMsg(
    val questionIndex: Int,
    val selectedOptionIndexes: List<Int>,
    val answerDuration: Int, // milliseconds
): ProtocolMsg()

@Serializable
data class ParticipantAnswerTimeoutMsg(
    val questionIndex: Int
): ProtocolMsg()

@Serializable
data class RequestParticipantQuestionMsg(
    val questionIndex: Int,
): ProtocolMsg()

@Serializable
data class ResponseParticipantQuestionMsg(
    val questionIndex: Int,
    val question: String,
    val options: List<String>,
    val numberOfOptionsToSelect: Int,
): ProtocolMsg()

@Serializable
data class BroadcastParticipantConfigMsg(
    val userId: String,
    val name: String,
): ProtocolMsg()

@Serializable
data class BroadcastStartMsg(
    val startTimeEpochSecs: Long,
    val questionDuration: Int,
    val numberOfQuestions: Int,
): ProtocolMsg()

@Serializable
data class LeaderboardMsg(
    val leaderboard: List<LeaderboardItem>
): ProtocolMsg()

@Serializable
data class BroadcastParticipantFinishedMsg(
    val totalFinishedParticipants: Int,
): ProtocolMsg()

@Serializable
object BroadcastQuizFinishedMsg : ProtocolMsg()
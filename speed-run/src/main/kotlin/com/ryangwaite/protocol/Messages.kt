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
        // Messsages sent from the server to the quiz which a response is not sent back for
        `NOTIFY-HOST-ANSWER`,
        // Request and response messages between quiz host and server
        `REQUEST-HOST-QUESTIONS`,
        `RESPONSE-HOST-QUESTIONS`,
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
    val selectedQuestionIndexes: List<Int>,
): ProtocolMsg()

@Serializable
class HostStartMsg: ProtocolMsg()

@Serializable
data class NotifyHostAnswerMsg(
    val userId: String,
    val questionIndex: Int,
    val answerResult: String,
): ProtocolMsg()

@Serializable
class RequestHostQuestionsMsg: ProtocolMsg()

@Serializable
data class ResponseHostQuestionsMsg(
    val questions: List<QuestionAndAnswers>,
): ProtocolMsg()

@Serializable
class RequestHostQuizSummaryMsg: ProtocolMsg()

@Serializable
data class ResponseHostQuizSummaryMsg(
    val totalTimeElapsed: Int, // milliseconds
    val questions: List<HostQuestionSummary>,
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
data class RequestParticipantResultsMsg(
    val userId: String,
): ProtocolMsg()

@Serializable
data class ResponseParticipantResultsMsg(
    val userId: String,
    val totalTimeElapsed: Int,
    val questions: List<ParticipantQuestionSummary>
): ProtocolMsg()

@Serializable
data class BroadcastParticipantConfigMsg(
    val userId: String,
    val name: String,
): ProtocolMsg()

@Serializable
data class BroadcastStartMsg(
    val questionDuration: Int,
    val numberOfQuestions: Int,
): ProtocolMsg()

@Serializable
data class BroadcastLeaderboardMsg(
    val leaderboard: List<LeaderboardItem>
): ProtocolMsg()

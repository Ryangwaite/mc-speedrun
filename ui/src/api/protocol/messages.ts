import { IHostQuestion, ILeaderboardItem, IQuestionAndAnswers } from "../../types"

/********************* OUTBOUND *********************/
export const PARTICIPANT_CONFIG = "PARTICIPANT-CONFIG"
export function participantConfigMsg(name: string) {
    return {
        name
    }
}
export type ParticipantConfigMsgType = ReturnType<typeof participantConfigMsg>

export const REQUEST_HOST_QUESTIONS = "REQUEST-HOST-QUESTIONS"
export function requestHostQuestions() {
    return {}
}
export type RequestHostQuestionsMsgType = ReturnType<typeof requestHostQuestions>

export const REQUEST_HOST_QUIZ_SUMMARY = "REQUEST-HOST-QUIZ-SUMMARY"
export function requestHostQuizSummary() {
    return {}
}
export type RequestHostQuizSummaryMsgType = ReturnType<typeof requestHostQuizSummary>

export const HOST_CONFIG = "HOST-CONFIG"
export function hostConfig(quizName: string, categories: string[], duration: number, selectedQuestionIndexes: number[]) {
    return {
        quizName,
        categories,
        duration,
        selectedQuestionIndexes,
    }
}
export type HostConfigMsgType = ReturnType<typeof hostConfig>

/********************* INBOUND *********************/
export const BROADCAST_LEADERBOARD = "BROADCAST-LEADERBOARD"
export interface BroadcastLeaderboardMsgType {
    leaderboard: ILeaderboardItem[]
}

export const RESPONSE_HOST_QUESTIONS = "RESPONSE-HOST-QUESTIONS"
export interface ResponseHostQuestionsMsgType {
    questions: IQuestionAndAnswers[]
}

export const RESPONSE_HOST_QUIZ_SUMMARY = "RESPONSE-HOST-QUIZ-SUMMARY"
export interface ResponseHostQuizSummaryMsgType {
    totalTimeElapsed: number, // milliseconds
    questions: IHostQuestion[],
}

export const BROADCAST_START = "BROADCAST-START"
export interface BroadcastStartMsgType {
    questionDuration: number,
}
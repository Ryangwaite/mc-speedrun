import {
    hostConfig, HOST_CONFIG,
    participantConfigMsg, PARTICIPANT_CONFIG, 
    requestHostQuestions, REQUEST_HOST_QUESTIONS,
    requestHostQuizSummary, REQUEST_HOST_QUIZ_SUMMARY,
    requestParticipantQuestion, REQUEST_PARTICIPANT_QUESTION,
    participantAnswer, PARTICIPANT_ANSWER,
    participantAnswerTimeout, PARTICIPANT_ANSWER_TIMEOUT,
} from "./messages"

export default class Packet<MsgType extends {}> {
    type: string
    payload: MsgType

    constructor(type: string, payload: MsgType) {
        this.type = type
        this.payload = payload
    }

    static ParticipantConfig = (name: string) => new this(PARTICIPANT_CONFIG, participantConfigMsg(name))
    static RequestHostQuestions = () => new this(REQUEST_HOST_QUESTIONS, requestHostQuestions())
    static HostConfig = (quizName: string, categories: string[], duration: number, selectedQuestionIndexes: number[]) =>
            new this(HOST_CONFIG, hostConfig(quizName, categories, duration, selectedQuestionIndexes))
    static RequestHostQuizSummary = () => new this(REQUEST_HOST_QUIZ_SUMMARY, requestHostQuizSummary())
    static RequestParticipantQuestion = (questionIndex: number) => new this(REQUEST_PARTICIPANT_QUESTION, requestParticipantQuestion(questionIndex))
    static ParticipantAnswer = (questionIndex: number, selectedOptionIndexes: number[], answerDuration: number) =>
            new this(PARTICIPANT_ANSWER, participantAnswer(questionIndex, selectedOptionIndexes, answerDuration))
    static ParticipantAnswerTimeout = (questionIndex: number) => new this(PARTICIPANT_ANSWER_TIMEOUT, participantAnswerTimeout(questionIndex))
}
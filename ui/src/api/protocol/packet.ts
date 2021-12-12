import { participantConfigMsg, PARTICIPANT_CONFIG, requestHostQuestions, requestHostQuizSummary, REQUEST_HOST_QUESTIONS, REQUEST_HOST_QUIZ_SUMMARY } from "./messages"

export default class Packet<MsgType extends {}> {
    type: string
    payload: MsgType

    constructor(type: string, payload: MsgType) {
        this.type = type
        this.payload = payload
    }

    static ParticipantConfig = (name: string) => new this(PARTICIPANT_CONFIG, participantConfigMsg(name))
    static RequestHostQuestions = () => new this(REQUEST_HOST_QUESTIONS, requestHostQuestions())
    static RequestHostQuizSummary = () => new this(REQUEST_HOST_QUIZ_SUMMARY, requestHostQuizSummary())
}
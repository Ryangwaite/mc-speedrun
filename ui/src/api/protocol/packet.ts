import { participantConfigMsg, PARTICIPANT_CONFIG, requestHostQuizSummary, REQUEST_HOST_QUIZ_SUMMARY } from "./messages"

export default class Packet<MsgType extends {}> {
    type: string
    payload: MsgType

    constructor(type: string, payload: MsgType) {
        this.type = type
        this.payload = payload
    }

    static ParticipantConfig = (name: string) => new this(PARTICIPANT_CONFIG, participantConfigMsg(name))
    static RequestHostQuizSummary = () => new this(REQUEST_HOST_QUIZ_SUMMARY, requestHostQuizSummary())
}
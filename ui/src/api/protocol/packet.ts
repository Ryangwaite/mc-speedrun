import { participantConfigMsg, PARTICIPANT_CONFIG } from "./messages"

export default class Packet<MsgType extends {}> {
    type: string
    payload: MsgType

    constructor(type: string, payload: MsgType) {
        this.type = type
        this.payload = payload
    }

    static ParticipantConfig = (name: string) => new this(PARTICIPANT_CONFIG, participantConfigMsg(name))

}
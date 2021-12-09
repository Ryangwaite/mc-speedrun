
export const PARTICIPANT_CONFIG = "PARTICIPANT-CONFIG"
export function participantConfigMsg(name: string) {
    return {
        name
    }
}
export type ParticipantConfigMsgType = ReturnType<typeof participantConfigMsg>


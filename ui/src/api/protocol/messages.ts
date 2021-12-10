import { ILeaderboardItem } from "../../types"

/********************* OUTBOUND *********************/
export const PARTICIPANT_CONFIG = "PARTICIPANT-CONFIG"
export function participantConfigMsg(name: string) {
    return {
        name
    }
}
export type ParticipantConfigMsgType = ReturnType<typeof participantConfigMsg>


/********************* INBOUND *********************/
export const BROADCAST_LEADERBOARD = "BROADCAST-LEADERBOARD"
export interface BroadcastLeaderboardMsgType {
    leaderboard: ILeaderboardItem[]
}

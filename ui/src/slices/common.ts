import { createSlice, PayloadAction, Action } from "@reduxjs/toolkit";
import { ClientType, ILeaderboardItem } from "../types";
import { RootState } from "../store";
import { WebsocketConnectionStateType } from "../api/websocket";

interface ICommonState {
    clientType: ClientType,
    connection: WebsocketConnectionStateType,
    token?: string,
    leaderboard: ILeaderboardItem[],
    totalFinishedParticipants: number,
    quizId?: string,
    startTime?: number,
}

// State consists of that which is the intersection of participant and hosts
export const initialState: ICommonState = {
    clientType: ClientType.UNKNOWN,
    connection: WebsocketConnectionStateType.UNINITIALIZED,
    leaderboard: [],
    totalFinishedParticipants: 0,
}

export const commonSlice = createSlice({
    name: "common",
    initialState,
    reducers: {
        resetCommonState: (state, action: Action) => {
            return initialState
        },
        setClientType: (state, action: PayloadAction<ClientType>) => {
            const clientType = action.payload
            state.clientType = clientType
        },
        setWebsocketConnectionState: (state, action: PayloadAction<WebsocketConnectionStateType>) => {
            const connectionState = action.payload
            state.connection = connectionState
        },
        setToken: (state, action: PayloadAction<string>) => {
            const token = action.payload
            state.token = token
        },
        setQuizId: (state, action: PayloadAction<string>) => {
            const quizId = action.payload
            state.quizId = quizId
        },
        setLeaderboard: (state, action: PayloadAction<ILeaderboardItem[]>) => {
            const updatedLeaderboard = action.payload
            state.leaderboard = updatedLeaderboard
        },
        setTotalFinishedParticipants: (state, action: PayloadAction<number>) => {
            const finishedParticipants = action.payload
            state.totalFinishedParticipants = finishedParticipants
        },
        setStartTime: (state, action: PayloadAction<number>) => {
            const startTime = action.payload
            state.startTime = startTime
        }
    }
})

export const {
    resetCommonState, setClientType,
    setWebsocketConnectionState, setToken,
    setLeaderboard, setQuizId,
    setTotalFinishedParticipants, setStartTime
} = commonSlice.actions

export const selectClientType = (state: RootState) => state.common.clientType
export const selectWebsocketConnectionState = (state: RootState) => state.common.connection
export const selectToken = (state: RootState) => state.common.token
export const selectQuizId = (state: RootState) => state.common.quizId
export const selectLeaderboard = (state: RootState) => state.common.leaderboard
export const selectTotalFinishedParticipants = (state: RootState) => state.common.totalFinishedParticipants
export const selectStartTime = (state: RootState) => state.common.startTime

export default commonSlice.reducer
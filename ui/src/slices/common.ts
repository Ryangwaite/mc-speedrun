import _ from "lodash";
import { createSlice, PayloadAction, Action } from "@reduxjs/toolkit";
import { ClientType, ILeaderboardItem } from "../types";
import { RootState } from "../store";
import { WebsocketConnectionStateType } from "../api/websocket";

interface ICommonState {
    clientType: ClientType,
    connection: WebsocketConnectionStateType,
    leaderboard: ILeaderboardItem[],
    quizId?: string,
    startTime?: number,
}

// State consists of that which is the intersection of participant and hosts
const initialState: ICommonState = {
    clientType: ClientType.UNKNOWN,
    connection: WebsocketConnectionStateType.UNINITIALIZED,
    leaderboard: [],
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
        setQuizId: (state, action: PayloadAction<string>) => {
            const quizId = action.payload
            state.quizId = quizId
        },
        setLeaderboard: (state, action: PayloadAction<ILeaderboardItem[]>) => {
            const updatedLeaderboard = action.payload
            state.leaderboard = updatedLeaderboard
        },
        setStartTime: (state, action: PayloadAction<number>) => {
            const startTime = action.payload
            state.startTime = startTime
        }
    }
})

export const { resetCommonState, setClientType, setWebsocketConnectionState, setLeaderboard, setQuizId, setStartTime } = commonSlice.actions

export const selectClientType = (state: RootState) => state.common.clientType
export const selectWebsocketConnectionState = (state: RootState) => state.common.connection
export const selectQuizId = (state: RootState) => state.common.quizId
export const selectLeaderboard = (state: RootState) => state.common.leaderboard
export const selectStartTime = (state: RootState) => state.common.startTime

export default commonSlice.reducer
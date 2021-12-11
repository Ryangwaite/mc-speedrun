import _ from "lodash";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ILeaderboardItem } from "../types";
import { RootState } from "../store";

interface ICommonState {
    quizId?: string,
    leaderboard: ILeaderboardItem[]
}

// State consists of that which is the intersection of participant and hosts
const initialState: ICommonState = {
    leaderboard: []
}

export const commonSlice = createSlice({
    name: "common",
    initialState,
    reducers: {
        setQuizId: (state, action: PayloadAction<string>) => {
            const quizId = action.payload
            state.quizId = quizId
        },
        setLeaderboard: (state, action: PayloadAction<ILeaderboardItem[]>) => {
            const updatedLeaderboard = action.payload
            state.leaderboard = updatedLeaderboard
        }
    }
})

export const { setLeaderboard, setQuizId } = commonSlice.actions

export const selectQuizId = (state: RootState) => state.common.quizId
export const selectLeaderboard = (state: RootState) => state.common.leaderboard

export default commonSlice.reducer
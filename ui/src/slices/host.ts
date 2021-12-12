import _ from "lodash";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "../store";
import { IQuestionAndAnswers } from "../types";
import { HostConfigMsgType } from "../api/protocol/messages";

interface IHostState {
    totalTimeElapsed?: number,
    requestQuestions: boolean,
    questions?: IQuestionAndAnswers[],
}

const initialState: IHostState = {
    requestQuestions: false,
}

export const hostSlice = createSlice({
    name: "host",
    initialState,
    reducers: {
        setTotalTimeElapsed: (state, action: PayloadAction<number>) => {
            const timeElapsed = action.payload
            state.totalTimeElapsed = timeElapsed
        },
        setRequestQuestions: (state, action: PayloadAction<boolean>) => {
            const requestQuestions = action.payload
            state.requestQuestions = requestQuestions
        },
        setQuestions: (state, action: PayloadAction<IQuestionAndAnswers[]>) => {
            const updatedQuestions = action.payload
            state.questions = updatedQuestions
        },
        setHostConfig: (state, action: PayloadAction<HostConfigMsgType>) => {
            // NOTE: Don't need to store any of this in the frontend. We still need
            // this reducer though to bootstrap the action that the websocket middleware
            // intercepts
        },
    },
})

export const { setTotalTimeElapsed, setRequestQuestions, setQuestions, setHostConfig } = hostSlice.actions

export const selectTotalTimeElapsed = (state: RootState) => state.host.totalTimeElapsed
export const selectSetRequestQuestions = (state: RootState) => state.host.requestQuestions
export const selectHostQuestions = (state: RootState) => state.host.questions
export default hostSlice.reducer
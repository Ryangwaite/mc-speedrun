import _ from "lodash";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "../store";
import { IHostQuestionSummary, IQuestionAndAnswers } from "../types";
import { HostConfigMsgType, NotifyHostQuizSummaryMsgType } from "../api/protocol/messages";

interface IHostState {
    totalTimeElapsed?: number,
    requestQuestions: boolean,
    questions?: IQuestionAndAnswers[],
    quizSummary?: IHostQuestionSummary[],
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
        setHostQuizSummary: (state, action: PayloadAction<IHostQuestionSummary[]>) => {
            const quizSummary = action.payload
            state.quizSummary = quizSummary
        }
    },
})

export const { setTotalTimeElapsed, setRequestQuestions, setQuestions, setHostConfig, setHostQuizSummary } = hostSlice.actions

export const selectTotalTimeElapsed = (state: RootState) => state.host.totalTimeElapsed
export const selectSetRequestQuestions = (state: RootState) => state.host.requestQuestions
export const selectHostQuestions = (state: RootState) => state.host.questions
export const selectHostQuizSummary = (state: RootState) => state.host.quizSummary

export default hostSlice.reducer
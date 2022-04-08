import { Action, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "../store";
import { IHostQuestionSummary, IQuestionAndAnswers } from "../types";
import { HostConfigMsgType } from "../api/protocol/messages";

interface IHostState {
    totalTimeElapsed?: number,
    avgAnswerTime?: number,
    requestQuestions: boolean,
    questions?: IQuestionAndAnswers[],
    quizSummary?: IHostQuestionSummary[],
}

export const initialState: IHostState = {
    requestQuestions: false,
}

export const hostSlice = createSlice({
    name: "host",
    initialState,
    reducers: {
        resetHostState: (state, action: Action) => {
            return initialState
        },
        setHostTotalTimeElapsed: (state, action: PayloadAction<number>) => {
            const timeElapsed = action.payload
            state.totalTimeElapsed = timeElapsed
        },
        setHostAvgAnswerTime: (state, action: PayloadAction<number>) => {
            const avgAnswerTime = action.payload
            state.avgAnswerTime = avgAnswerTime
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

export const { resetHostState, setHostTotalTimeElapsed, setHostAvgAnswerTime, setRequestQuestions, setQuestions, setHostConfig, setHostQuizSummary } = hostSlice.actions

export const selectHostTotalTimeElapsed = (state: RootState) => state.host.totalTimeElapsed
export const selectHostAvgAnswerTime = (state: RootState) => state.host.avgAnswerTime
export const selectSetRequestQuestions = (state: RootState) => state.host.requestQuestions
export const selectHostQuestions = (state: RootState) => state.host.questions
export const selectHostQuizSummary = (state: RootState) => state.host.quizSummary

export default hostSlice.reducer
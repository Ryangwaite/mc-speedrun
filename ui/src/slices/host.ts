import _ from "lodash";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "../store";
import { IHostQuestion } from "../types";
import { HostConfigMsgType } from "../api/protocol/messages";

interface IHostState {
    totalTimeElapsed?: number,
    requestQuestions: boolean,
    questions?: IHostQuestion[],
    quizName?: string,
    selectedCategories?: string[],
    questionDuration?: number
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
        setQuestions: (state, action: PayloadAction<IHostQuestion[]>) => {
            const updatedQuestions = action.payload
            state.questions = updatedQuestions
        },
        setHostConfig: (state, action: PayloadAction<HostConfigMsgType>) => {
            const { quizName, categories, duration } = action.payload
            state.quizName = quizName
            state.selectedCategories = categories
            state.questionDuration = duration
        },
    },
})

export const { setTotalTimeElapsed, setRequestQuestions, setQuestions, setHostConfig } = hostSlice.actions

export const selectTotalTimeElapsed = (state: RootState) => state.host.totalTimeElapsed
export const selectSetRequestQuestions = (state: RootState) => state.host.requestQuestions
export const selectQuestions = (state: RootState) => state.host.questions
export const selectQuizName = (state: RootState) => state.host.quizName
export const selectSelectedCategories = (state: RootState) => state.host.selectedCategories
export const selectQuestionDuration = (state: RootState) => state.host.questionDuration

export default hostSlice.reducer
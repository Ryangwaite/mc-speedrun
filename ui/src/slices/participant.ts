import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ParticipantAnswerMsgType, ParticipantAnswerTimeoutMsgType, ResponseParticipantQuestionMsgType } from "../api/protocol/messages";
import { RootState } from "../store";
import { IParticipantQuestionSummary } from "../types";

interface IParticipantState {
    userId?: string,
    // Note: This is stored in the common pariticipants list as well.
    // although that is for storing info from the server. This username
    // is before the server has been told.
    username?: string,
    // This gets initially set by the host and then communicated the client in a start message
    questionDuration?: number,
    numberOfQuestions?: number,
    requestQuestion: boolean,
    currentQuestion?: ResponseParticipantQuestionMsgType,
    quizSummary?: IParticipantQuestionSummary[],
}

const initialState: IParticipantState = {
    requestQuestion: false,
}

export const participantSlice = createSlice({
    name: "participant",
    initialState,
    reducers: {
        setUserId: (state, action: PayloadAction<string>) => {
            state.userId = action.payload
        },
        setUsername: (state, action: PayloadAction<string>) => {
            state.username = action.payload
        },
        setQuestionDuration: (state, action: PayloadAction<number>) => {
            state.questionDuration = action.payload
        },
        setNumberOfQuestions: (state, action: PayloadAction<number>) => {
            state.numberOfQuestions = action.payload
        },
        setRequestQuestion: (state, action: PayloadAction<{isRequesting: boolean, questionIndex?: number}>) => {
            state.requestQuestion = action.payload.isRequesting
        },
        setCurrentQuestion: (state, action: PayloadAction<ResponseParticipantQuestionMsgType>) => {
            state.currentQuestion = action.payload
        },
        setQuestionAnswer: (state, action: PayloadAction<ParticipantAnswerMsgType>) => {
            // NOTE: Dont need to store state from this, just bootstrap the action for websocket middleware
        },
        setQuestionAnswerTimeout: (state, action: PayloadAction<ParticipantAnswerTimeoutMsgType>) => {
            // NOTE: Dont need to store state from this, just bootstrap the action for websocket middleware
        },
        setParticipantQuizSummary: (state, action: PayloadAction<IParticipantQuestionSummary[]>) => {
            state.quizSummary = action.payload
        }
    }
})

export const {
    setUserId, setUsername,
    setQuestionDuration, setNumberOfQuestions,
    setRequestQuestion, setCurrentQuestion,
    setQuestionAnswer, setQuestionAnswerTimeout,
    setParticipantQuizSummary,
} = participantSlice.actions

export const selectUserId = (state: RootState) => state.participant.userId
export const selectUsername = (state: RootState) => state.participant.username
export const selectQuestionDuration = (state: RootState) => state.participant.questionDuration
export const selectNumberOfQuestions = (state: RootState) => state.participant.numberOfQuestions
export const selectRequestQuestion = (state: RootState) => state.participant.requestQuestion
export const selectCurrentQuestion = (state: RootState) => state.participant.currentQuestion
export const selectParticipantQuizSummary = (state: RootState) => state.participant.quizSummary

export default participantSlice.reducer
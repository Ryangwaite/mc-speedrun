import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "../store";

interface IParticipantState {
    userId?: string,
    // Note: This is stored in the common pariticipants list as well.
    // although that is for storing info from the server. This username
    // is before the server has been told.
    username?: string,
    // This gets initially set by the host and then communicated the client in a start message
    questionDuration?: number,
}

const initialState: IParticipantState = {

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
        }
    }
})

export const { setUserId, setUsername, setQuestionDuration } = participantSlice.actions

export const selectUserId = (state: RootState) => state.participant.userId
export const selectUsername = (state: RootState) => state.participant.username
export const selectQuestionDuration = (state: RootState) => state.participant.questionDuration

export default participantSlice.reducer
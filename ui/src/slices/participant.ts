import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "../store";

interface IParticipantState {
    userId?: string,
    // Note: This is stored in the common pariticipants list as well.
    // although that is for storing info from the server. This username
    // is before the server has been told.
    username?: string,
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
        }
    }
})

export const { setUserId, setUsername } = participantSlice.actions

export const selectUserId = (state: RootState) => state.participant.userId
export const selectUsername = (state: RootState) => state.participant.username

export default participantSlice.reducer
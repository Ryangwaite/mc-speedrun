import _ from "lodash";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { IParticipant } from "../types";
import { RootState } from "../store";

interface ICommonState {
    quizId?: string,
    participants: IParticipant[]
}

// State consists of that which is the superset of participant and hosts
const initialState: ICommonState = {
    participants: []
}

export const commonSlice = createSlice({
    name: "common",
    initialState,
    reducers: {
        setQuizId: (state, action: PayloadAction<string>) => {
            const quizId = action.payload
            state.quizId = quizId
        },
        setParticipant: (state, action: PayloadAction<IParticipant>) => {
            const updatedParticipant = action.payload
            _.remove(state.participants, x => x.userId === updatedParticipant.userId)
            state.participants.push(updatedParticipant)
        }
    }
})

export const { setParticipant, setQuizId } = commonSlice.actions

export const selectQuizId = (state: RootState) => state.common.quizId
export const selectParticipants = (state: RootState) => state.common.participants

export default commonSlice.reducer
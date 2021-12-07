import { configureStore } from '@reduxjs/toolkit'
import commonReducer from './slices/common';
import participantReducer from './slices/participant'

export const store = configureStore({
    reducer: {
        common: commonReducer,
        participant: participantReducer,
    },
    devTools: true
})


// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
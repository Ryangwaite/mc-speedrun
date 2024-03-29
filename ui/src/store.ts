import { combineReducers, configureStore } from '@reduxjs/toolkit'
import commonReducer from './slices/common';
import participantReducer from './slices/participant'
import hostReducer from './slices/host'
import { websocketMiddleware } from "./middleware/websocket";
import { createReduxHistoryContext } from 'redux-first-history';
import { createBrowserHistory } from 'history';

const {createReduxHistory, routerMiddleware, routerReducer } = createReduxHistoryContext({
    history: createBrowserHistory(),
})

// Build rootReducer before pasing to `configureStore` so that
// we can pull out a RootState type from it to use for correct
// typing of middleware. If the reducer object is passed directly
// to configureStore then `RootState` determined with ` ReturnType<typeof store.getState>`
// introduces a circular dependency when adding middleware.
export const rootReducer = combineReducers({
    router: routerReducer,
    common: commonReducer,
    participant: participantReducer,
    host: hostReducer,
})

export const store = configureStore({
    reducer: rootReducer,
    devTools: true,
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().prepend(
        websocketMiddleware,
        routerMiddleware,
    )
})

export const history = createReduxHistory(store)

export type RootState = ReturnType<typeof rootReducer>

export type AppDispatch = typeof store.dispatch
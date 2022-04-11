import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { render as rtlRender } from '@testing-library/react';
import { createBrowserHistory } from 'history';
import { Provider } from 'react-redux';
import { createReduxHistoryContext } from 'redux-first-history';
import { HistoryRouter as Router } from "redux-first-history/rr6";
import { websocketMiddleware } from '../src/middleware/websocket';
import commonReducer from '../src/slices/common';
import hostReducer from '../src/slices/host';
import participantReducer from '../src/slices/participant';
import { RootState } from '../src/store';
import { initialState as commonInitialState} from '../src/slices/common';
import { initialState as hostInitialState} from '../src/slices/host';
import { initialState as participantInitialState} from '../src/slices/participant';
import _ from 'lodash';
import jwt from "jsonwebtoken";

export const initialTestState: Partial<RootState> = {
    common: commonInitialState,
    host: hostInitialState,
    participant: participantInitialState,
}

// From: https://stackoverflow.com/a/40076355
type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]>: T[P];
}

// To support merging of partial state into an initial state
export type RootStatePartial = DeepPartial<RootState>

/**
 * Renders the provided ui element with router and redux store
 * @param ui
 * @param initialState
 * @param urlPathname the path to set the URL to
 */
export function render(ui: JSX.Element, initialState: RootStatePartial = {}, urlPathname: string = "/") {

    const { createReduxHistory, routerMiddleware, routerReducer } = createReduxHistoryContext({
        history: createBrowserHistory(),
    })

    const preloadedState = _.merge({}, initialTestState, initialState) as RootState

    const store = configureStore({
        preloadedState: preloadedState,
        reducer: combineReducers({
            router: routerReducer,
            common: commonReducer,
            participant: participantReducer,
            host: hostReducer,
        }),
        middleware: (getDefaultMiddleware) => getDefaultMiddleware().prepend(
            websocketMiddleware,
            routerMiddleware,
        )
    })

    const history = createReduxHistory(store)
    history.push(urlPathname)

    const renderResult = rtlRender(
        <Provider store={store}>
            <Router history={history}>
                {ui}
            </Router>
        </Provider>
    )

    return {
        store,
        renderResult,
    }
}

/**
 * Create an access token to return in the responses
 * @param isHost whether or not the token is for a user or host
 * @param quizId the id of the quiz this token provides access to
 * @param userId the userId when this token is not for a host
 */
export function createAccessToken(isHost: boolean, quizId: string = QUIZ_ID, userId?: string): {
    token: string, expiresIn: number,
} {
    if (!isHost && !userId) {
        throw Error("Didn't provide userId when token is not for a host")
    }

    const userIdKV = isHost ? {} : {userId}

    const expiresIn = Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60)
    const token = jwt.sign({
        aud: "http://0.0.0.0/",
        isHost: isHost,
        quizId: quizId,
        iss: "http://sign-on/",
        // expire in 1 year
        exp: expiresIn,
        ...userIdKV,
    }, "testsecret", {algorithm: "HS256"})

    return { token, expiresIn}
}

export const QUIZ_ID = "c0f77dcf"
export const USER_ID = "userid12"
export const HOST_TOKEN = createAccessToken(true, QUIZ_ID)
export const PARTICIPANT_TOKEN = createAccessToken(false, QUIZ_ID, USER_ID)

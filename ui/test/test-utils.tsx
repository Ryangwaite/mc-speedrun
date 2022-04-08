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

export const initialTestState: RootState = {
    common: commonInitialState,
    host: hostInitialState,
    participant: participantInitialState,
    router: {},
}

/**
 * Renders the provided ui element with router and redux store
 * @param ui 
 * @param preloadedState 
 */
export function render(ui: JSX.Element, preloadedState: RootState = initialTestState) {

    const { createReduxHistory, routerMiddleware, routerReducer } = createReduxHistoryContext({
        history: createBrowserHistory(),
    })

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

import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import { HistoryRouter as Router } from "redux-first-history/rr6";
import App from './App';
import CssBaseline from '@mui/material/CssBaseline';
import { Provider } from 'react-redux';
import {history, store} from './store'

// Use roboto font since material ui was designed with this
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';

ReactDOM.render(
    <React.StrictMode>
        <CssBaseline />
        <Provider store={store}>
            <Router history={history}>
                <App />
            </Router>
        </Provider>
    </React.StrictMode>,
    document.getElementById('root')
);

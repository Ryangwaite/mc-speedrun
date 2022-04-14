import {beforeAll, afterAll, afterEach} from '@jest/globals'
import { apiServer } from '../test/api-server';
import WS from "jest-websocket-mock";
import mediaQuery from 'css-mediaquery';
import dotenv from 'dotenv';
import { QUIZ_ID } from '../test/test-utils';

// Load in the config to be used in tests from .env.production
// This makes it available at "process.env"
dotenv.config({ path: "./.env.production"})

beforeAll(() => {
    // Enable API mocking before tests
    apiServer.listen()

    // window.matchMedia is not defined by default which is needed so that MUI
    // "useMediaQuery(theme.breakpoints.up("lg"))" (for example) can resolve properly
    // this command polyfills it.
    // See: https://github.com/mui/material-ui/issues/16073#issuecomment-502359758
    window.matchMedia = (query) => ({
        matches: mediaQuery.match(query, { width: window.innerWidth }),
        media: "",
        onchange: null,
        addListener: () => undefined,
        removeListener: () => undefined,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
        dispatchEvent: () => false,
    })
})

export let wsServer: WS

beforeEach(() => {
    wsServer = new WS(`ws://localhost/speed-run/${QUIZ_ID}/ws`, {jsonProtocol: true});
})

// Reset any runtime request handlers we may add during tests.
afterEach(() => {
    apiServer.resetHandlers()
    // Clean up any mock websockets that were created during the test
    WS.clean()
})

// Disable API mocking after the tests are done
afterAll(() => apiServer.close())
import {beforeAll, afterAll, afterEach} from '@jest/globals'
import { apiServer } from '../test/api-server';
import WS from "jest-websocket-mock";
import dotenv from 'dotenv';
import { QUIZ_ID } from '../test/test-utils';

// Load in the config to be used in tests from .env.production
// This makes it available at "process.env"
dotenv.config({ path: "./.env.production"})

// Enable API mocking before tests
beforeAll(() => apiServer.listen())

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
import { setupServer } from 'msw/node';
import { signOnHandlers } from './server-handlers';

export const apiServer = setupServer(...signOnHandlers)
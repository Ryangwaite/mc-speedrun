import { setupServer } from 'msw/node';
import { quizUploadHandlers, signOnHandlers } from './server-handlers';

export const apiServer = setupServer(
    ...signOnHandlers,
    ...quizUploadHandlers,
)
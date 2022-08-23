import { rest } from 'msw';
import { HOST_TOKEN, PARTICIPANT_TOKEN } from './test-utils';

/**
 * Happy-path mocks for sign-on handlers. Error responses should be defined
 * in the test setup themselves.
 */
export const signOnHandlers = [
    rest.post('/api/sign-on/host', async (req, res, ctx) => {
        const {token, expiresIn} = HOST_TOKEN
        return res(ctx.json({
            access_token: token,
            token_type: "Bearer",
            expires_in: expiresIn,
        }))
    }),
    rest.post('/api/sign-on/:quizId/join', (req, res, ctx) => {
        // const {quizId} = req.params
        const {token, expiresIn} = PARTICIPANT_TOKEN
        return res(ctx.json({
            "access_token": token,
            "token_type": "Bearer",
            "expires_in": expiresIn,
        }))
    })
]

export const quizUploadHandlers = [
    rest.post('/api/upload/quiz', async (req, res, ctx) => {
        const authHeader = req.headers.get("Authorization")
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res(
                ctx.status(401),
                ctx.text("Invalid 'Authorization' header"),
            )
        }
        console.log("Successfully uploaded quiz")
        return res(ctx.status(200))
    })
]
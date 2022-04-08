import { rest } from 'msw';
import jwt from "jsonwebtoken";

/**
 * Create an access token to return in the responses
 * @param isHost whether or not the token is for a user or host
 * @param quizId the id of the quiz this token provides access to
 * @param userId the userId when this token is not for a host
 */
function createAccessToken(isHost: boolean, quizId: string = "c0f77dcf", userId?: string): {
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

/**
 * Happy-path mocks for sign-on handlers. Error responses should be defined
 * in the test setup themselves.
 */
export const signOnHandlers = [
    rest.post('/sign-on/host', async (req, res, ctx) => {
        const {token, expiresIn} = createAccessToken(true)
        return res(ctx.json({
            access_token: token,
            token_type: "Bearer",
            expires_in: expiresIn,
        }))
    }),
    rest.post('/sign-on/:quizId/join', (req, res, ctx) => {
        const {quizId} = req.params
        const {token, expiresIn} = createAccessToken(false, quizId as string, "userid12")
        return res(ctx.json({
            "access_token": token,
            "token_type": "Bearer",
            "expires_in": expiresIn,
        }))
    })
]
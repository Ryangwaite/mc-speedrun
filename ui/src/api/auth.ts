import jwtDecode from "jwt-decode";
import { fetchSignOn } from "../utilities";

interface IAuthorizationResponse {
    access_token: string,
    token_type: string,
    expires_in: number, // seconds
}

export async function postHostQuiz(): Promise<IAuthorizationResponse> {
    const response = await fetchSignOn(`/sign-on/host`, {
        method: "POST",
    })

    if (!response.ok) {
        throw Error(`Failed to POST to '${response.url}' retured ${response.status} ${response.statusText}. Error: ${await response.text()}`)
    }

    const json: IAuthorizationResponse = await response.json()
    return json
}

export async function postJoinQuiz(quizId: string): Promise<IAuthorizationResponse> {
    const response = await fetchSignOn(`/sign-on/${quizId}/join`, {
        method: "POST",
    })

    if (!response.ok) {
        throw Error(`Failed to POST to '${response.url}' retured ${response.status} ${response.statusText}. Error: ${await response.text()}`)
    }

    const json: IAuthorizationResponse = await response.json()
    return json
}

export interface IJwtData {
    aud: string,
    exp: number,
    isHost: boolean,
    iss: string,
    quizId: string,
}

export interface IParticipantJwtData extends IJwtData {
    userId: string,
}

export function getJwtTokenClaims(token: string) {
    return jwtDecode(token) as IJwtData
}

export function getParticipantJwtTokenClaims(token: string) {
    return jwtDecode(token) as IParticipantJwtData
}
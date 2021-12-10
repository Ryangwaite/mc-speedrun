import jwtDecode from "jwt-decode";

/**
 * Gets the base URL from the evironment for contacting the sign-on service
 * CORs will need to be enable so that any requests succeed.
 * @returns 
 */
function getSignOnBaseUrl(): string {
    return process.env.REACT_APP__SIGN_ON_URL ? process.env.REACT_APP__SIGN_ON_URL : ""
}

/**
 * Wrapper around 'fetch' for all requests destined for the sign-on service
 * @param route 
 * @param init 
 * @returns 
 */
function fetchSignOn(route: string, init?: RequestInit | undefined): Promise<Response> {
    const url = getSignOnBaseUrl() + route
    return fetch(url, {
        cache: "no-cache",
        ...init
    })
}

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
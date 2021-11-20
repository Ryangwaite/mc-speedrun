import { fetchSignOn } from "../utilities";

interface IAuthorizationResponse {
    access_token: string,
    token_type: string,
    expires_in: number, // seconds
}

export async function postHostQuiz(quizName: string): Promise<IAuthorizationResponse> {
    const response = await fetchSignOn(`/sign-on/host/${quizName}`, {
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
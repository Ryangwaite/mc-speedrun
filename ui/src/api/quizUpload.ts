import { getJwtTokenClaims } from "./auth"

/**
 * Gets the base URL from the evironment for contacting the sign-on service
 * CORs will need to be enable so that any requests succeed.
 * @returns 
 */
function getQuizUploadBaseUrl(): string {
    return process.env.REACT_APP__QUIZ_UPLOAD_URL ? process.env.REACT_APP__QUIZ_UPLOAD_URL : ""
}

export async function uploadQuiz(quizFile: File, token: string) {
    const formData = new FormData()
    formData.append("file", quizFile)

    // TODO: Implement the backend for this
    // const {quizId} = getJwtTokenClaims(token)
    // const url = `${getQuizUploadBaseUrl()}/upload/${quizId}/quiz`
    // fetch(url, {
    //     headers: {
    //         "Authorization": `Bearer ${token}`
    //     },
    //     method: "POST",
    //     body: formData,
    // })
    // return 201 on success else 4xx on failure which is the result of parsing on the server side

    // Sleep for 300ms to simulate network latency
    await new Promise(resolve => setTimeout(resolve, 1000))

    // throw new Error("File was incorrectly formatted") // comment out to show error behaviour
}
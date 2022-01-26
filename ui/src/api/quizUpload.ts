
/**
 * Gets the base URL from the evironment for contacting the sign-on service
 * CORs needs to be enabled also.
 * @returns 
 */
function getQuizUploadBaseUrl(): string {
    return process.env.REACT_APP__QUIZ_UPLOAD_URL ? process.env.REACT_APP__QUIZ_UPLOAD_URL : ""
}

export async function uploadQuiz(quizFile: File, token: string) {
    const formData = new FormData()
    formData.append("file", quizFile)

    const url = `${getQuizUploadBaseUrl()}/upload/quiz`
    console.log("Upload url is, ", url)
    const response = await fetch(url, {
        headers: {
            "Authorization": `Bearer ${token}`
        },
        method: "POST",
        body: formData,
    })

    if (!response.ok) {
        throw new Error(`Upload failed: ${await response.text()}`)
    }
}
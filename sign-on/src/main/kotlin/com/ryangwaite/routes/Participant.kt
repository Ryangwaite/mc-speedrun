package com.ryangwaite.routes

import io.ktor.application.*
import io.ktor.http.*
import io.ktor.response.*
import io.ktor.routing.*
import com.ryangwaite.models.AuthorizationResponse
import com.ryangwaite.utilities.IRepository
import com.ryangwaite.utilities.createJwtToken

fun Application.participant(
    repository: IRepository,
) {
    routing {

        /**
         * Return a Jwt token for authorizing to the permitted quiz
         * This is modelled after https://self-issued.info/docs/draft-ietf-oauth-v2-bearer.html#ExAccTokResp
         */
        post("/sign-on/{quiz_id}/join") {
            val quizId = call.parameters["quiz_id"]!!

            if (!repository.quizExists(quizId)) {
                return@post call.respondText("Invalid quiz ID '$quizId' provided", status = HttpStatusCode.NotFound)
            }
            log.info("Participant joined quiz session $quizId")

            val (token, expiresInSecs) = createJwtToken(environment, quizId, false)

            val responsePayload = AuthorizationResponse(
                access_token = token,
                token_type = "Bearer",
                expires_in = expiresInSecs,
            )
            call.respond(responsePayload)
        }
    }
}
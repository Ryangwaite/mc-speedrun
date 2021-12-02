package com.ryangwaite.routes

import io.ktor.application.*
import io.ktor.http.*
import io.ktor.response.*
import io.ktor.routing.*
import com.ryangwaite.models.AuthorizationResponse
import com.ryangwaite.utilities.IRepository
import com.ryangwaite.utilities.MemoryRepository
import com.ryangwaite.utilities.createJwtToken
import com.ryangwaite.utilities.generateId
import io.ktor.util.*
import java.util.*

fun Application.host(repository: IRepository) {
    routing {
        post("/sign-on/host") {

            val quizId = generateId()
            repository.createQuiz(quizId)
            log.info("Created new quiz session: id = $quizId")

            val (token, expiresInSecs) = createJwtToken(environment, quizId, true)

            val responsePayload = AuthorizationResponse(
                access_token = token,
                token_type = "Bearer",
                expires_in = expiresInSecs,
            )
            call.respond(responsePayload)
        }
    }
}
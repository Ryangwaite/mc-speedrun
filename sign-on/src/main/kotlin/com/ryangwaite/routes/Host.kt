package com.ryangwaite.routes

import io.ktor.application.*
import io.ktor.http.*
import io.ktor.response.*
import io.ktor.routing.*
import com.ryangwaite.models.AuthorizationResponse
import com.ryangwaite.utilities.IRepository
import com.ryangwaite.utilities.MemoryRepository
import com.ryangwaite.utilities.createJwtToken
import java.util.*

/**
 * Generate an 8 character code that is most likely unique
 */
fun generateCodeImpl(): String {
    return UUID.randomUUID().toString().replace("-", "").take(8)
}

fun Application.host(
    repository: IRepository,
    // Overideable for tests
    generateQuizId: () -> String = {generateCodeImpl()},
) {
    routing {
        post("/sign-on/host") {

            val quizId = generateQuizId()
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
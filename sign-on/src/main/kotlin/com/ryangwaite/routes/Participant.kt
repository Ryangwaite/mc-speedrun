package com.ryangwaite.routes

import com.ryangwaite.sessions
import io.ktor.application.*
import io.ktor.http.*
import io.ktor.response.*
import io.ktor.routing.*

fun Application.participant() {
    routing {
        post("/join/{code}") {
            val code = call.parameters["code"]!!

            if (!sessions.contains(code)) {
                return@post call.respondText("Invalid code '$code' provided", status = HttpStatusCode.NotFound)
            }

            // TODO: build a jwt and return it

            call.respondText("ALL good")
        }
    }
}
package com.ryangwaite.routes

import io.ktor.server.application.*
import io.ktor.server.response.*
import io.ktor.server.routing.*

/**
 * Simple no-op endpoint for checking if the service is operational.
 */
fun Application.healthCheck() {
    routing {
        get("/ping") {
            call.respondText { "pong" }
        }
    }
}

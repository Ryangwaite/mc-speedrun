package com.ryangwaite
import com.ryangwaite.routes.participant
import io.ktor.application.*
import io.ktor.response.*
import io.ktor.routing.*
import io.ktor.server.netty.*

fun main(args: Array<String>): Unit = EngineMain.main(args)

// NOTE: This is temporary until redis is added
var sessions = mutableListOf<String>()

fun Application.module(testing: Boolean = false) {
    configureRouting()
}

/**
 * Configure routing via extension so that it can be tested
 * independent of module.
 */
fun Application.configureRouting() {
    participant()
}
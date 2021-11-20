package com.ryangwaite

import io.ktor.application.*
import io.ktor.response.*
import io.ktor.routing.*
import io.ktor.server.netty.*

fun main(args: Array<String>): Unit = EngineMain.main(args)

fun Application.module(testing: Boolean = false) {

    routing {
        get("/hello") {
            call.respondText("Hello world!!")
        }
    }

}

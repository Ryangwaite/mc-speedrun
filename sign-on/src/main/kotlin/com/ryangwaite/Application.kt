package com.ryangwaite
import com.ryangwaite.routes.host
import com.ryangwaite.routes.participant
import com.ryangwaite.utilities.IRepository
import com.ryangwaite.utilities.MemoryRepository
import io.ktor.application.*
import io.ktor.features.*
import io.ktor.serialization.*
import io.ktor.server.netty.*

fun main(args: Array<String>): Unit = EngineMain.main(args)

fun Application.module(testing: Boolean = false) {
    install(ContentNegotiation) {
        json()
    }

    val repository = MemoryRepository()
    configureRouting(repository)
}

/**
 * Configure routing via extension so that it can be tested
 * independent of module.
 */
fun Application.configureRouting(repository: IRepository) {
    participant(repository)
    host(repository)
}
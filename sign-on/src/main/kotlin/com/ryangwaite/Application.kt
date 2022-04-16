package com.ryangwaite
import com.ryangwaite.routes.host
import com.ryangwaite.routes.participant
import com.ryangwaite.utilities.IRepository
import com.ryangwaite.utilities.MemoryRepository
import io.ktor.server.application.*
import io.ktor.serialization.kotlinx.json.*
import io.ktor.server.netty.*
import io.ktor.server.plugins.contentnegotiation.*
import io.ktor.server.plugins.cors.*

fun main(args: Array<String>): Unit = EngineMain.main(args)

fun Application.module() {
    install(ContentNegotiation) {
        json()
    }
    if (environment.developmentMode) {
        install(CORS) {
            this@module.log.info("Enabling CORS from any host")
            anyHost()
        }
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
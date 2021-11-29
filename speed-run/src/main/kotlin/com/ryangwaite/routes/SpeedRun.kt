package com.ryangwaite.routes

import com.ryangwaite.connection.Connection
import io.ktor.application.*
import io.ktor.auth.*
import io.ktor.http.cio.websocket.*
import io.ktor.routing.*
import io.ktor.websocket.*
import java.util.*
import kotlin.collections.LinkedHashSet

fun Application.speedRun() {
    routing {
        val connections = Collections.synchronizedSet<Connection>(LinkedHashSet())
        authenticate {
            webSocket("/speed-run/{quiz_id}/ws") {

                log.info("New connection initiated from '$this'")

                // TODO: process JWT token to pull out a couple of parameters needed for building the connection
                val thisConnection = Connection(this, "12345", true)
                connections += thisConnection

                try {
                    for (frame in incoming) {
                        // Only process text frames - skip all else
                        frame as? Frame.Text ?: continue
                        val receivedText = frame.readText()
                        send("You sent: $receivedText")
                    }
                } catch (e: Exception) {
                    log.error("Error: $e")
                } finally {
                    connections -= thisConnection
                    log.info("Connection '$this' closed.")
                }
            }
        }
    }
}
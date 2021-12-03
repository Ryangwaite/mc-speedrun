package com.ryangwaite.connection

import io.ktor.http.cio.websocket.*
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.channels.actor
import kotlinx.coroutines.launch
import java.util.*
import java.util.logging.Logger
import kotlin.collections.LinkedHashSet

fun CoroutineScope.connectionManagerActor() = actor<ConnectionManagerMsg> {

    /**
     * IMPORTANT: All operations on the 'connections' map itself must be performed
     * directly in this coroutine scope to avoid race conditions. The contained
     * Connection data structures are thread-safe and so multiple coroutines can
     * access concurrently.
     */
    val connections = mutableMapOf<String, MutableList<Connection>>()

    /**
     * Adds the connection
     */
    fun addConnection(connection: Connection) {
        if (!connections.containsKey(connection.quizId)) {
            connections[connection.quizId] = mutableListOf()
        }
        connections[connection.quizId]!!.add(connection)
        println("Connections: $connections")
    }

    /**
     *
     */
    suspend fun sendRemoveConnection(connection: Connection) {
        this.channel.send(RemoveConnection(connection))
    }

    for (msg: ConnectionManagerMsg in channel) {
        when (msg) {
            is NewConnection -> {
                val connection = msg.connection
                println("Received connection for ${connection.quizId}")
                addConnection(connection)

                connection.socketSession.outgoing.send(Frame.Text("Hello"))

                val job = launch {
                    try {
                        for (frame in connection.socketSession.incoming) {
                            frame as? Frame.Text ?: continue
                            val text = frame.readText()
                            if (text == "bye\n") {
                                break
                            } else {
                                connection.socketSession.outgoing.send(Frame.Text("You sent: $text"))
                            }
                        }
                    } finally {
                        sendRemoveConnection(connection)
                        println("Job finished")
                    }
                }
            }
            is RemoveConnection -> {
                // Make sure this connection actually exists
                val connection = msg.connection
                if (!connections.getOrDefault(connection.quizId, mutableListOf()).contains(connection)) {
                    println("Error: Tried to remove connection that doesn't exist: $connection")
                }

                // Close the connection and signal to the ktor websocket route that this connections closed
                connection.socketSession.close(CloseReason(CloseReason.Codes.NORMAL, "You sent 'bye'"))
                connection.websocketCloseFuture.complete(null)

                connections[connection.quizId]!!.removeIf { it == connection }
                if (connections[connection.quizId]!!.isEmpty()) {
                    connections.remove(connection.quizId)
                }
                println("Connections: $connections")
            }
        }
    }

}
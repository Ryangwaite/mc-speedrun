package com.ryangwaite.connection

import com.ryangwaite.protocol.Packet
import com.ryangwaite.protocol.ParticipantConfigMsg
import com.ryangwaite.redis.IDataStore
import com.ryangwaite.subscribe.SubscriptionMessages
import io.ktor.http.cio.websocket.*
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.channels.actor
import kotlinx.coroutines.launch
import kotlinx.serialization.decodeFromString
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json

fun CoroutineScope.connectionManagerActor(datastore: IDataStore, publisher: IPublish) = actor<ConnectionManagerMsg> {

    /**
     * IMPORTANT: All operations on the 'connections' map itself must be performed
     * directly in this coroutine scope to avoid race conditions. The contained
     * Connection data structures are thread-safe and so multiple coroutines can
     * access concurrently.
     */
    val connections = mutableMapOf<String /*quizId*/, MutableList<Connection>>()

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

    suspend fun processInboundClientPacket(quizId: String, packet: String, userId: String? = null) {
        val deserializedPacket = Json.decodeFromString<Packet>(packet)
        when (val payload = deserializedPacket.payload) {
            is ParticipantConfigMsg -> {
                datastore.apply {
                    setUsername(quizId, userId!!, payload.name)
                    addLeaderboardItem(quizId, userId, 0)
                }
                publisher.publishQuizEvent(quizId, SubscriptionMessages.`LEADERBOARD-UPDATED`)
            }
            else -> println("Unknown packet received: $packet")
        }
    }

    for (msg: ConnectionManagerMsg in channel) {
        when (msg) {
            is NewConnection -> {
                val connection = msg.connection
                println("Received connection for ${connection.quizId}")
                addConnection(connection)

                val job = launch {
                    try {
                        for (frame in connection.socketSession.incoming) {
                            frame as? Frame.Text ?: continue
                            val text = frame.readText()
                            when (connection) {
                                is HostConnection -> processInboundClientPacket(connection.quizId, text)
                                is ParticipantConnection -> processInboundClientPacket(connection.quizId, text, userId = connection.userId)
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
            is ForwardMsg -> {
                val serializedPacket = Json.encodeToString(Packet.encapsulate(msg.msgToForward))
                // Let all clients (all participants and host) know the content
                connections[msg.quizId]!!.forEach { connection ->
                    connection.socketSession.outgoing.send(Frame.Text(serializedPacket))
                }
            }
        }
    }

}
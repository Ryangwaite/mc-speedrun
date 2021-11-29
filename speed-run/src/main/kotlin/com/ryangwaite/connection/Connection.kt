package com.ryangwaite.connection

import io.ktor.websocket.*


data class Connection(val socketSession: DefaultWebSocketServerSession, val quizId: String, val isHost: Boolean) {
    // Name of the user - doesn't apply to hosts
    // It is initialised after the connection is established
    var userName: String? = null
}
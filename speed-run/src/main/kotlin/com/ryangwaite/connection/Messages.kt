package com.ryangwaite.connection

import com.ryangwaite.protocol.ProtocolMsg

sealed class ConnectionManagerMsg

data class NewConnection(
    val connection: Connection,
): ConnectionManagerMsg()

data class RemoveConnection(
    val connection: Connection,
): ConnectionManagerMsg()

data class ForwardMsgToAll(
    val quizId: String,
    val msgToForward: ProtocolMsg,
): ConnectionManagerMsg()

data class ForwardMsgToHost(
    val quizId: String,
    val msgToForward: ProtocolMsg,
): ConnectionManagerMsg()

data class ForwardMsgToParticipant(
    val quizId: String,
    val userId: String,
    val msgToForward: ProtocolMsg,
): ConnectionManagerMsg()
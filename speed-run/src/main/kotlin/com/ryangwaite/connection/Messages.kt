package com.ryangwaite.connection

import com.ryangwaite.protocol.ProtocolMsg

sealed class ConnectionManagerMsg

class NewConnection(
    val connection: Connection,
): ConnectionManagerMsg()

class RemoveConnection(
    val connection: Connection,
): ConnectionManagerMsg()

class ForwardMsg(
    val quizId: String,
    val msgToForward: ProtocolMsg,
): ConnectionManagerMsg()
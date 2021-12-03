package com.ryangwaite.connection

sealed class ConnectionManagerMsg

class NewConnection(
    val connection: Connection,
): ConnectionManagerMsg()

class RemoveConnection(
    val connection: Connection,
): ConnectionManagerMsg()

class SubscriptionMsg(
    val msg: String
): ConnectionManagerMsg()
package com.ryangwaite.connection

import kotlinx.coroutines.CompletableDeferred

sealed class ConnectionManagerMsg

class NewConnection(
    val connection: Connection,
): ConnectionManagerMsg()

class RemoveConnection(
    val connection: Connection,
): ConnectionManagerMsg()
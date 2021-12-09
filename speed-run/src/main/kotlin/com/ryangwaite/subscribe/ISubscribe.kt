package com.ryangwaite.subscribe

import kotlinx.coroutines.flow.Flow

interface ISubscribe {
    fun subscribeToTopic(topic: String): Flow<String>
}
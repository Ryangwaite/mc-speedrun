package com.ryangwaite.subscribe

import kotlinx.coroutines.flow.Flow

interface ISubscribe {
    fun subscribeToQuizEvents(quizId: String): Flow<String>
}
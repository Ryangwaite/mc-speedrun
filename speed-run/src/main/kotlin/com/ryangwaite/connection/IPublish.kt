package com.ryangwaite.connection

import com.ryangwaite.subscribe.SubscriptionMessages

interface IPublish {
    suspend fun publishQuizEvent(quizId: String, msg: SubscriptionMessages)
}
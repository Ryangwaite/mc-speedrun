package com.ryangwaite.subscribe

sealed class SubscriptionActorMsg

data class AddSubscription(
    val quizId: String
): SubscriptionActorMsg()

data class RemoveSubscription(
    val quizId: String
): SubscriptionActorMsg()

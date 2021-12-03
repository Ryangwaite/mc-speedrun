package com.ryangwaite.subscribe

import com.ryangwaite.config.RedisClient
import com.ryangwaite.connection.ConnectionManagerMsg
import com.ryangwaite.connection.SubscriptionMsg
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.channels.SendChannel
import kotlinx.coroutines.channels.actor
import kotlinx.coroutines.flow.*

fun CoroutineScope.subscriberActor(wsSendChannel: SendChannel<ConnectionManagerMsg>) = actor<SubscriberMsg> {

    val subscription: Flow<String> = RedisClient.subscribeToTopic("test")

    subscription.collect {
        wsSendChannel.send(SubscriptionMsg(it))
    }
}
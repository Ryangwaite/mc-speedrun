package com.ryangwaite.subscribe

import com.ryangwaite.connection.ConnectionManagerMsg
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.channels.SendChannel
import kotlinx.coroutines.channels.actor

fun CoroutineScope.subscriberActor(subscriber: ISubscribe, wsSendChannel: SendChannel<ConnectionManagerMsg>) = actor<SubscriberMsg> {

//    val subscription: Flow<String> = subscriber.subscribeToTopic("test")
//
//    subscription.collect {
//        wsSendChannel.send(SubscriptionMsg(it))
//    }
}
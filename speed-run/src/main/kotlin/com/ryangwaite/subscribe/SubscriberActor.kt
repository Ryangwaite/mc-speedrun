package com.ryangwaite.subscribe

import com.ryangwaite.connection.ConnectionManagerMsg
import com.ryangwaite.connection.ForwardMsg
import com.ryangwaite.protocol.BroadcastLeaderboardMsg
import com.ryangwaite.redis.IDataStore
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Job
import kotlinx.coroutines.cancelAndJoin
import kotlinx.coroutines.channels.SendChannel
import kotlinx.coroutines.channels.actor
import kotlinx.coroutines.flow.collect
import kotlinx.coroutines.launch
import kotlinx.serialization.decodeFromString
import kotlinx.serialization.json.Json

data class Subscription(
    var numberOfClients: Int, // Count of how many clients depend on this subscription
    val flowProcessor: Job
)

fun CoroutineScope.subscriberActor(datastore: IDataStore, subscriber: ISubscribe, connectionManager: SendChannel<ConnectionManagerMsg>) = actor<SubscriptionActorMsg> {

    // key = quizId, value = Subscription
    val subscriptions = mutableMapOf<String, Subscription>()

    suspend fun processNotification(quizId: String, payload: String) {
        println("Received '$payload' for quizId '$quizId' from redis pub/sub")
        val msg = Json.decodeFromString<SubscriptionMessages>(payload)
        when (msg) {
            SubscriptionMessages.`LEADERBOARD-UPDATED` -> {
                println("Received LEADERBOARD-UPDATED from redis")
                val leaderboard = datastore.getLeaderboard(quizId)
                connectionManager.send(ForwardMsg(quizId, BroadcastLeaderboardMsg(leaderboard)))
            }
        }
    }

    for (msg: SubscriptionActorMsg in channel) {
        when (msg) {
            is AddSubscription -> {
                val quizId = msg.quizId
                println("Adding subscription for $quizId")
                if (!subscriptions.containsKey(quizId)) {
                    val flowProcessorJob = launch {
                        val flow = subscriber.subscribeToQuizEvents(quizId)
                        flow.collect {
                            processNotification(quizId, it)
                        }
                    }
                    subscriptions[quizId] = Subscription(0, flowProcessorJob)
                }
                subscriptions[quizId]!!.numberOfClients++
                println("Finished adding subscription")
            }
            is RemoveSubscription -> {
                val quizId = msg.quizId
                println("Removing subscription for $quizId")
                if (!subscriptions.containsKey(quizId)) {
                    println("Failed to remove subscription. There's no subscriptions to remove from") // todo log an error instead
                    continue
                }
                subscriptions[quizId]!!.numberOfClients--
                if (subscriptions[quizId]!!.numberOfClients == 0) {
                    subscriptions[quizId]!!.flowProcessor.cancelAndJoin()
                    subscriptions.remove(quizId)
                }
                println("Finished removing subscription")
            }
        }
    }
}
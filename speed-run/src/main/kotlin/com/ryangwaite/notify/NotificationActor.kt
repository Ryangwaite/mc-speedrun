package com.ryangwaite.notify

import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.channels.actor
import kotlinx.datetime.Clock
import org.slf4j.LoggerFactory
import java.util.*

sealed class NotificationActorMsg

data class QuizComplete(
    val quizId: String
): NotificationActorMsg()

fun CoroutineScope.notificationActor(notifier: INotifier) = actor<NotificationActorMsg> {
    val LOG = LoggerFactory.getLogger("NotificationActor")

    /**
     * Given the quizID, returns a quiz complete event encapsulating it
     */
    fun buildQuizCompleteEvent(quizId: String) = Event(
        "com.ryangwaite.mc-speedrun.quiz.complete.v1",
        "/mc-speedrun/quiz-complete",
        UUID.randomUUID().toString(),
        Clock.System.now(),
        EventData(
            quizId,
        ),
    )

    for (msg: NotificationActorMsg in channel) {
        when (msg) {
            is QuizComplete -> {
                LOG.info("Sending quiz complete event for '${msg.quizId}'")
                val event = buildQuizCompleteEvent(msg.quizId)
                try {
                    notifier.notify(event)
                } catch (e: Exception) {
                    LOG.info("Failed to publish event $event. Error: ${e.message}")
                }
            }
        }
    }
}
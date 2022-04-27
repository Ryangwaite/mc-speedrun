package com.ryangwaite.notify

import io.mockk.every
import io.mockk.impl.annotations.RelaxedMockK
import io.mockk.junit5.MockKExtension
import io.mockk.mockkObject
import io.mockk.mockkStatic
import io.mockk.verify
import kotlinx.coroutines.test.runTest
import kotlinx.datetime.Clock
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import java.util.*

@ExtendWith(MockKExtension::class)
class NotificationActorTest {

    @RelaxedMockK
    private lateinit var notifer: INotifier

    /**
     * When the NotificationActor receives a QuizComplete event,
     * it sends a corresponding QuizComplete notification to the notifier.
     */
    @Test
    fun `notifys in response to a QuizComplete msg`() = runTest {
        // Fix the current time and uuid
        val time = Clock.System.now()
        mockkObject(Clock.System)
        every { Clock.System.now() } returns time
        val uuid = UUID.randomUUID()
        mockkStatic(UUID::class)
        every { UUID.randomUUID() } returns uuid

        val quizId = "quizid"
        val notificationActorCh = notificationActor(notifer)

        notificationActorCh.send(QuizComplete(quizId))

        verify(exactly = 1) { notifer.notify(Event(
            "com.ryangwaite.mc-speedrun.quiz.complete.v1",
            "/mc-speedrun/quiz-complete",
            uuid.toString(),
            time,
            EventData(
                quizId,
            ),
        )) }

        // Close actor channel so the test doesn't hang
        notificationActorCh.close()
    }
}
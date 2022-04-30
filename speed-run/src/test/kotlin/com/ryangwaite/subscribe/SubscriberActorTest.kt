package com.ryangwaite.subscribe

import com.ryangwaite.connection.ConnectionManagerMsg
import com.ryangwaite.redis.IDataStore
import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.impl.annotations.RelaxedMockK
import io.mockk.junit5.MockKExtension
import io.mockk.mockkStatic
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.TimeoutCancellationException
import kotlinx.coroutines.channels.Channel
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.takeWhile
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.withTimeout
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import org.junit.jupiter.api.extension.ExtendWith

@ExperimentalCoroutinesApi
@ExtendWith(MockKExtension::class)
class SubscriberActorTest {

    @RelaxedMockK
    lateinit var datastore: IDataStore

    @RelaxedMockK
    lateinit var subscriber: ISubscribe

    lateinit var connectionManagerSendCh: Channel<ConnectionManagerMsg>

    @BeforeEach
    fun beforeEach() {
        connectionManagerSendCh = Channel(10)
    }

    @AfterEach
    fun afterEach() {
        connectionManagerSendCh.close()
    }

    /**
     * When an AddSubscription msg is received a new subscription job
     * is created. When RemoveSubscription is received, that subscription job
     * is removed.
     */
    @Test
    fun `AddSubscription msg adds a new subscription and RemoveSubsription removes it`() = runTest {
        mockkStatic(::processNotification)
        val notificationProcessedCh = Channel<Unit>(10) // Synchronizes processNotification with test
        coEvery { processNotification(any(), any(), any(), any()) } coAnswers {
            notificationProcessedCh.send(Unit)
        }
        val quizId = "quizId"
        // Create flow that we can emit to and close out-of-bound
        var isSubscribed = true
        val subscriptionFlowSrc = MutableSharedFlow<String>(10)
        val subscriptionFlow = subscriptionFlowSrc.takeWhile { isSubscribed }
        coEvery { subscriber.subscribeToQuizEvents(quizId) } returns subscriptionFlow

        val processNotificationCh = subscriberActor(datastore, subscriber, connectionManagerSendCh)

        // Send two msgs which should result in only 1 subscription worker being added
        val addMsg = AddSubscription(quizId)
        processNotificationCh.send(addMsg)
        processNotificationCh.send(addMsg)

        // Send the quiz event
        val event = "quizevent"
        subscriptionFlowSrc.emit(event)

        // Block waiting for the processNotification function to fire
        notificationProcessedCh.receive()
        coVerify(exactly = 1) { processNotification(datastore, connectionManagerSendCh, quizId, event) }

        // Remove only one subscription
        val removeMsg = RemoveSubscription(quizId)
        processNotificationCh.send(removeMsg)

        // Should still be processing events since there's still 1 subscription
        subscriptionFlowSrc.emit(event)
        notificationProcessedCh.receive()
        coVerify(exactly = 2) { processNotification(datastore, connectionManagerSendCh, quizId, event) }

        // Remove the last subscription and no more events should be processed
        processNotificationCh.send(removeMsg)
        subscriptionFlowSrc.emit(event)
        assertThrows<TimeoutCancellationException> { withTimeout(100) {
            notificationProcessedCh.receive()
        } }
        coVerify(exactly = 2) { processNotification(datastore, connectionManagerSendCh, quizId, event) }

        // Cleanup
        isSubscribed = false
        // Emit one last msg to close the flow
        subscriptionFlowSrc.emit("Trigger a check of the 'isSubscribed' flag")
        notificationProcessedCh.close()
        processNotificationCh.close()
    }




}
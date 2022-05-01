package com.ryangwaite.subscribe

import com.ryangwaite.connection.ConnectionManagerMsg
import com.ryangwaite.connection.ForwardMsgToAll
import com.ryangwaite.connection.ForwardMsgToHost
import com.ryangwaite.connection.ForwardMsgToParticipant
import com.ryangwaite.models.QuestionAndAnswers
import com.ryangwaite.protocol.*
import com.ryangwaite.redis.IDataStore
import com.ryangwaite.redis.MockDataStore
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
import kotlinx.datetime.Clock
import kotlinx.serialization.decodeFromString
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import org.junit.jupiter.api.extension.ExtendWith
import java.io.File
import kotlin.test.assertEquals

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

@ExperimentalCoroutinesApi
@ExtendWith(MockKExtension::class)
class ProcessNotificationTest {

    private val quizFile = "../sample-quizzes/example-1.json"
    private var datastore: MockDataStore = MockDataStore(quizFile)

    private val questions: List<QuestionAndAnswers> = Json.decodeFromString(File(quizFile).readText())

    lateinit var connectionManagerCh: Channel<ConnectionManagerMsg>

    @BeforeEach
    fun beforeEach() {
        connectionManagerCh = Channel(10)
    }

    @AfterEach
    fun afterEach() {
        connectionManagerCh.close()
    }

    @Test
    fun `Processing LEADERBOARD-UPDATED forwards the msg to all via connection manager`() = runTest {
        val quizId = "quizid"

        // add 3 users
        (1..3).forEach {
            datastore.apply {
                val userId = "user$it"
                addUserId(quizId, userId)
                setUsername(quizId, userId, "${userId}name")
                setLeaderboardItem(quizId, userId, 30 * it)
            }
        }

        val payload = Json.encodeToString(SubscriptionMessages.`LEADERBOARD-UPDATED`)
        processNotification(datastore, connectionManagerCh, quizId, payload)

        val sentMsg = connectionManagerCh.receive()
        assertEquals(ForwardMsgToAll(quizId, LeaderboardMsg(datastore.getLeaderboard(quizId))), sentMsg)
    }

    @Test
    fun `Processing NOTIFY-HOST-QUIZ-SUMMARY forwards msg to host via connection manager`() = runTest {
        val quizId = "quizid"

        val selectedQuestionIndexes = listOf(0, 1, 2)
        datastore.setSelectedQuestionIndexes(quizId, selectedQuestionIndexes)
        datastore.setQuestionDuration(quizId, 50)
        // add 3 users
        (1..3).forEach {
            datastore.apply {
                val userId = "user$it"
                addUserId(quizId, userId)
                setUsername(quizId, userId, "${userId}name")
                setLeaderboardItem(quizId, userId, 30 * it)
                setParticipantAnswer(quizId, userId, 0, questions[0].answers, 10)  // correct
                setParticipantAnswer(quizId, userId, 1, questions[1].answers, 10)  // correct
                setParticipantAnswer(quizId, userId, 2, questions[2].answers, 100) // time out
            }
        }

        val payload = Json.encodeToString(SubscriptionMessages.`NOTIFY-HOST-QUIZ-SUMMARY`)
        processNotification(datastore, connectionManagerCh, quizId, payload)

        val actualMsg = connectionManagerCh.receive()
        val (totalTimeElapsed, avgAnswerTimeMillis, hostQuestionSummary) = datastore.getHostQuizSummary(quizId)
        val expectedMsg = ForwardMsgToHost(quizId, NotifyHostQuizSummaryMsg(totalTimeElapsed, avgAnswerTimeMillis, hostQuestionSummary))
        assertEquals(expectedMsg, actualMsg)
    }

    @Test
    fun `Processing QUIZ-STARTED forwards msg to all via connection manager`() = runTest {
        val quizId = "quizid"

        val quizStartTime = Clock.System.now()
        val questionDuration = 100
        val selectedQuestionIndexes = listOf(1, 4, 7, 8)
        datastore.apply {
            setQuizStartTime(quizId, quizStartTime)
            setQuestionDuration(quizId, questionDuration)
            setSelectedQuestionIndexes(quizId, selectedQuestionIndexes)
        }

        val payload = Json.encodeToString(SubscriptionMessages.`QUIZ-STARTED`)
        processNotification(datastore, connectionManagerCh, quizId, payload)

        val actualMsg = connectionManagerCh.receive()
        val expectedMsg = ForwardMsgToAll(
            quizId,
            BroadcastStartMsg(quizStartTime.epochSeconds, questionDuration, selectedQuestionIndexes.size)
        )
        assertEquals(expectedMsg, actualMsg)
    }

    @Test
    fun `Processing QUIZ-FINISHED forwards unique participant summary for each participant and quiz finished to all via connection manager`() = runTest {
        val quizId = "quizid"

        val selectedQuestionIndexes = listOf(0, 1, 2)
        datastore.setSelectedQuestionIndexes(quizId, selectedQuestionIndexes)
        datastore.setQuestionDuration(quizId, 50)
        // add 3 users
        (1..3).forEach {
            datastore.apply {
                val userId = "user$it"
                addUserId(quizId, userId)
                setUsername(quizId, userId, "${userId}name")
                setLeaderboardItem(quizId, userId, 30 * it)
                setParticipantAnswer(quizId, userId, 0, questions[0].answers, 10)  // correct
                setParticipantAnswer(quizId, userId, 1, questions[1].answers, 10)  // correct
                setParticipantAnswer(quizId, userId, 2, questions[2].answers, 100) // time out
            }
        }

        val payload = Json.encodeToString(SubscriptionMessages.`QUIZ-FINISHED`)
        processNotification(datastore, connectionManagerCh, quizId, payload)

        // 4 msgs should be received - quiz summaries for 3 participants, 1 quiz finished for all
        val receivedMsgs = (1..4).map { connectionManagerCh.receive() }

        val expectedReceivedMsgs = mutableListOf<ConnectionManagerMsg>()
        (1..3).forEach {
            val userId = "user$it"
            val (totalElapsedTime, avgAnswerTime, participantQuestionSummary) = datastore.getParticipantQuizSummary(quizId, userId)
            expectedReceivedMsgs += ForwardMsgToParticipant(quizId, userId, NotifyParticipantQuizSummaryMsg(
                totalElapsedTime, avgAnswerTime, participantQuestionSummary
            ))
        }
        expectedReceivedMsgs += ForwardMsgToAll(quizId, BroadcastQuizFinishedMsg)

        assertEquals(expectedReceivedMsgs, receivedMsgs)
    }

    @Test
    fun `Processing PARTICIPANT-FINISHED forwards msg to all via connection manager`() = runTest {
        val quizId = "quizid"

        val selectedQuestionIndexes = listOf(0, 1, 2)
        datastore.setSelectedQuestionIndexes(quizId, selectedQuestionIndexes)
        datastore.setQuestionDuration(quizId, 50)
        // add 3 users
        (1..3).forEach {
            datastore.apply {
                val userId = "user$it"
                addUserId(quizId, userId)
                setUsername(quizId, userId, "${userId}name")
                setLeaderboardItem(quizId, userId, 30 * it)
                setParticipantAnswer(quizId, userId, 0, questions[0].answers, 10)  // correct
                setParticipantAnswer(quizId, userId, 1, questions[1].answers, 10)  // correct
                if (it != 3) {
                    // Only the third participant hasn't finished
                    setParticipantAnswer(quizId, userId, 2, questions[2].answers, 100) // time out
                }
            }
        }

        val payload = Json.encodeToString(SubscriptionMessages.`PARTICIPANT-FINISHED`)
        processNotification(datastore, connectionManagerCh, quizId, payload)

        val actualMsg = connectionManagerCh.receive()
        val expectedMsg = ForwardMsgToAll(quizId, BroadcastParticipantFinishedMsg(2))
        assertEquals(expectedMsg, actualMsg)
    }
}
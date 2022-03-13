import com.ryangwaite.notify.Event
import com.ryangwaite.notify.EventData
import com.ryangwaite.notify.IEventData
import com.ryangwaite.protocol.HostConfigMsg
import com.ryangwaite.protocol.Packet
import com.ryangwaite.protocol.ProtocolMsg
import kotlinx.datetime.Instant
import kotlinx.serialization.decodeFromString
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import org.junit.jupiter.api.Test
import kotlin.test.assertEquals
import kotlin.test.assertIs

class testPacket {
    @Test
    fun `test serialize event`() {

        val event = Event(
            "com.ryangwaite.mc-speedrun.quiz.complete.v1",
            "/mc-speedrun/quiz-complete",
            "555a472a-5797-4935-8d84-aba4212dd865",
            Instant.fromEpochSeconds(1647071361),
            EventData(
                "quizid",
            ),
        )
        val serializedEvent = Json.encodeToString(event)
        assertEquals(
            """{"type":"com.ryangwaite.mc-speedrun.quiz.complete.v1","source":"/mc-speedrun/quiz-complete","id":"555a472a-5797-4935-8d84-aba4212dd865","time":"2022-03-12T07:49:21Z","data":{"quizId":"quizid"}}""",
            serializedEvent
        )
    }

    @Test
    fun `test deserialize event`() {
        val json =
            """{"type":"com.ryangwaite.mc-speedrun.quiz.complete.v1","source":"/mc-speedrun/quiz-complete","id":"555a472a-5797-4935-8d84-aba4212dd865","time":"2022-03-12T07:49:21Z","data":{"quizId":"quizid"}}"""
        val actualDeserializedEvent = Json.decodeFromString<Event>(json)
        val expectedDeserializedEvent = Event(
            "com.ryangwaite.mc-speedrun.quiz.complete.v1",
            "/mc-speedrun/quiz-complete",
            "555a472a-5797-4935-8d84-aba4212dd865",
            Instant.fromEpochSeconds(1647071361),
            EventData(
                "quizid",
            ),
        )

        assertEquals(expectedDeserializedEvent, actualDeserializedEvent)
    }
}
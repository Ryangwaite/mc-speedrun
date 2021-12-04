package com.ryangwaite.protocol

import kotlinx.serialization.KSerializer
import kotlinx.serialization.Serializable
import kotlinx.serialization.SerializationException
import kotlinx.serialization.descriptors.SerialDescriptor
import kotlinx.serialization.descriptors.buildClassSerialDescriptor
import kotlinx.serialization.descriptors.element
import kotlinx.serialization.encoding.CompositeDecoder
import kotlinx.serialization.encoding.Decoder
import kotlinx.serialization.encoding.Encoder

@Serializable(with = PacketSerializer::class)
data class Packet(
    val type: Msg.Type,
    val data: Msg,
)

object PacketSerializer: KSerializer<Packet> {

    override val descriptor: SerialDescriptor = buildClassSerialDescriptor("Packet") {
        element<String>("type")
        element<String>("data")
    }

    override fun serialize(encoder: Encoder, value: Packet) {

        // Add opening '{'
        val compositeEnc = encoder.beginStructure(descriptor)
        // Add "type": ..., item
        compositeEnc.encodeSerializableElement(descriptor, 0, Msg.Type.serializer(), value.type)

        // Add "data": {...} item
        when(value.data) {
            is HostConfigMsg -> compositeEnc.encodeSerializableElement(descriptor, 1, HostConfigMsg.serializer(), value.data)
            is HostStartMsg -> compositeEnc.encodeSerializableElement(descriptor, 1, HostStartMsg.serializer(), value.data)
            is NotifyHostAnswerMsg -> compositeEnc.encodeSerializableElement(descriptor, 1, NotifyHostAnswerMsg.serializer(), value.data)
            is RequestHostQuizSummaryMsg -> compositeEnc.encodeSerializableElement(descriptor, 1, RequestHostQuizSummaryMsg.serializer(), value.data)
            is ResponseHostQuizSummaryMsg -> compositeEnc.encodeSerializableElement(descriptor, 1, ResponseHostQuizSummaryMsg.serializer(), value.data)
            is ParticipantConfigMsg -> compositeEnc.encodeSerializableElement(descriptor, 1, ParticipantConfigMsg.serializer(), value.data)
            is ParticipantAnswerMsg -> compositeEnc.encodeSerializableElement(descriptor, 1, ParticipantAnswerMsg.serializer(), value.data)
            is ParticipantAnswerTimeoutMsg -> compositeEnc.encodeSerializableElement(descriptor, 1, ParticipantAnswerTimeoutMsg.serializer(), value.data)
            is RequestParticipantQuestionMsg -> compositeEnc.encodeSerializableElement(descriptor, 1, RequestParticipantQuestionMsg.serializer(), value.data)
            is ResponseParticipantQuestionMsg -> compositeEnc.encodeSerializableElement(descriptor, 1, ResponseParticipantQuestionMsg.serializer(), value.data)
            is RequestParticipantResultsMsg -> compositeEnc.encodeSerializableElement(descriptor, 1, RequestParticipantResultsMsg.serializer(), value.data)
            is ResponseParticipantResultsMsg -> compositeEnc.encodeSerializableElement(descriptor, 1, ResponseParticipantResultsMsg.serializer(), value.data)
            is BroadcastParticipantConfigMsg -> compositeEnc.encodeSerializableElement(descriptor, 1, BroadcastParticipantConfigMsg.serializer(), value.data)
            is BroadcastStartMsg -> compositeEnc.encodeSerializableElement(descriptor, 1, BroadcastStartMsg.serializer(), value.data)
            is BroadcastLeaderboardMsg -> compositeEnc.encodeSerializableElement(descriptor, 1, BroadcastLeaderboardMsg.serializer(), value.data)
        }

        // Add closing '}'
        compositeEnc.endStructure(descriptor)                                                          // }
    }

    override fun deserialize(decoder: Decoder): Packet {
        val compositeDec = decoder.beginStructure(descriptor)

        var index = compositeDec.decodeElementIndex(descriptor)
        val type: Msg.Type = compositeDec.decodeSerializableElement(descriptor, index, Msg.Type.serializer())

        index = compositeDec.decodeElementIndex(descriptor)
        val msgSerializer = when(type) {
            Msg.Type.`HOST-CONFIG` -> HostConfigMsg.serializer()
            Msg.Type.`HOST-START` -> HostStartMsg.serializer()
            Msg.Type.`NOTIFY-HOST-ANSWER` -> NotifyHostAnswerMsg.serializer()
            Msg.Type.`REQUEST-HOST-QUIZ-SUMMARY` -> RequestHostQuizSummaryMsg.serializer()
            Msg.Type.`RESPONSE-HOST-QUIZ-SUMMARY` -> ResponseHostQuizSummaryMsg.serializer()
            Msg.Type.`PARTICIPANT-CONFIG` -> ParticipantConfigMsg.serializer()
            Msg.Type.`PARTICIPANT-ANSWER` -> ParticipantAnswerMsg.serializer()
            Msg.Type.`PARTICIPANT-ANSWER-TIMEOUT` -> ParticipantAnswerTimeoutMsg.serializer()
            Msg.Type.`REQUEST-PARTICIPANT-QUESTION` -> RequestParticipantQuestionMsg.serializer()
            Msg.Type.`RESPONSE-PARTICIPANT-QUESTION` -> ResponseParticipantQuestionMsg.serializer()
            Msg.Type.`REQUEST-PARTICIPANT-RESULTS` -> RequestParticipantResultsMsg.serializer()
            Msg.Type.`RESPONSE-PARTICIPANT-RESULTS` -> ResponseParticipantResultsMsg.serializer()
            Msg.Type.`BROADCAST-PARTICIPANT-CONFIG` -> BroadcastParticipantConfigMsg.serializer()
            Msg.Type.`BROADCAST-START` -> BroadcastStartMsg.serializer()
            Msg.Type.`BROADCAST-LEADERBOARD` -> BroadcastLeaderboardMsg.serializer()
        }
        val data = compositeDec.decodeSerializableElement(descriptor, index, msgSerializer)

        // There shouldn't be any more elements
        index = compositeDec.decodeElementIndex(descriptor)
        if (index != CompositeDecoder.DECODE_DONE) {
            throw SerializationException("Unexpected element present at index $index")
        }

        compositeDec.endStructure(descriptor)

        return Packet(
            type,
            data
        )
    }
}
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
    val payload: Msg,
)

object PacketSerializer: KSerializer<Packet> {

    override val descriptor: SerialDescriptor = buildClassSerialDescriptor("Packet") {
        element<String>("type")
        element<String>("payload")
    }

    override fun serialize(encoder: Encoder, value: Packet) {

        // Add opening '{'
        val compositeEnc = encoder.beginStructure(descriptor)
        // Add "type": ..., item
        compositeEnc.encodeSerializableElement(descriptor, 0, Msg.Type.serializer(), value.type)

        // Add "data": {...} item
        when(value.payload) {
            is HostConfigMsg -> compositeEnc.encodeSerializableElement(descriptor, 1, HostConfigMsg.serializer(), value.payload)
            is HostStartMsg -> compositeEnc.encodeSerializableElement(descriptor, 1, HostStartMsg.serializer(), value.payload)
            is NotifyHostAnswerMsg -> compositeEnc.encodeSerializableElement(descriptor, 1, NotifyHostAnswerMsg.serializer(), value.payload)
            is RequestHostQuizSummaryMsg -> compositeEnc.encodeSerializableElement(descriptor, 1, RequestHostQuizSummaryMsg.serializer(), value.payload)
            is ResponseHostQuizSummaryMsg -> compositeEnc.encodeSerializableElement(descriptor, 1, ResponseHostQuizSummaryMsg.serializer(), value.payload)
            is ParticipantConfigMsg -> compositeEnc.encodeSerializableElement(descriptor, 1, ParticipantConfigMsg.serializer(), value.payload)
            is ParticipantAnswerMsg -> compositeEnc.encodeSerializableElement(descriptor, 1, ParticipantAnswerMsg.serializer(), value.payload)
            is ParticipantAnswerTimeoutMsg -> compositeEnc.encodeSerializableElement(descriptor, 1, ParticipantAnswerTimeoutMsg.serializer(), value.payload)
            is RequestParticipantQuestionMsg -> compositeEnc.encodeSerializableElement(descriptor, 1, RequestParticipantQuestionMsg.serializer(), value.payload)
            is ResponseParticipantQuestionMsg -> compositeEnc.encodeSerializableElement(descriptor, 1, ResponseParticipantQuestionMsg.serializer(), value.payload)
            is RequestParticipantResultsMsg -> compositeEnc.encodeSerializableElement(descriptor, 1, RequestParticipantResultsMsg.serializer(), value.payload)
            is ResponseParticipantResultsMsg -> compositeEnc.encodeSerializableElement(descriptor, 1, ResponseParticipantResultsMsg.serializer(), value.payload)
            is BroadcastParticipantConfigMsg -> compositeEnc.encodeSerializableElement(descriptor, 1, BroadcastParticipantConfigMsg.serializer(), value.payload)
            is BroadcastStartMsg -> compositeEnc.encodeSerializableElement(descriptor, 1, BroadcastStartMsg.serializer(), value.payload)
            is BroadcastLeaderboardMsg -> compositeEnc.encodeSerializableElement(descriptor, 1, BroadcastLeaderboardMsg.serializer(), value.payload)
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
        val payload = compositeDec.decodeSerializableElement(descriptor, index, msgSerializer)

        // There shouldn't be any more elements
        index = compositeDec.decodeElementIndex(descriptor)
        if (index != CompositeDecoder.DECODE_DONE) {
            throw SerializationException("Unexpected element present at index $index")
        }

        compositeDec.endStructure(descriptor)

        return Packet(
            type,
            payload
        )
    }
}
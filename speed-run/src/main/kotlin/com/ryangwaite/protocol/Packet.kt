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
    val type: ProtocolMsg.Type,
    val payload: ProtocolMsg,
) {
    companion object {
        /**
         * Encapsulates the msg in a packet
         */
        fun encapsulate(msg: ProtocolMsg): Packet {
            val type = when(msg) {
                is HostConfigMsg -> ProtocolMsg.Type.`HOST-CONFIG`
                is HostStartMsg -> ProtocolMsg.Type.`HOST-START`
                is RequestHostQuestionsMsg -> ProtocolMsg.Type.`REQUEST-HOST-QUESTIONS`
                is ResponseHostQuestionsMsg -> ProtocolMsg.Type.`RESPONSE-HOST-QUESTIONS`
                is NotifyHostQuizSummaryMsg -> ProtocolMsg.Type.`NOTIFY-HOST-QUIZ-SUMMARY`
                is NotifyParticipantQuizSummaryMsg -> ProtocolMsg.Type.`NOTIFY-PARTICIPANT-QUIZ-SUMMARY`
                is ParticipantConfigMsg -> ProtocolMsg.Type.`PARTICIPANT-CONFIG`
                is ParticipantAnswerMsg -> ProtocolMsg.Type.`PARTICIPANT-ANSWER`
                is ParticipantAnswerTimeoutMsg -> ProtocolMsg.Type.`PARTICIPANT-ANSWER-TIMEOUT`
                is RequestParticipantQuestionMsg -> ProtocolMsg.Type.`REQUEST-PARTICIPANT-QUESTION`
                is ResponseParticipantQuestionMsg -> ProtocolMsg.Type.`RESPONSE-PARTICIPANT-QUESTION`
                is BroadcastParticipantConfigMsg -> ProtocolMsg.Type.`BROADCAST-PARTICIPANT-CONFIG`
                is BroadcastStartMsg -> ProtocolMsg.Type.`BROADCAST-START`
                is BroadcastLeaderboardMsg -> ProtocolMsg.Type.`BROADCAST-LEADERBOARD`
                is BroadcastQuizFinishedMsg -> ProtocolMsg.Type.`BROADCAST-QUIZ-FINISHED`
            }
            return Packet(type, msg)
        }
    }
}

object PacketSerializer: KSerializer<Packet> {

    override val descriptor: SerialDescriptor = buildClassSerialDescriptor("Packet") {
        element<String>("type")
        element<String>("payload")
    }

    override fun serialize(encoder: Encoder, value: Packet) {

        // Add opening '{'
        val compositeEnc = encoder.beginStructure(descriptor)
        // Add "type": ..., item
        compositeEnc.encodeSerializableElement(descriptor, 0, ProtocolMsg.Type.serializer(), value.type)

        // Add "data": {...} item
        when(value.payload) {
            is HostConfigMsg -> compositeEnc.encodeSerializableElement(descriptor, 1, HostConfigMsg.serializer(), value.payload)
            is HostStartMsg -> compositeEnc.encodeSerializableElement(descriptor, 1, HostStartMsg.serializer(), value.payload)
            is NotifyHostQuizSummaryMsg -> compositeEnc.encodeSerializableElement(descriptor, 1, NotifyHostQuizSummaryMsg.serializer(), value.payload)
            is NotifyParticipantQuizSummaryMsg -> compositeEnc.encodeSerializableElement(descriptor, 1, NotifyParticipantQuizSummaryMsg.serializer(), value.payload)
            is RequestHostQuestionsMsg -> compositeEnc.encodeSerializableElement(descriptor, 1, RequestHostQuestionsMsg.serializer(), value.payload)
            is ResponseHostQuestionsMsg -> compositeEnc.encodeSerializableElement(descriptor, 1, ResponseHostQuestionsMsg.serializer(), value.payload)
            is ParticipantConfigMsg -> compositeEnc.encodeSerializableElement(descriptor, 1, ParticipantConfigMsg.serializer(), value.payload)
            is ParticipantAnswerMsg -> compositeEnc.encodeSerializableElement(descriptor, 1, ParticipantAnswerMsg.serializer(), value.payload)
            is ParticipantAnswerTimeoutMsg -> compositeEnc.encodeSerializableElement(descriptor, 1, ParticipantAnswerTimeoutMsg.serializer(), value.payload)
            is RequestParticipantQuestionMsg -> compositeEnc.encodeSerializableElement(descriptor, 1, RequestParticipantQuestionMsg.serializer(), value.payload)
            is ResponseParticipantQuestionMsg -> compositeEnc.encodeSerializableElement(descriptor, 1, ResponseParticipantQuestionMsg.serializer(), value.payload)
            is BroadcastParticipantConfigMsg -> compositeEnc.encodeSerializableElement(descriptor, 1, BroadcastParticipantConfigMsg.serializer(), value.payload)
            is BroadcastStartMsg -> compositeEnc.encodeSerializableElement(descriptor, 1, BroadcastStartMsg.serializer(), value.payload)
            is BroadcastLeaderboardMsg -> compositeEnc.encodeSerializableElement(descriptor, 1, BroadcastLeaderboardMsg.serializer(), value.payload)
            is BroadcastQuizFinishedMsg -> compositeEnc.encodeSerializableElement(descriptor, 1, BroadcastQuizFinishedMsg.serializer(), value.payload)
        }

        // Add closing '}'
        compositeEnc.endStructure(descriptor)                                                          // }
    }

    override fun deserialize(decoder: Decoder): Packet {
        val compositeDec = decoder.beginStructure(descriptor)

        var index = compositeDec.decodeElementIndex(descriptor)
        val type: ProtocolMsg.Type = compositeDec.decodeSerializableElement(descriptor, index, ProtocolMsg.Type.serializer())

        index = compositeDec.decodeElementIndex(descriptor)
        val msgSerializer = when(type) {
            ProtocolMsg.Type.`HOST-CONFIG` -> HostConfigMsg.serializer()
            ProtocolMsg.Type.`HOST-START` -> HostStartMsg.serializer()
            ProtocolMsg.Type.`NOTIFY-HOST-QUIZ-SUMMARY` -> NotifyHostQuizSummaryMsg.serializer()
            ProtocolMsg.Type.`NOTIFY-PARTICIPANT-QUIZ-SUMMARY` -> NotifyParticipantQuizSummaryMsg.serializer()
            ProtocolMsg.Type.`REQUEST-HOST-QUESTIONS` -> RequestHostQuestionsMsg.serializer()
            ProtocolMsg.Type.`RESPONSE-HOST-QUESTIONS` -> ResponseHostQuestionsMsg.serializer()
            ProtocolMsg.Type.`PARTICIPANT-CONFIG` -> ParticipantConfigMsg.serializer()
            ProtocolMsg.Type.`PARTICIPANT-ANSWER` -> ParticipantAnswerMsg.serializer()
            ProtocolMsg.Type.`PARTICIPANT-ANSWER-TIMEOUT` -> ParticipantAnswerTimeoutMsg.serializer()
            ProtocolMsg.Type.`REQUEST-PARTICIPANT-QUESTION` -> RequestParticipantQuestionMsg.serializer()
            ProtocolMsg.Type.`RESPONSE-PARTICIPANT-QUESTION` -> ResponseParticipantQuestionMsg.serializer()
            ProtocolMsg.Type.`BROADCAST-PARTICIPANT-CONFIG` -> BroadcastParticipantConfigMsg.serializer()
            ProtocolMsg.Type.`BROADCAST-START` -> BroadcastStartMsg.serializer()
            ProtocolMsg.Type.`BROADCAST-LEADERBOARD` -> BroadcastLeaderboardMsg.serializer()
            ProtocolMsg.Type.`BROADCAST-QUIZ-FINISHED` -> BroadcastQuizFinishedMsg.serializer()
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
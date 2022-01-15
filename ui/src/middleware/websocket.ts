import { PayloadAction } from "@reduxjs/toolkit";
import { AnyAction, Middleware, MiddlewareAPI, Dispatch } from "redux"
import { push } from "redux-first-history";
import { getJwtTokenClaims } from "../api/auth";
import {
    BroadcastParticipantFinishedMsgType, BroadcastStartMsgType,
    BROADCAST_PARTICIPANT_FINISHED, BROADCAST_QUIZ_FINISHED,
    BROADCAST_START, HostConfigMsgType, HOST_CONFIG, LEADERBOARD,
    LeaderboardMsgType, NotifyHostQuizSummaryMsgType,
    NotifyParticipantQuizSummaryMsgType, NOTIFY_HOST_QUIZ_SUMMARY,
    NOTIFY_PARTICIPANT_QUIZ_SUMMARY, ParticipantAnswerMsgType,
    ParticipantAnswerTimeoutMsgType, PARTICIPANT_ANSWER,
    PARTICIPANT_ANSWER_TIMEOUT, ResponseHostQuestionsMsgType,
    ResponseParticipantQuestionMsgType, RESPONSE_HOST_QUESTIONS,
    RESPONSE_PARTICIPANT_QUESTION
} from "../api/protocol/messages";
import Packet from "../api/protocol/packet";
import WrappedWebsocket, { WebsocketConnectionStateType } from "../api/websocket";
import { selectClientType, setLeaderboard, setStartTime, setTotalFinishedParticipants, setWebsocketConnectionState } from "../slices/common";
import { setHostAvgAnswerTime, setHostConfig, setHostQuizSummary, setQuestions, setRequestQuestions, setHostTotalTimeElapsed } from "../slices/host";
import {
    setCurrentQuestion, setNumberOfQuestions, setParticipantAvgAnswerTime,
    setParticipantQuizSummary, setParticipantTotalTimeElapsed, setQuestionAnswer,
    setQuestionAnswerTimeout, setQuestionDuration, setRequestQuestion, setUsername
} from "../slices/participant";
import { RootState } from "../store"
import { ClientType, } from "../types";

// Actions
const WEBSOCKET_CONNECT = "WEBSOCKET_CONNECT"
export const websocketConnect = function(token: string) {
    return {
        type: WEBSOCKET_CONNECT,
        payload: {
            token,
        }
    }
}
type WebsocketConnectPayload = ReturnType<typeof websocketConnect>

const WEBSOCKET_DISCONNECT = "WEBSOCKET_DISCONNECT"
export const websocketDisconnect = function() {
    return {
        type: WEBSOCKET_DISCONNECT,
        payload: {}
    }
}

/**
 * Implementation based on the design in:
 * https://dev.to/aduranil/how-to-use-websockets-with-redux-a-step-by-step-guide-to-writing-understanding-connecting-socket-middleware-to-your-project-km3
 * @returns 
 */
function buildWebsocketMiddleware(): Middleware<{}, RootState> {

    const socket = new WrappedWebsocket(true)

    const onOpen = (store: MiddlewareAPI<Dispatch<AnyAction>, RootState>) => () => {
        console.log("middleware websocket onOpen called")
        store.dispatch(setWebsocketConnectionState(WebsocketConnectionStateType.CONNECTED))
    }

    const onClose = (store: MiddlewareAPI<Dispatch<AnyAction>, RootState>) => () => {
        console.log("middleware websocket onClose called")
        store.dispatch(setWebsocketConnectionState(WebsocketConnectionStateType.UNINITIALIZED))
    }

    const onDisconnect = (store: MiddlewareAPI<Dispatch<AnyAction>, RootState>) => () => {
        console.log("middleware websocket onClose called")
        store.dispatch(setWebsocketConnectionState(WebsocketConnectionStateType.DISCONNECTED))
    }

    const onTryReconnect = (store: MiddlewareAPI<Dispatch<AnyAction>, RootState>) => () => {
        console.log("middleware websocket onTryReconnect called")
        store.dispatch(setWebsocketConnectionState(WebsocketConnectionStateType.RECONNECTING))
    }

    const onReconnected = (store: MiddlewareAPI<Dispatch<AnyAction>, RootState>) => () => {
        console.log("middleware websocket onReconnected called")
        store.dispatch(setWebsocketConnectionState(WebsocketConnectionStateType.CONNECTED))
    }

    /**
     * Process inbound messages
     */
    const onMessage = (store: MiddlewareAPI<Dispatch<AnyAction>, RootState>) => (ev: MessageEvent<any>) => {
        console.log("Websocket message received:", ev.data)
        const packet: Packet<any> = JSON.parse(ev.data)

        let msg
        switch (packet.type) {
            case LEADERBOARD:
                msg = packet.payload as LeaderboardMsgType
                store.dispatch(setLeaderboard(msg.leaderboard))
                break
            case RESPONSE_HOST_QUESTIONS:
                msg = packet.payload as ResponseHostQuestionsMsgType
                store.dispatch(setQuestions(msg.questions))
                store.dispatch(setRequestQuestions(false))
                break
            case BROADCAST_START:
                msg = packet.payload as BroadcastStartMsgType
                store.dispatch(setStartTime(msg.startTimeEpochSecs)) // TODO: Determine if i need this
                const clientType = selectClientType(store.getState())
                switch (clientType) {
                    case ClientType.HOST:
                        store.dispatch(push("/summary")) // Navigate to /summary
                        break
                    case ClientType.PARTICIPANT:
                        store.dispatch(setQuestionDuration(msg.questionDuration))
                        store.dispatch(setNumberOfQuestions(msg.numberOfQuestions))
                        
                        // Request the first question
                        store.dispatch(setRequestQuestion({isRequesting: true, questionIndex: 0}))
                        
                        store.dispatch(push("/quiz")) // Navigate to /quiz
                        break
                    default:
                        console.warn(`Unknown participant '${clientType}' when receiving '${BROADCAST_START}'`)
                        break
                }
                break
            case RESPONSE_PARTICIPANT_QUESTION:
                msg = packet.payload as ResponseParticipantQuestionMsgType
                store.dispatch(setCurrentQuestion(msg))
                store.dispatch(setRequestQuestion({isRequesting: false}))
                break
            case NOTIFY_HOST_QUIZ_SUMMARY:
                msg = packet.payload as NotifyHostQuizSummaryMsgType
                store.dispatch(setHostQuizSummary(msg.questions))
                store.dispatch(setHostAvgAnswerTime(msg.avgAnswerTime))
                store.dispatch(setHostTotalTimeElapsed(msg.totalTimeElapsed))
                break
            case NOTIFY_PARTICIPANT_QUIZ_SUMMARY:
                msg = packet.payload as NotifyParticipantQuizSummaryMsgType
                store.dispatch(setParticipantQuizSummary(msg.questions))
                store.dispatch(setParticipantAvgAnswerTime(msg.avgAnswerTime))
                store.dispatch(setParticipantTotalTimeElapsed(msg.totalTimeElapsed))
                break
            case BROADCAST_PARTICIPANT_FINISHED:
                msg = packet.payload as BroadcastParticipantFinishedMsgType
                store.dispatch(setTotalFinishedParticipants(msg.totalFinishedParticipants))
                break
            case BROADCAST_QUIZ_FINISHED:
                store.dispatch(websocketDisconnect())
                break
            default:
                console.warn("Unknown message received: ", packet)
        }
    }

    return store => next => action => {
        let payload
        let isRequesting
        switch (action.type) {
            case WEBSOCKET_CONNECT:
                const {token} = (action as WebsocketConnectPayload).payload
                const claims = getJwtTokenClaims(token)

                // Bind our listeners before connecting
                socket.onOpen = onOpen(store)
                socket.onClose = onClose(store)
                socket.onDisconnect = onDisconnect(store)
                socket.onTryReconnect = onTryReconnect(store)
                socket.onReconnected = onReconnected(store)
                socket.onMessage = onMessage(store)

                socket.connect(claims.quizId, token)
                break
            case WEBSOCKET_DISCONNECT:
                socket.disconnect()
                break
            ////////////////////// Intercept all of these to broadcast to server before forwarding onto reducers //////////////////////
            case setUsername.type:
                const name = (action as PayloadAction<string>).payload
                socket.send(Packet.ParticipantConfig(name))
                return next(action)
            case setRequestQuestions.type:
                isRequesting = (action as PayloadAction<boolean>).payload
                if (isRequesting) {
                    // Forward the request over the websocket
                    socket.send(Packet.RequestHostQuestions())
                }
                return next(action)
            case setHostConfig.type:
                const msg = (action as PayloadAction<HostConfigMsgType>).payload
                socket.send(new Packet(HOST_CONFIG, msg))
                return next(action)
            case setRequestQuestion.type:
                payload = (action as PayloadAction<{isRequesting: boolean, questionIndex?: number}>).payload
                if (payload.isRequesting) {
                    // Forward the request over the websocket
                    socket.send(Packet.RequestParticipantQuestion(payload.questionIndex!))
                }
                return next(action)
            case setQuestionAnswer.type:
                payload = (action as PayloadAction<ParticipantAnswerMsgType>).payload
                socket.send(new Packet(PARTICIPANT_ANSWER, payload))
                return next(action)
            case setQuestionAnswerTimeout.type:
                payload = (action as PayloadAction<ParticipantAnswerTimeoutMsgType>).payload
                socket.send(new Packet(PARTICIPANT_ANSWER_TIMEOUT, payload))
                return next(action)
            default:
                console.debug("Passing the next action:", action)
                return next(action)
        }
    }
}
export const websocketMiddleware = buildWebsocketMiddleware()
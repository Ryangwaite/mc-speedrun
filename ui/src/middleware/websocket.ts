import { PayloadAction } from "@reduxjs/toolkit";
import { AnyAction, Middleware, MiddlewareAPI, Dispatch } from "redux"
import { push } from "redux-first-history";
import { getJwtTokenClaims } from "../api/auth";
import { BroadcastLeaderboardMsgType, BroadcastStartMsgType, BROADCAST_LEADERBOARD, BROADCAST_START, HostConfigMsgType, HOST_CONFIG, ParticipantConfigMsgType, PARTICIPANT_CONFIG, ResponseHostQuestionsMsgType, ResponseHostQuizSummaryMsgType, ResponseParticipantQuestionMsgType, RESPONSE_HOST_QUESTIONS, RESPONSE_HOST_QUIZ_SUMMARY, RESPONSE_PARTICIPANT_QUESTION } from "../api/protocol/messages";
import Packet from "../api/protocol/packet";
import WrappedWebsocket from "../api/websocket";
import { selectClientType, setLeaderboard } from "../slices/common";
import { setHostConfig, setQuestions, setRequestQuestions } from "../slices/host";
import { setCurrentQuestion, setNumberOfQuestions, setQuestionDuration, setRequestQuestion, setUsername } from "../slices/participant";
import { RootState } from "../store"
import { ClientType } from "../types";

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

    const socket = new WrappedWebsocket()

    const onOpen = (store: MiddlewareAPI<Dispatch<AnyAction>, RootState>) => (ev: Event) => {
        console.log("Websocket connected")
    }

    const onClose = (store: MiddlewareAPI<Dispatch<AnyAction>, RootState>) => (ev: CloseEvent) => {
        console.log("Websocket disconnected")
    }

    /**
     * Process inbound messages
     */
    const onMessage = (store: MiddlewareAPI<Dispatch<AnyAction>, RootState>) => (ev: MessageEvent<any>) => {
        console.log("Websocket message received:", ev.data)
        const packet: Packet<any> = JSON.parse(ev.data)

        let msg
        switch (packet.type) {
            case BROADCAST_LEADERBOARD:
                msg = packet.payload as BroadcastLeaderboardMsgType
                store.dispatch(setLeaderboard(msg.leaderboard))
                break
            case RESPONSE_HOST_QUESTIONS:
                msg = packet.payload as ResponseHostQuestionsMsgType
                store.dispatch(setQuestions(msg.questions))
                store.dispatch(setRequestQuestions(false))
                break
            case BROADCAST_START:
                msg = packet.payload as BroadcastStartMsgType
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
            default:
                console.debug("Passing the next action:", action)
                return next(action)
        }
    }
}
export const websocketMiddleware = buildWebsocketMiddleware()
import { PayloadAction } from "@reduxjs/toolkit";
import { AnyAction, Middleware, MiddlewareAPI, Dispatch } from "redux"
import { getJwtTokenClaims } from "../api/auth";
import { BroadcastLeaderboardMsgType, BROADCAST_LEADERBOARD, HostConfigMsgType, HOST_CONFIG, ParticipantConfigMsgType, PARTICIPANT_CONFIG, ResponseHostQuestionsMsgType, ResponseHostQuizSummaryMsgType, RESPONSE_HOST_QUESTIONS, RESPONSE_HOST_QUIZ_SUMMARY } from "../api/protocol/messages";
import Packet from "../api/protocol/packet";
import WrappedWebsocket from "../api/websocket";
import { setLeaderboard } from "../slices/common";
import { setHostConfig, setQuestions, setRequestQuestions, setTotalTimeElapsed } from "../slices/host";
import { setUsername } from "../slices/participant";
import { RootState } from "../store"

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
            default:
                console.warn("Unknown message received: ", packet)
        }
    }

    return store => next => action => {
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
                const isRequesting = (action as PayloadAction<boolean>).payload
                if (isRequesting) {
                    // Forward the request over the websocket
                    socket.send(Packet.RequestHostQuestions())
                }
                return next(action)
            case setHostConfig.type:
                const msg = (action as PayloadAction<HostConfigMsgType>).payload
                socket.send(new Packet(HOST_CONFIG, msg))
                return next(action)
            default:
                console.debug("Passing the next action:", action)
                return next(action)
        }
    }
}
export const websocketMiddleware = buildWebsocketMiddleware()
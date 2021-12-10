import { PayloadAction } from "@reduxjs/toolkit";
import jwtDecode from "jwt-decode";
import { AnyAction, Middleware, MiddlewareAPI, Dispatch } from "redux"
import { BroadcastLeaderboardMsgType, BROADCAST_LEADERBOARD, ParticipantConfigMsgType, PARTICIPANT_CONFIG } from "../api/protocol/messages";
import Packet from "../api/protocol/packet";
import WrappedWebsocket from "../api/websocket";
import { setLeaderboard } from "../slices/common";
import { setUsername } from "../slices/participant";
import { RootState } from "../store"

interface IJwtData {
    aud: string,
    exp: number,
    isHost: boolean,
    iss: string,
    quizId: string,
}

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

        switch (packet.type) {
            case BROADCAST_LEADERBOARD:
                const msg = packet.payload as BroadcastLeaderboardMsgType
                store.dispatch(setLeaderboard(msg.leaderboard))
                break
            default:
                console.warn("Unknown message received: ", packet)
        }
    }

    return store => next => action => {
        switch (action.type) {
            case WEBSOCKET_CONNECT:
                const {token} = (action as WebsocketConnectPayload).payload
                const claims = jwtDecode(token) as IJwtData

                // Bind our listeners before connecting
                socket.onOpen = onOpen(store)
                socket.onClose = onClose(store)
                socket.onMessage = onMessage(store)

                socket.connect(claims.quizId, token)
                break
            case WEBSOCKET_DISCONNECT:
                socket.disconnect()
                break
            // Intercept all of these to broadcast to server before forwarding onto reducers
            case setUsername.type:
                const name = (action as PayloadAction<string>).payload
                socket.send(Packet.ParticipantConfig(name))
                return next(action)
            default:
                console.debug("Passing the next action:", action)
                return next(action)
        }
    }
}
export const websocketMiddleware = buildWebsocketMiddleware()
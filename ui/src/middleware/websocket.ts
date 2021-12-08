import { AnyAction, Middleware, MiddlewareAPI, Dispatch } from "redux"
import WrappedWebsocket from "../api/websocket";
import { RootState } from "../store"

// Actions
const WEBSOCKET_CONNECT = "WEBSOCKET_CONNECT"
export const websocketConnect = function(quizId: string, token: string) {
    return {
        type: WEBSOCKET_CONNECT,
        payload: {
            quizId,
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
        const payload = JSON.parse(ev.data)

        switch (payload.type) {
            default:
                console.warn("Unknown message received: ", payload)
        }
    }

    return store => next => action => {
        switch (action.type) {
            case WEBSOCKET_CONNECT:
                let {quizId, token} = (action as WebsocketConnectPayload).payload

                // Bind our listeners before connecting
                socket.onOpen = onOpen(store)
                socket.onClose = onClose(store)
                socket.onMessage = onMessage(store)

                socket.connect(quizId, token)
                break
            case WEBSOCKET_DISCONNECT:
                socket.disconnect()
                break
            // case WEBSOCKET_SEND:
                // todo...
            default:
                console.debug("Passing the next action:", action)
                return next(action)
        }
    }
}
export const websocketMiddleware = buildWebsocketMiddleware()
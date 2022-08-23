import Packet from "./protocol/packet"

export enum WebsocketConnectionStateType {
    UNINITIALIZED,
    CONNECTING,
    CONNECTED,
    DISCONNECTED,
    RECONNECTING,
}

/**
 * Gets the base URL from the environment for contacting the speed-run service
 * CORs will need to be enabled on this service so that the request succeeds.
 * @returns 
 */
 export function getSpeedRunBaseUrl(): string {
    return process.env.REACT_APP__SPEED_RUN_URL ? process.env.REACT_APP__SPEED_RUN_URL : ""
}

export default class WrappedWebsocket {

    private static DISCONNECT_CODE = 1000 // = Normal Closure
    private static DISCONNECT_REASON = "Quiz complete"

    private shouldReconnect: boolean
    private reconnectIntervalHandler?: NodeJS.Timeout
    private socket?: WebSocket
    private quizId?: string
    private token?: string

    // Track reconnection state
    private isReconnecting: boolean = false

    onOpen?: () => void
    onMessage?: (e: MessageEvent<any>) => void
    onClose?: () => void
    onDisconnect?: () => void
    onTryReconnect?: () => void
    onReconnected?: () => void

    constructor(reconnect: boolean) {
        this.shouldReconnect = reconnect
    }

    connect = (quizId: string, token: string) => {

        this.quizId = quizId
        this.token = token

        let origin = getSpeedRunBaseUrl()
        if (!origin) origin = `wss://${window.location.host}`
        const url = `${origin}/api/speed-run/${quizId}/ws?token=${token}`

        this.socket = new WebSocket(url)
        this.socket.onerror = (evt) => {
            console.log(`Websocket onerror fired with event: ${evt}`)
        }
        
        // Bind the listeners
        this.socket.onopen = this.onOpenHandler
        this.socket.onclose = this.onCloseHandler
        if (this.onMessage) this.socket.onmessage = this.onMessage
    }

    disconnect = () => {
        this.socket?.close(WrappedWebsocket.DISCONNECT_CODE, WrappedWebsocket.DISCONNECT_REASON)
    }

    send = (packet: Packet<{}>) => {
        const serializedPacket = JSON.stringify(packet)
        this.socket?.send(serializedPacket)
    }

    private onOpenHandler = (e: Event) => {

        console.log("onOpenHandler called")

        if (this.isReconnecting) {
            if (this.onReconnected) this.onReconnected()
            this.isReconnecting = false
        } else {
            // Initial connection
            if (this.onOpen) this.onOpen()
        }
    }

    private onCloseHandler = (e: CloseEvent) => {

        console.log("onCloseHandler called")

        if (e.code === WrappedWebsocket.DISCONNECT_CODE && e.reason === WrappedWebsocket.DISCONNECT_REASON) {
            // Closed by us on the frontend - don't restart
            if (this.onClose) this.onClose()
            return
        }

        // Invoke users sibscribed disconnect handler
        if (this.onDisconnect) this.onDisconnect()

        this.isReconnecting = true
        if (this.onTryReconnect) this.onTryReconnect()

        // Closed by something else (probably backend) - reconnect
        this.reconnectIntervalHandler = setTimeout(() => {
            this.connect(this.quizId!, this.token!)
        }, 3000) // 1 second delay
    }
}
import Packet from "./protocol/packet"

/**
 * Gets the base URL from the environment for contacting the speed-run service
 * CORs will need to be enabled on this service so that the request succeeds.
 * @returns 
 */
 function getSpeedRunBaseUrl(): string {
    return process.env.REACT_APP__SPEED_RUN_URL ? process.env.REACT_APP__SPEED_RUN_URL : ""
}

export default class WrappedWebsocket {

    private socket?: WebSocket

    onOpen?: (e: Event) => void
    onMessage?: (e: MessageEvent<any>) => void
    onClose?: (e: CloseEvent) => void

    connect(quizId: string, token: string) {
        const url = `${getSpeedRunBaseUrl()}/speed-run/${quizId}/ws?token=${token}`

        if (this.socket) {
            this.disconnect()
        }

        this.socket = new WebSocket(url)
        
        // Bind the listeners
        if (this.onOpen) this.socket.onopen = this.onOpen
        if (this.onMessage) this.socket.onmessage = this.onMessage
        if (this.onClose) this.socket.onclose = this.onClose
    }

    disconnect(...args: any[]) {
        this.socket?.close(...args)
    }

    send(packet: Packet<{}>) {
        const serializedPacket = JSON.stringify(packet)
        this.socket?.send(serializedPacket)
    }
}
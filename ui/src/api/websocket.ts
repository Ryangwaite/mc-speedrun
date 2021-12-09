import { getSpeedRunBaseUrl } from "../const"
import Packet from "./protocol/packet"

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
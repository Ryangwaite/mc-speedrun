import '@testing-library/jest-dom'
import { render, screen, } from "@testing-library/react"
import { WebsocketConnectionStateType } from '../../api/websocket'
import { APP_NAME } from '../../const'
import { TopBar } from './AppBar'

it("has logo, app name and connection indicator", () => {
    render(
        <TopBar
            connectionState={WebsocketConnectionStateType.CONNECTED}
        />
    )

    expect(screen.getByTitle("logo")).toBeInTheDocument()
    expect(screen.getByText(APP_NAME)).toBeInTheDocument()
    expect(screen.getByRole("status")).toBeInTheDocument()
})
import '@testing-library/jest-dom'
import { fireEvent, render, screen, waitFor, } from "@testing-library/react"
import { WebsocketConnectionStateType } from '../../api/websocket'
import { ConnectionIndicator } from './ConnectionIndicator'
import { useMediaQuery } from "@mui/material";

/**
 * Mock out just useMediaQuery and leave rest intact
 */
jest.mock("@mui/material", () => ({
    ...jest.requireActual("@mui/material"),
    useMediaQuery: jest.fn(),
}))

it.each([
    [WebsocketConnectionStateType.CONNECTING, "Connecting..."],
    [WebsocketConnectionStateType.CONNECTED, "Connected"],
    [WebsocketConnectionStateType.DISCONNECTED, "Disconnected"],
    [WebsocketConnectionStateType.RECONNECTING, "Reconnecting..."],
])("shows connection label when screen is larger than small",
        async (connectionState: WebsocketConnectionStateType, connectionText: string) => {
    
    // Mock the following so that isSmallAndUp is true
    (useMediaQuery as jest.Mock).mockImplementation(() => true)

    render(
        <ConnectionIndicator
            connectionState={connectionState}
        />
    )
    
    // Wait for it to transition in
    await waitFor(() => expect(screen.getByRole("status")).toBeVisible())

    expect(screen.getByText(new RegExp(connectionText))).toBeInTheDocument()
})

it.each([
    [WebsocketConnectionStateType.CONNECTING, "Connecting..."],
    [WebsocketConnectionStateType.CONNECTED, "Connected"],
    [WebsocketConnectionStateType.DISCONNECTED, "Disconnected"],
    [WebsocketConnectionStateType.RECONNECTING, "Reconnecting..."],
])("shows tooltip containing connection state label when screen is small",
        async (connectionState: WebsocketConnectionStateType, connectionText: string) => {
    
    // Mock the following so that isSmallAndUp is false
    (useMediaQuery as jest.Mock).mockImplementation(() => false)

    render(
        <ConnectionIndicator
            connectionState={connectionState}
        />
    )

    fireEvent.mouseOver(screen.getByTitle("status indicator"))
    await waitFor(() => expect(screen.getByRole("tooltip")).toBeVisible())
    expect(screen.getByRole("tooltip")).toHaveTextContent(connectionText)
})
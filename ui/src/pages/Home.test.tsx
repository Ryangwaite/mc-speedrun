import '@testing-library/jest-dom'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../App'
import { render } from '../../test/test-utils'
import WS from 'jest-websocket-mock'

it("participant can join with access code and navigates to /lobby", async () => {
    render(<App />)
    const accessCode = "19486df9"

    const myWs = new WS(`ws://localhost/speed-run/${accessCode}/ws`);

    const accessCodeField = screen.getByLabelText("Access Code")
    userEvent.type(accessCodeField, `${accessCode}{enter}`)

    await myWs.connected

    await waitFor(() => screen.getByText(/waiting for host to start/i))

    // Check that we navigated to lobby
    expect(window.location.pathname).toEqual('/lobby')

})

it("host navigates to /config on 'join' button clicked", async () => {
    render(<App />)

    const beginButton = screen.getByRole("button", {name: /Begin/})
    userEvent.click(beginButton)

    await waitFor(() => screen.getByText(/participants/i))

    // Check that we navigated to config
    expect(window.location.pathname).toEqual('/config')
})
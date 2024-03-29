import '@testing-library/jest-dom'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../App'
import { QUIZ_ID, render } from '../../test/test-utils'
import { wsServer } from '../setupTests'

it("participant can join with access code and navigates to /lobby", async () => {
    render(<App />)
    const accessCode = QUIZ_ID
    const accessCodeField = screen.getByLabelText("Access Code")
    userEvent.type(accessCodeField, `${accessCode}{enter}`)

    await wsServer.connected

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
import '@testing-library/jest-dom'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import QuizAccessCode from './QuizAccessCode'

const accessCode = "d4254218"

it("displays access code", () => {
    render(
        <QuizAccessCode
            accessCode={accessCode}
            showMenu={false}
            menuBadge={"4"}
            menuClicked={jest.fn()}
        />
    )

    const element = screen.getByDisplayValue(accessCode)
    expect(element).toBeInTheDocument()
})

it("copies access code to clipboard when copy icon clicked and show toast", async () => {
    render(
        <QuizAccessCode
            accessCode={accessCode}
            showMenu={false}
            menuBadge={"4"}
            menuClicked={jest.fn()}
        />
    )

    // Mock out the copy method
    Object.assign(window.navigator, {
        clipboard: {
            writeText: jest.fn().mockImplementation(() => Promise.resolve()),
        }
    })

    const button = screen.getByTestId("ContentCopyIcon")
    fireEvent.click(button)
    expect(window.navigator.clipboard.writeText).toHaveBeenCalledWith(accessCode)
    // Check that the toast appears
    expect(await waitFor(() => screen.getByText(/Access code/))).toBeVisible()
})

it("displays menu with badge when showMenu is true", () => {
    const menuBadge = "54"

    render(
        <QuizAccessCode
            accessCode={accessCode}
            showMenu={true}
            menuBadge={menuBadge}
            menuClicked={jest.fn()}
        />
    )

    expect(screen.getByText(menuBadge)).toBeInTheDocument()
})

it("fires menuClicked when showMenu is true and clicked", () => {
    const menuListener = jest.fn()
    render(
        <QuizAccessCode
            accessCode={accessCode}
            showMenu={true}
            menuBadge={"5"}
            menuClicked={menuListener}
        />
    )

    fireEvent.click(screen.getByTestId("MenuIcon"))
    expect(menuListener).toBeCalledTimes(1)
})
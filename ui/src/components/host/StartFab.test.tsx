import '@testing-library/jest-dom'
import { fireEvent, render, screen } from '@testing-library/react'
import StartFab from './StartFab'

it("fires onStartClicked when enabled", () => {
    const handler = jest.fn()
    render(
        <StartFab
            enabled={true}
            onStartClicked={handler}
        />
    )

    const button = screen.getByText("Start")
    fireEvent.click(button)
    expect(handler).toHaveBeenCalledTimes(1)
})

it("doesn't fire onStartClicked when disabled", () => {
    const handler = jest.fn()
    render(
        <StartFab
            enabled={false}
            onStartClicked={handler}
        />
    )

    const button = screen.getByText("Start")
    fireEvent.click(button)
    expect(handler).toHaveBeenCalledTimes(0)
})

import '@testing-library/jest-dom'
import { fireEvent, render, screen } from "@testing-library/react"
import ProgressBlock from './ProgressBlock'

it("shows number completed when current progress does not equal total", () => {
    const progressCurrent = 43
    const progressTotal = 141

    render(
        <ProgressBlock
            progressCurrent={progressCurrent}
            progressTotal={progressTotal}
            onReturnToHomeClicked={jest.fn()}
        />
    )
    
    expect(screen.getByText(`${progressCurrent}/${progressTotal} finished`)).toBeInTheDocument()
    expect(screen.queryByRole("button")).not.toBeInTheDocument()
})

it("shows complete button when current progress equals total", () => {
    const progress = 100

    render(
        <ProgressBlock
            progressCurrent={progress}
            progressTotal={progress}
            onReturnToHomeClicked={jest.fn()}
        />
    )

    expect(screen.queryByText(/finished/)).not.toBeInTheDocument()
    expect(screen.queryByRole("button")).toBeInTheDocument()
})

it("fires onReturnToHomeClicked on button clicked", () => {
    const progress = 100
    const handler = jest.fn()
    render(
        <ProgressBlock
            progressCurrent={progress}
            progressTotal={progress}
            onReturnToHomeClicked={handler}
        />
    )

    const button = screen.getByRole("button")
    expect(button).toHaveTextContent("RETURN TO HOME")

    fireEvent.click(button)
    expect(handler).toBeCalledTimes(1)
})
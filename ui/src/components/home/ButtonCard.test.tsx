import '@testing-library/jest-dom'
import { fireEvent, render, screen, } from "@testing-library/react"
import ButtonCard from './ButtonCard'

it("shows title and button label", () => {
    const title = "title"
    const buttonLabel = "label"

    render(
        <ButtonCard
            title={title}
            buttonLabel={buttonLabel}
            onSubmit={jest.fn()}
        />
    )

    expect(screen.getByText(title)).toBeInTheDocument()
    expect(screen.getByRole("button")).toBeInTheDocument()
})

it("fires onSubmit on button click", () => {
    const handler = jest.fn()
    render(
        <ButtonCard
            title={"title"}
            buttonLabel={"label"}
            onSubmit={handler}
        />
    )
    fireEvent.click(screen.getByRole("button"))
    expect(handler).toHaveBeenCalledTimes(1)
})

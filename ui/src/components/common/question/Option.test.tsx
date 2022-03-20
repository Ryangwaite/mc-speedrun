import '@testing-library/jest-dom'
import { fireEvent, render, screen, } from "@testing-library/react"
import Option, { OptionMode } from './Option'

it("renders correctly when mode is PLAIN", () => {
    const onClick = jest.fn()
    render(
        <Option
            text={"plain label"}
            choiceLabel={"b)"}
            mode={OptionMode.PLAIN}
            onClick={onClick}
        />
    )

    expect(screen.getByText(/plain label/)).toBeInTheDocument()
    expect(screen.getByText(/b\)/)).toBeInTheDocument()

    fireEvent.click(screen.getByRole("option"))
    expect(onClick).toHaveBeenCalledTimes(1)
})

it("renders correctly when mode is SELECTED_UNMARKED", () => {
    const onClick = jest.fn()
    render(
        <Option
            text={"label"}
            choiceLabel={"b)"}
            mode={OptionMode.SELECTED_UNMARKED}
            onClick={onClick}
        />
    )

    expect(screen.getByText(/label/)).toBeInTheDocument()
    expect(screen.getByText(/b\)/)).toBeInTheDocument()

    fireEvent.click(screen.getByRole("option"))
    expect(onClick).toHaveBeenCalledTimes(1)
})

it("renders correctly when mode is SELECTED_AND_MARKED_CORRECT", () => {
    const onClick = jest.fn()
    render(
        <Option
            text={"label"}
            choiceLabel={"b)"}
            mode={OptionMode.SELECTED_AND_MARKED_CORRECT}
            onClick={onClick}
        />
    )

    expect(screen.getByText(/label/)).toBeInTheDocument()
    expect(screen.getByText(/b\)/)).toBeInTheDocument()
    expect(screen.getByTitle("check circle outline")).toBeInTheDocument()

    fireEvent.click(screen.getByRole("option"))
    expect(onClick).toHaveBeenCalledTimes(0)
})

it("renders correctly when mode is SELECTED_AND_MARKED_INCORRECT", () => {
    const onClick = jest.fn()
    render(
        <Option
            text={"label"}
            choiceLabel={"b)"}
            mode={OptionMode.SELECTED_AND_MARKED_INCORRECT}
            onClick={onClick}
        />
    )

    expect(screen.getByText(/label/)).toBeInTheDocument()
    expect(screen.getByText(/b\)/)).toBeInTheDocument()
    expect(screen.getByTitle("cancel outline")).toBeInTheDocument()

    fireEvent.click(screen.getByRole("option"))
    expect(onClick).toHaveBeenCalledTimes(0)
})

it("renders correctly when mode is UNSELECTED_AND_MARKED_CORRECT", () => {
    const onClick = jest.fn()
    render(
        <Option
            text={"label"}
            choiceLabel={"b)"}
            mode={OptionMode.UNSELECTED_AND_MARKED_CORRECT}
            onClick={onClick}
        />
    )

    expect(screen.getByText(/label/)).toBeInTheDocument()
    expect(screen.getByText(/b\)/)).toBeInTheDocument()
    expect(screen.getByTitle("circle outline")).toBeInTheDocument()

    fireEvent.click(screen.getByRole("option"))
    expect(onClick).toHaveBeenCalledTimes(0)
})
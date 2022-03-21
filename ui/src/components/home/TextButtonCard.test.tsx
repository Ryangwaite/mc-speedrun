import '@testing-library/jest-dom'
import { fireEvent, render, screen, } from "@testing-library/react"
import userEvent from '@testing-library/user-event'
import TextButtonCard from './TextButtonCard'

it("shows title, form label and button label", () => {
    const title = "title"
    const label = "label"
    const buttonLabel = "button label"

    render(
        <TextButtonCard
            title={title}
            label={label}
            buttonLabel={buttonLabel}
            onSubmit={jest.fn()}
        />
    )

    expect(screen.getByText(title)).toBeInTheDocument()
    expect(screen.getByLabelText(label)).toBeInTheDocument()
    expect(screen.getByRole("button")).toHaveTextContent(buttonLabel)
})

it("renders text when typing into field", () => {
    const label = "label"
    render(
        <TextButtonCard
            title={"title"}
            label={"label"}
            buttonLabel={"button label"}
            onSubmit={jest.fn()}
        />
    )

    const inputText = "inputted text"
    const inputField = screen.getByLabelText(label) as HTMLInputElement
    fireEvent.change(inputField, {target: {value: inputText}})

    expect(inputField.value).toBe(inputText)
})

it("runs onSubmit when button is clicked and content is not empty", () => {
    const label = "label"
    const onSubmit = jest.fn()
    render(
        <TextButtonCard
            title={"title"}
            label={label}
            buttonLabel={"button label"}
            onSubmit={onSubmit}
        />
    )

    const button = screen.getByRole("button")

    // Click button which won't fire onSubmit
    fireEvent.click(button)

    // Enter text to enable button and click it
    const inputContent = "not empty"
    fireEvent.input(screen.getByLabelText(label), {target: {value: inputContent}})
    fireEvent.click(button)

    expect(onSubmit).toBeCalledTimes(1)
    expect(onSubmit).toHaveBeenCalledWith(inputContent)
})

it("runs onSubmit when 'enter' is pressed and content is not empty", () => {
    const label = "label"
    const onSubmit = jest.fn()
    render(
        <TextButtonCard
            title={"title"}
            label={label}
            buttonLabel={"button label"}
            onSubmit={onSubmit}
        />
    )

    const inputField = screen.getByLabelText(label)

    // Press enter with no other content will not fire onSubmit
    userEvent.type(inputField, "{enter}")

    // Enter text to enable button and click it
    const inputContent = "not empty"
    fireEvent.input(inputField, {target: {value: inputContent}})
    userEvent.type(inputField, "{enter}")

    expect(onSubmit).toBeCalledTimes(1)
    expect(onSubmit).toHaveBeenCalledWith(inputContent)
})
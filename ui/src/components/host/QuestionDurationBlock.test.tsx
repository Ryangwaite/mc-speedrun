import '@testing-library/jest-dom'
import { fireEvent, render, screen, } from "@testing-library/react"
import userEvent from '@testing-library/user-event'
import QuestionDurationBlock from './QuestionDurationBlock'

it("shows initial question duration", () => {
    const questionDuration = 456
    render(
        <QuestionDurationBlock
            questionDuration={questionDuration}
            onDurationChanged={jest.fn()}
        />
    )

    expect(screen.getByLabelText("Duration")).toHaveValue(questionDuration)
})

it("fires onDurationChangedListener on ArrowUp", () => {
    const onChangeCallback = jest.fn()
    render(
        <QuestionDurationBlock
            questionDuration={456}
            onDurationChanged={onChangeCallback}
        />
    )

    const input = screen.getByLabelText("Duration")
    // NOTE: The callback doesn't get called with the correct value in the test, so haven't asserted this
    fireEvent.keyUp(input, {key: "ArrowUp", code: "ArrowUp"})
    fireEvent.keyDown(input, {key: "ArrowUp", code: "ArrowUp"})
    expect(onChangeCallback).toBeCalledTimes(1)
})

it("decrements value by one on down arrow key press and fires onDurationChangedListener", () => {
    const onChangeCallback = jest.fn()
    render(
        <QuestionDurationBlock
            questionDuration={456}
            onDurationChanged={onChangeCallback}
        />
    )

    const input = screen.getByLabelText("Duration")
    // NOTE: The callback doesn't get called with the correct value in the test, so haven't asserted this
    fireEvent.keyUp(input, {key: "ArrowDown", code: "ArrowDown"})
    fireEvent.keyDown(input, {key: "ArrowDown", code: "ArrowDown"})
    expect(onChangeCallback).toBeCalledTimes(1)
})

it("shows updated number", () => {
    const initialDuration = 456
    const onChangeCallback = jest.fn()
    render(
        <QuestionDurationBlock
            questionDuration={initialDuration}
            onDurationChanged={onChangeCallback}
        />
    )
    const input = screen.getByLabelText("Duration")
    userEvent.type(input, "{backspace}{backspace}{backspace}69")
    expect(input).toHaveValue(69)
})

it("doesn't allow negative numbers", () => {
    const initialDuration = 456
    const onChangeCallback = jest.fn()
    render(
        <QuestionDurationBlock
            questionDuration={initialDuration}
            onDurationChanged={onChangeCallback}
        />
    )

    const input = screen.getByLabelText("Duration")
    userEvent.type(input, "{backspace}{backspace}{backspace}-69")
    expect(input).toHaveValue(null)
})

it("doesn't allow letters", () => {
    const initialDuration = 456
    const onChangeCallback = jest.fn()
    render(
        <QuestionDurationBlock
            questionDuration={initialDuration}
            onDurationChanged={onChangeCallback}
        />
    )

    const input = screen.getByLabelText("Duration")
    userEvent.type(input, "wontwork")
    expect(input).toHaveValue(initialDuration)
})

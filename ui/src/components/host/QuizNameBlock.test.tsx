import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import QuizNameBlock from './QuizNameBlock'

it("displays quiz name", () => {
    const quizName = "name of quiz"

    render(
        <QuizNameBlock
            quizName={quizName}
            onQuizNameChange={jest.fn()}
        />
    )
    expect(screen.getByDisplayValue(quizName)).toBeInTheDocument()
})

it("fires onQuizNameChange when it changes", () => {
    let initialQuizName = "name of quiz"
    const onChange = jest.fn()

    render(
        <QuizNameBlock
            quizName={initialQuizName}
            onQuizNameChange={onChange}
        />
    )
    const element = screen.getByDisplayValue(new RegExp(initialQuizName))
    userEvent.type(element, "!")
    expect(onChange).toHaveBeenCalledWith(initialQuizName + "!")
})
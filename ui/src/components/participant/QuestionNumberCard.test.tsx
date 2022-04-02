import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import QuestionNumberCard from './QuestionNumberCard'

it("shows question number and total number of questions", () => {
    const questionNumber = 5
    const totalQuestions = 8
    render(
        <QuestionNumberCard
            questionNumber={questionNumber}
            totalQuestions={totalQuestions}
        />
    )
    expect(screen.getByText(new RegExp(questionNumber.toString()))).toBeInTheDocument()
    expect(screen.getByText(new RegExp(totalQuestions.toString()))).toBeInTheDocument()
})
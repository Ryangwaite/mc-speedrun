import '@testing-library/jest-dom'
import { render, screen } from "@testing-library/react"
import { IQuestionAnswerStats } from '../../../const'
import { OptionMode } from './Option'
import { QuestionCardVariant } from './QuestionCard'
import QuestionCardWithStats from './QuestionCardWithStats'

it("shows question, number of correct options, options and answer stats", () => {
    const question = "Does this test work?"
    const numCorrectOptions = 2
    const options = [
        {text: "definitely", mode: OptionMode.PLAIN,},
        {text: "nup", mode: OptionMode.PLAIN,},
        {text: "yes", mode: OptionMode.PLAIN,},
        {text: "no way", mode: OptionMode.PLAIN,},
    ]
    const answerStats: IQuestionAnswerStats = {
        correctAnswerers: ["user1", "user2"],
        incorrectAnswerers: ["user3", "user4", "user5"],
        timeExpiredAnswerers: ["user6"],
    }
    render(
        <QuestionCardWithStats
            variant={QuestionCardVariant.COLUMN}
            question={question}
            numCorrectOptions={numCorrectOptions}
            options={options}
            answerStats={answerStats}
        />
    )

    expect(screen.getByText(question)).toBeInTheDocument()
    expect(screen.getByText(`Select ${numCorrectOptions}`)).toBeInTheDocument()
    options.forEach(x => expect(screen.getByText(new RegExp(x.text))).toBeInTheDocument())
    expect(screen.getByTestId("stats-panel")).toBeInTheDocument()
})
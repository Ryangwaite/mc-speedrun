import '@testing-library/jest-dom'
import { fireEvent, render, screen, } from "@testing-library/react"
import { OptionMode } from './Option'
import QuestionCard, { QuestionCardVariant } from './QuestionCard'

it("shows questions, number of correct options and options", () => {
    const question = "Does this test work?"
    const numCorrectOptions = 2
    const options = [
        {text: "definitely", mode: OptionMode.PLAIN,},
        {text: "nup", mode: OptionMode.PLAIN,},
        {text: "yes", mode: OptionMode.PLAIN,},
        {text: "no way", mode: OptionMode.PLAIN,},
    ]
    render(
        <QuestionCard
            variant={QuestionCardVariant.BOX}
            question={question}
            numCorrectOptions={numCorrectOptions}
            options={options}
            onOptionClicked={jest.fn()}
        />
    )

    expect(screen.getByText(question)).toBeInTheDocument()
    expect(screen.getByText(`Select ${numCorrectOptions}`)).toBeInTheDocument()
    options.forEach(x => expect(screen.getByText(new RegExp(x.text))).toBeInTheDocument())
})

it("fires click listener with option index", () => {
    const options = [
        {text: "definitely", mode: OptionMode.PLAIN,},
        {text: "nup", mode: OptionMode.PLAIN,},
        {text: "yes", mode: OptionMode.PLAIN,},
        {text: "no way", mode: OptionMode.PLAIN,},
    ]

    const onOptionClicked = jest.fn()

    render(
        <QuestionCard
            variant={QuestionCardVariant.BOX}
            question={"Does this test work?"}
            numCorrectOptions={2}
            options={options}
            onOptionClicked={onOptionClicked}
        />
    )

    const optionElements = screen.getAllByRole("option")
    expect(optionElements.length).toBe(4)

    optionElements.forEach(x => fireEvent.click(x))
    expect(onOptionClicked).nthCalledWith(1, 0)
    expect(onOptionClicked).nthCalledWith(2, 1)
    expect(onOptionClicked).nthCalledWith(3, 2)
    expect(onOptionClicked).nthCalledWith(4, 3)
})
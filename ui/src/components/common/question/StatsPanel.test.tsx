import '@testing-library/jest-dom'
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { IQuestionAnswerStats } from '../../../const'
import QuestionStatsPanel, { QuestionStatsVariant } from './StatsPanel'

const answerStats: IQuestionAnswerStats = {
    correctAnswerers: ["user1"],
    incorrectAnswerers: ["user2", "user3"],
    timeExpiredAnswerers: ["user4", "user5", "user6"]
}

it("shows correct, incorrect and time expired totals", () => {
    render(
        <QuestionStatsPanel
            variant={QuestionStatsVariant.HORIZONTAL}
            answerStats={answerStats}
        />
    )

    const listItems = screen.getAllByRole("listitem")
    expect(listItems.length).toBe(3)

    expect(listItems[0]).toHaveTextContent(answerStats.correctAnswerers.length.toString())
    expect(listItems[0]).toContainElement(screen.getByTitle("check"))
    expect(listItems[1]).toHaveTextContent(answerStats.incorrectAnswerers.length.toString())
    expect(listItems[1]).toContainElement(screen.getByTitle("cancel"))
    expect(listItems[2]).toHaveTextContent(answerStats.timeExpiredAnswerers.length.toString())
    expect(listItems[2]).toContainElement(screen.getByTitle("timeout"))
})

it("shows list of names on hover", async () => {
    render(
        <QuestionStatsPanel
            variant={QuestionStatsVariant.HORIZONTAL}
            answerStats={answerStats}
        />
    )

    const listItems = screen.getAllByRole("listitem")
    expect(listItems.length).toBe(3)

    // NOTE: In the following assertions, the mui tooltip adds the elements to
    //       the DOM on first mouseover, then on mouseout it leaves it in the
    //       DOM but makes it invisible.

    // Check that correct answerers names are listed in tooltip
    fireEvent.mouseOver(listItems[0])
    await waitFor(() => screen.getByText(/Correctly answered by/))
    answerStats.correctAnswerers.forEach(x => expect(screen.getByText(x)).toBeVisible())
    answerStats.incorrectAnswerers.forEach(x => expect(screen.queryByText(x)).not.toBeInTheDocument())
    answerStats.timeExpiredAnswerers.forEach(x => expect(screen.queryByText(x)).not.toBeInTheDocument())
    fireEvent.mouseOut(listItems[0])

    // Check that the incorrect answerers names are listed in the tooltip
    fireEvent.mouseOver(listItems[1])
    await waitFor(() => screen.getByText(/Incorrectly answered by/))
    answerStats.correctAnswerers.forEach(x => expect(screen.queryByText(x)).not.toBeVisible())
    answerStats.incorrectAnswerers.forEach(x => expect(screen.getByText(x)).toBeVisible())
    answerStats.timeExpiredAnswerers.forEach(x => expect(screen.queryByText(x)).not.toBeInTheDocument())
    fireEvent.mouseOut(listItems[1])

    // Check that the time expired answerers names are listed in the tooltip
    fireEvent.mouseOver(listItems[2])
    await waitFor(() => screen.getByText(/Time expired for/))
    answerStats.correctAnswerers.forEach(x => expect(screen.queryByText(x)).not.toBeVisible())
    answerStats.incorrectAnswerers.forEach(x => expect(screen.getByText(x)).not.toBeVisible())
    answerStats.timeExpiredAnswerers.forEach(x => expect(screen.queryByText(x)).toBeVisible())
})
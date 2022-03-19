import '@testing-library/jest-dom'
import { render } from "@testing-library/react"
import LeaderBoardItemScore from "./LeaderboardItemScore"


it("should display score", () => {
    const {getByText} = render(<LeaderBoardItemScore
        score={1234}
    />)

    expect(getByText("1234")).toBeVisible()
})

import '@testing-library/jest-dom'
import { render, } from "@testing-library/react"
import {LeaderBoardItem, ILeaderBoardItemProps} from "./LeaderboardItem"

const testProps: ILeaderBoardItemProps = {
    item: {userId: "userid", name: "alfred", score: 56},
    position: 22,
    selected: false,
}

it("displays name, score and position", () => {
    const {getByText} = render(<LeaderBoardItem
        {...testProps}
    />)

    expect(getByText("alfred")).toBeVisible()
    expect(getByText("56")).toBeVisible()
    expect(getByText("22nd")).toBeVisible()
})
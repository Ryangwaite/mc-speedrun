import '@testing-library/jest-dom'
import { render, screen, } from "@testing-library/react"
import _ from 'lodash'
import { ILeaderboardItem } from '../../../types'
import { LeaderBoard } from './Leaderboard'

const sortedItems: ILeaderboardItem[] = [
    { userId: 'user18', name: 'user u', score: 99994 },
    { userId: 'user17', name: 'user q', score: 7856 },
    { userId: 'user11', name: 'user k', score: 7854 },
    { userId: 'user7', name: 'user g', score: 7654 },
    { userId: 'user1', name: 'user a', score: 2683 },
    { userId: 'user6', name: 'user f', score: 2593 },
    { userId: 'user16', name: 'user p', score: 1254 },
    { userId: 'user8', name: 'user h', score: 1234 },
    { userId: 'user14', name: 'user n', score: 698 },
    { userId: 'user19', name: 'user r', score: 564 },
    { userId: 'user10', name: 'user j', score: 498 },
    { userId: 'user4', name: 'user d', score: 455 },
    { userId: 'user9', name: 'user i', score: 97 },
    { userId: 'user3', name: 'user c', score: 88 },
    { userId: 'user15', name: 'user o', score: 77 },
    { userId: 'user5', name: 'user e', score: 26 },
    { userId: 'user12', name: 'user l', score: 5 },
    { userId: 'user2', name: 'user b', score: 3 },
    { userId: 'user13', name: 'user m', score: 1 },
]

it("displays all users scores when there's 9 items", () => {
    const unsortedItems: ILeaderboardItem[] = [
        {userId: "user1", name: "user a", score: 2683},
        {userId: "user2", name: "user b", score: 3},
        {userId: "user3", name: "user c", score: 88},
        {userId: "user4", name: "user d", score: 455},
        {userId: "user5", name: "user e", score: 26},
        {userId: "user6", name: "user f", score: 2593},
        {userId: "user7", name: "user g", score: 7654},
        {userId: "user8", name: "user h", score: 1234},
        {userId: "user9", name: "user i", score: 97},
    ]

    render(<LeaderBoard items={unsortedItems} selectedUserId={"user7"} />)

    const listItems = screen.getAllByRole("listitem")
    expect(listItems.length).toBe(9)

    // Check that they are ordered highest to lowest by score
    const expectedOrder = _.orderBy(unsortedItems, x => x.score, "desc")
    _.zip(listItems, expectedOrder).forEach(x => {
        const expectedName = x[1]!.name
        const element = x[0]!
        expect(element).toHaveTextContent(expectedName)
    })
})

it("shows top 2, bottom 2 and users position +/- 1 when >9 participants", () => {
    

    const selectedUserId = "user14"
    const selectedUserIdIndex = sortedItems.findIndex(x => x.userId === selectedUserId)   

    render(<LeaderBoard items={sortedItems} selectedUserId={selectedUserId} />)

    const renderedListItems = screen.getAllByRole("listitem")
    expect(renderedListItems.length).toBe(9)

    // Check that they appear correctly //
    // top 2
    expect(renderedListItems[0]).toHaveTextContent(sortedItems[0].name)
    expect(renderedListItems[1]).toHaveTextContent(sortedItems[1].name)
    // first divider
    expect(renderedListItems[2]).toHaveTextContent("omitted leaderboard items")
    // user +/- 1
    expect(renderedListItems[3]).toHaveTextContent(sortedItems[selectedUserIdIndex-1].name)
    expect(renderedListItems[4]).toHaveTextContent(sortedItems[selectedUserIdIndex].name) // selected
    expect(renderedListItems[5]).toHaveTextContent(sortedItems[selectedUserIdIndex+1].name)
    // second divider
    expect(renderedListItems[6]).toHaveTextContent("omitted leaderboard items")
    // bottom 2
    expect(renderedListItems[7]).toHaveTextContent(sortedItems[sortedItems.length-2].name)
    expect(renderedListItems[8]).toHaveTextContent(sortedItems[sortedItems.length-1].name)
})

it("shows one ommision token and other leaders when participant is 1st", () =>{
    const selectedUserId = sortedItems[0].userId

    render(<LeaderBoard items={sortedItems} selectedUserId={selectedUserId} />)

    const renderedListItems = screen.getAllByRole("listitem")
    expect(renderedListItems.length).toBe(9)

    // Check that they appear correctly //
    // Top 6 leaders
    expect(renderedListItems[0]).toHaveTextContent(sortedItems[0].name) // selected
    expect(renderedListItems[1]).toHaveTextContent(sortedItems[1].name)
    expect(renderedListItems[2]).toHaveTextContent(sortedItems[2].name)
    expect(renderedListItems[3]).toHaveTextContent(sortedItems[3].name)
    expect(renderedListItems[4]).toHaveTextContent(sortedItems[4].name)
    expect(renderedListItems[5]).toHaveTextContent(sortedItems[5].name)
    // only divider
    expect(renderedListItems[6]).toHaveTextContent("omitted leaderboard items")
    // bottom 2
    expect(renderedListItems[7]).toHaveTextContent(sortedItems[sortedItems.length-2].name)
    expect(renderedListItems[8]).toHaveTextContent(sortedItems[sortedItems.length-1].name)
})

it("shows one ommision token and other losers when participant is last", () => {
    const selectedUserId = sortedItems[sortedItems.length-1].userId

    render(<LeaderBoard items={sortedItems} selectedUserId={selectedUserId} />)

    const renderedListItems = screen.getAllByRole("listitem")
    expect(renderedListItems.length).toBe(9)

    const len = sortedItems.length  // get the length, so its a bit cleaner below

    // Check that they appear correctly //
    // top 2
    expect(renderedListItems[0]).toHaveTextContent(sortedItems[0].name)
    expect(renderedListItems[1]).toHaveTextContent(sortedItems[1].name)
    // first divider
    expect(renderedListItems[2]).toHaveTextContent("omitted leaderboard items")
    // bottom 6
    expect(renderedListItems[3]).toHaveTextContent(sortedItems[len-6].name)
    expect(renderedListItems[4]).toHaveTextContent(sortedItems[len-5].name)
    expect(renderedListItems[5]).toHaveTextContent(sortedItems[len-4].name)
    expect(renderedListItems[6]).toHaveTextContent(sortedItems[len-3].name)
    expect(renderedListItems[7]).toHaveTextContent(sortedItems[len-2].name)
    expect(renderedListItems[8]).toHaveTextContent(sortedItems[len-1].name) // selected
})

it("shows one ommision token and other leaders when participant is in leader pack", () =>{
    const selectedUserId = sortedItems[4].userId

    render(<LeaderBoard items={sortedItems} selectedUserId={selectedUserId} />)

    const renderedListItems = screen.getAllByRole("listitem")
    expect(renderedListItems.length).toBe(9)

    // Check that they appear correctly //
    // Top 6 leaders
    expect(renderedListItems[0]).toHaveTextContent(sortedItems[0].name)
    expect(renderedListItems[1]).toHaveTextContent(sortedItems[1].name)
    expect(renderedListItems[2]).toHaveTextContent(sortedItems[2].name)
    expect(renderedListItems[3]).toHaveTextContent(sortedItems[3].name)
    expect(renderedListItems[4]).toHaveTextContent(sortedItems[4].name) // selected
    expect(renderedListItems[5]).toHaveTextContent(sortedItems[5].name)
    // only divider
    expect(renderedListItems[6]).toHaveTextContent("omitted leaderboard items")
    // bottom 2
    expect(renderedListItems[7]).toHaveTextContent(sortedItems[sortedItems.length-2].name)
    expect(renderedListItems[8]).toHaveTextContent(sortedItems[sortedItems.length-1].name)
})

it("shows one ommision token and other losers when participant is in loser pack", () =>{
    const selectedUserId = sortedItems[sortedItems.length-5].userId

    render(<LeaderBoard items={sortedItems} selectedUserId={selectedUserId} />)

    const renderedListItems = screen.getAllByRole("listitem")
    expect(renderedListItems.length).toBe(9)

    const len = sortedItems.length  // get the length, so its a bit cleaner below

    // Check that they appear correctly //
    // top 2
    expect(renderedListItems[0]).toHaveTextContent(sortedItems[0].name)
    expect(renderedListItems[1]).toHaveTextContent(sortedItems[1].name)
    // first divider
    expect(renderedListItems[2]).toHaveTextContent("omitted leaderboard items")
    // bottom 6
    expect(renderedListItems[3]).toHaveTextContent(sortedItems[len-6].name)
    expect(renderedListItems[4]).toHaveTextContent(sortedItems[len-5].name) // selected
    expect(renderedListItems[5]).toHaveTextContent(sortedItems[len-4].name)
    expect(renderedListItems[6]).toHaveTextContent(sortedItems[len-3].name)
    expect(renderedListItems[7]).toHaveTextContent(sortedItems[len-2].name)
    expect(renderedListItems[8]).toHaveTextContent(sortedItems[len-1].name)
})

it("shows top 2, bottom 2 and users position +/- 1 when just outside leader pack", () => {
    const selectedUserIndex = 5
    const selectedUserId = sortedItems[selectedUserIndex].userId

    render(<LeaderBoard items={sortedItems} selectedUserId={selectedUserId} />)

    const renderedListItems = screen.getAllByRole("listitem")
    expect(renderedListItems.length).toBe(9)

    // Check that they appear correctly //
    // top 2
    expect(renderedListItems[0]).toHaveTextContent(sortedItems[0].name)
    expect(renderedListItems[1]).toHaveTextContent(sortedItems[1].name)
    // first divider
    expect(renderedListItems[2]).toHaveTextContent("omitted leaderboard items")
    // user +/- 1
    expect(renderedListItems[3]).toHaveTextContent(sortedItems[selectedUserIndex-1].name)
    expect(renderedListItems[4]).toHaveTextContent(sortedItems[selectedUserIndex].name) // selected
    expect(renderedListItems[5]).toHaveTextContent(sortedItems[selectedUserIndex+1].name)
    // second divider
    expect(renderedListItems[6]).toHaveTextContent("omitted leaderboard items")
    // bottom 2
    expect(renderedListItems[7]).toHaveTextContent(sortedItems[sortedItems.length-2].name)
    expect(renderedListItems[8]).toHaveTextContent(sortedItems[sortedItems.length-1].name)
})

it("shows top 2, bottom 2 and users position +/- 1 when just outside loser pack", () => {
    const selectedUserIndex = sortedItems.length - 6
    const selectedUserId = sortedItems[selectedUserIndex].userId

    render(<LeaderBoard items={sortedItems} selectedUserId={selectedUserId} />)

    const renderedListItems = screen.getAllByRole("listitem")
    expect(renderedListItems.length).toBe(9)

    // Check that they appear correctly //
    // top 2
    expect(renderedListItems[0]).toHaveTextContent(sortedItems[0].name)
    expect(renderedListItems[1]).toHaveTextContent(sortedItems[1].name)
    // first divider
    expect(renderedListItems[2]).toHaveTextContent("omitted leaderboard items")
    // user +/- 1
    expect(renderedListItems[3]).toHaveTextContent(sortedItems[selectedUserIndex-1].name)
    expect(renderedListItems[4]).toHaveTextContent(sortedItems[selectedUserIndex].name) // selected
    expect(renderedListItems[5]).toHaveTextContent(sortedItems[selectedUserIndex+1].name)
    // second divider
    expect(renderedListItems[6]).toHaveTextContent("omitted leaderboard items")
    // bottom 2
    expect(renderedListItems[7]).toHaveTextContent(sortedItems[sortedItems.length-2].name)
    expect(renderedListItems[8]).toHaveTextContent(sortedItems[sortedItems.length-1].name)
})

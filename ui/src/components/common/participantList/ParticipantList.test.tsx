import '@testing-library/jest-dom'
import { render, screen, } from "@testing-library/react"
import { ILeaderboardItem } from '../../../types'
import ParticipantList from './ParticipantList'

const leaderboardItems: ILeaderboardItem[] = [
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

it("shows this participant first when provided and all list items", () => {
    const thisParticipantName = "thisparticipant"
    render(
        <ParticipantList
            thisParticipant={<h1>{thisParticipantName}</h1>}
            otherParticipants={leaderboardItems}
        />
    )

    const listItems = screen.getAllByRole("listitem")
    expect(listItems.length).toBe(leaderboardItems.length + 1)

    // First item is this participant...
    expect(listItems[0]).toHaveTextContent(thisParticipantName)

    // ... followed by all other participants in the same order as provided
    for (let i = 0; i < leaderboardItems.length; i++) {
        expect(listItems[i + 1]).toHaveTextContent(leaderboardItems[i].name)
    }
})

it("shows all list items and not participant when omitted", () => {
    render(
        <ParticipantList
            otherParticipants={leaderboardItems}
        />
    )

    const listItems = screen.getAllByRole("listitem")
    expect(listItems.length).toBe(leaderboardItems.length)

    for (let i = 0; i < leaderboardItems.length; i++) {
        expect(listItems[i]).toHaveTextContent(leaderboardItems[i].name)
    }
})

import '@testing-library/jest-dom'
import { render, screen, } from "@testing-library/react"
import ParticipantListItem from './ParticipantListItem'

it("shows name", () => {
    const name = "foo"
    render(<ParticipantListItem name={name} />)
    expect(screen.getByText(name)).toBeVisible()
})
import '@testing-library/jest-dom'
import { fireEvent, render, screen, } from "@testing-library/react"
import ParticipantListJoinItem from './ParticipantListJoinItem'

it("has disabled join button when username not set", () => {
    render(
        <ParticipantListJoinItem
            username={""}
            userJoined={false}
            onJoin={jest.fn()}
        />
    )
    const button = screen.getByRole("button")
    expect(button).toBeDisabled()
})

it("has enabled join button when username is set", () => {
    render(
        <ParticipantListJoinItem
            username={""}
            userJoined={false}
            onJoin={jest.fn()}
        />
    )

    const nameField = screen.getByLabelText("name")
    const button = screen.getByRole("button")

    // Fill in the name - button will enable
    fireEvent.change(nameField, {target:{value: "Harrison"}})
    expect(button).toBeEnabled()

    // Clear the name field and the button will disable
    fireEvent.change(nameField, {target:{value: ""}})
    expect(button).toBeDisabled()
})

it("calls onJoin prop when clicked", () => {
    const handleClick = jest.fn()
    render(
        <ParticipantListJoinItem
            username={""}
            userJoined={false}
            onJoin={handleClick}
        />
    )
    const nameField = screen.getByLabelText("name")
    const button = screen.getByRole("button")

    // Add some text so the button will enable
    fireEvent.change(nameField, {target:{value: "Harrison"}})
    fireEvent.click(button)

    expect(handleClick).toHaveBeenCalledTimes(1)
})

it("doesn't show button when user has joined and shows username", () => {
    const username = "usersname"
    render(
        <ParticipantListJoinItem
            username={username}
            userJoined={true}
            onJoin={jest.fn()}
        />
    )

    expect(screen.queryByText("button")).not.toBeInTheDocument()
    expect(screen.getByText(username)).toBeInTheDocument()
})
import '@testing-library/jest-dom'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import UploadModal from './UploadModal'

it("doesn't show modal when open is false", () => {
    render(
        <UploadModal
            open={false}
            onUpload={jest.fn()}
        />
    )
    expect(screen.queryByText(/Upload Quiz/)).not.toBeInTheDocument()
})

it("shows modal when open is true", () => {
    render(
        <UploadModal
            open={true}
            onUpload={jest.fn()}
        />
    )
    expect(screen.queryByText(/Upload Quiz/)).toBeInTheDocument()
})

it("has disabled upload button before file has been picked", () => {
    const onUpload = jest.fn()
    render(
        <UploadModal
            open={true}
            onUpload={onUpload}
        />
    )

    const button = screen.getByText("Upload")
    fireEvent.click(button)
    expect(onUpload).toBeCalledTimes(0)
})

it("fires onUpload when upload button is clicked", async () => {
    const onUpload = jest.fn()
    render(
        <UploadModal
            open={true}
            onUpload={onUpload}
        />
    )
    // populate the file chooser
    const filePicker = screen.getByTestId("upload-quiz-input")
    userEvent.upload(filePicker, new File(["filebits"], "filename.txt"))

    const button = screen.getByText("Upload")
    await act(async () => userEvent.click(button))
    expect(onUpload).toBeCalledTimes(1)
})

it("shows error message with disabled upload button and empty choose file when uploadErrMsg is set", () => {
    const errMessage = "error message"
    render(
        <UploadModal
            open={true}
            onUpload={jest.fn()}
            uploadErrMsg={errMessage}
        />
    )
    expect(screen.getByText(new RegExp(errMessage))).toBeInTheDocument()
})
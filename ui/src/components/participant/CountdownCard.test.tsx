import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import CountdownCard from './CountdownCard'

const secondsRemaining = 120
const totalSeconds = 240

it("renders seconds remaining", () => {
    render(
        <CountdownCard
            secondsRemaining={secondsRemaining}
            totalSeconds={totalSeconds}
        />
    )
    expect(screen.getByText(new RegExp(secondsRemaining.toString())))
        .toBeInTheDocument()
})

it("renders progress bar percentage", () => {
    render(
        <CountdownCard
            secondsRemaining={secondsRemaining}
            totalSeconds={totalSeconds}
        />
    )
    const progressBar = screen.getByRole("progressbar")
    const progressValueMax = parseInt(progressBar.getAttribute("aria-valuemax") as string)
    const progressValueMin = parseInt(progressBar.getAttribute("aria-valuemin") as string)
    const progressValueNow = parseInt(progressBar.getAttribute("aria-valuenow") as string)
    const actualProgress = (progressValueNow - progressValueMin) / (progressValueMax - progressValueMin)
    expect(actualProgress).toEqual(secondsRemaining/totalSeconds)
})
import '@testing-library/jest-dom'
import { render, screen, } from "@testing-library/react"
import StatCard, { StatCardSize } from './StatCard'

it.each([
    StatCardSize.SMALL, StatCardSize.LARGE, StatCardSize.LONG
])("shows label, value and unit", (statCardSize: StatCardSize) => {
    const label = "Weight"
    const value = "50"
    const unit = "kg"

    render(
        <StatCard
            label={label}
            value={value}
            unit={unit}
            size={statCardSize}
        />
    )

    expect(screen.getByText(label)).toBeInTheDocument()
    expect(screen.getByText(value)).toBeInTheDocument()
    expect(screen.getByText(unit)).toBeInTheDocument()
})
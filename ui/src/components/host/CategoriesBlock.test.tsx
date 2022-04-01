import '@testing-library/jest-dom'
import { fireEvent, render, screen, } from "@testing-library/react"
import CategoriesBlock from './CategoriesBlock'

it("shows categories as selected", () => {
    const categories = ["category 1", "category 2", "category 3", "category 4"]
    const selectedCategories = ["category 1", "category 4"]
    render(
        <CategoriesBlock
            categories={categories}
            selectedCategories={selectedCategories}
            checkListener={jest.fn()}
        />
    )

    expect(screen.getByLabelText(categories[0])).toBeChecked()
    expect(screen.getByLabelText(categories[1])).not.toBeChecked()
    expect(screen.getByLabelText(categories[2])).not.toBeChecked()
    expect(screen.getByLabelText(categories[3])).toBeChecked()
})

it("fires checkListener on checkbox selection change", () => {
    const categories = ["category 1", "category 2", "category 3", "category 4"]
    const selectedCategories = ["category 1", "category 4"]
    const checkListener = jest.fn()
    render(
        <CategoriesBlock
            categories={categories}
            selectedCategories={selectedCategories}
            checkListener={checkListener}
        />
    )

    const checkBox1 = screen.getByLabelText(categories[0]) as HTMLInputElement
    const checkBox2 = screen.getByLabelText(categories[1]) as HTMLInputElement
    const checkBox3 = screen.getByLabelText(categories[2]) as HTMLInputElement
    const checkBox4 = screen.getByLabelText(categories[3]) as HTMLInputElement

    fireEvent.click(checkBox4)
    fireEvent.click(checkBox2)
    fireEvent.click(checkBox3)
    fireEvent.click(checkBox1)

    // Make sure the listeners all fired correctly
    expect(checkListener).toBeCalledTimes(4)
    expect(checkListener).nthCalledWith(1, categories[3], false)
    expect(checkListener).nthCalledWith(2, categories[1], true)
    expect(checkListener).nthCalledWith(3, categories[2], true)
    expect(checkListener).nthCalledWith(4, categories[0], false)
})

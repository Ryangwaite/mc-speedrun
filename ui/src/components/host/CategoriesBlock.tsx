import { Checkbox, FormControlLabel, FormGroup, Typography } from "@mui/material"

interface ICategoriesBlockProps {
    categories: string[],
    selectedCategories: string[],
    checkListener: (category: string, checked: boolean) => void
}

function CategoriesBlock(props: ICategoriesBlockProps): JSX.Element {

    const { categories, selectedCategories, checkListener } = props

    const handleCheckChange = (event: React.ChangeEvent<HTMLInputElement>, category: string) => {
        const newCheckState = event.target.checked
        checkListener(category, newCheckState)
    }

    const items = categories.map(category => {
        const isChecked = selectedCategories.includes(category)
        return (
            <FormControlLabel
                key={category}
                label={category}
                checked={isChecked}
                control={
                    <Checkbox
                        onChange={e => handleCheckChange(e, category)}
                    />
                }
                sx={{
                    // Dont highlight the text
                    userSelect: "none"
                }}
            />
        )
    })

    return (
        <>
            <Typography variant="h6" color="grey.600">Categories</Typography>
            <FormGroup>
                {items}
            </FormGroup>
        </>
    )
}

export default CategoriesBlock
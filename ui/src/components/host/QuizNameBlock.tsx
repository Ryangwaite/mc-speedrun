import { TextField, Typography } from "@mui/material"

interface IQuizNameBlockProps {
    onQuizNameChange: (name: string) => void
}

function QuizNameBlock(props: IQuizNameBlockProps): JSX.Element {
    return (
        <>
            <Typography variant="h6" color="grey.600">Quiz Name</Typography>
            <TextField
                id="outlined-basic"
                variant="outlined"
                label="Name"
                type="text"
                InputLabelProps={{
                    shrink: true,
                }}
                onChange={(event) => props.onQuizNameChange(event.target.value)}
                sx={{
                    marginTop: 1.5
                }}
            />
        </>
    )
}

export default QuizNameBlock
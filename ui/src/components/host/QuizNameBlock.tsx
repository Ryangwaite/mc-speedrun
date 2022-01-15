import { TextField, Typography } from "@mui/material"

interface IQuizNameBlockProps {
    quizName: string,
    onQuizNameChange: (name: string) => void
}

function QuizNameBlock(props: IQuizNameBlockProps): JSX.Element {
    const {quizName, onQuizNameChange} = props

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
                value={quizName}
                onChange={(event) => onQuizNameChange(event.target.value)}
                sx={{
                    marginTop: 1.5
                }}
            />
        </>
    )
}

export default QuizNameBlock
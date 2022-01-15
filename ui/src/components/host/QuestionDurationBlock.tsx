import { TextField, Typography } from "@mui/material"

interface IQuestionDurationBlockProps {
    questionDuration: number,
    onDurationChanged: (duration: number) => void
}

function QuestionDurationBlock(props: IQuestionDurationBlockProps) {

    const {questionDuration, onDurationChanged} = props

    function textFieldChange(event: React.ChangeEvent<HTMLInputElement>) {
        const nextValue = parseInt(event.target.value)
        if (nextValue >= 0 || isNaN(nextValue)) {
            onDurationChanged(nextValue)
        }
    }

    return (
        <>
            <Typography variant="h6" color="grey.600">Question Duration</Typography>
            <TextField
                id="outlined-number"
                label="Number"
                type="number"
                helperText="seconds"
                InputLabelProps={{
                    shrink: true,
                }}
                value={questionDuration}
                onChange={textFieldChange}
                sx={{
                    marginTop: 1.5,
                }}
            />
        </>
    )
}

export default QuestionDurationBlock
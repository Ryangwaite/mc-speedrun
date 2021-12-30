import { Box, TextField, Typography } from "@mui/material"

interface IQuestionDurationBlockProps {
    onDurationChanged: (duration: number) => void
}

function QuestionDurationBlock(props: IQuestionDurationBlockProps) {

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
                onChange={(event) => props.onDurationChanged(parseInt(event.target.value))}
                sx={{
                    marginTop: 1.5
                }}
            />
        </>
    )
}

export default QuestionDurationBlock
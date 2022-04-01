import { TextField, Typography } from "@mui/material"
import React, { KeyboardEvent, useState } from "react"

interface IQuestionDurationBlockProps {
    questionDuration: number,
    onDurationChanged: (duration: number) => void,
}

function QuestionDurationBlock(props: IQuestionDurationBlockProps) {

    const {questionDuration, onDurationChanged} = props

    const [value, setValue] = useState(questionDuration.toString())

    /**
     * Receive all change events and update the local state.
     */
    function onChange(event: React.ChangeEvent<HTMLInputElement>) {
        const nextValue = parseInt(event.target.value)
        if (nextValue >= 0) {
            setValue(nextValue.toString())
        } else {
            // Invalid value was entered
            setValue("NaN")
        }
    }

    // Fires the onDurationChanged prop with the current value
    const onKeyUp = (event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === "ArrowUp" || event.key === "ArrowDown") {
            onDurationChanged(fieldValueToSubmitValue(value))
        }
    }

    return (
        <>
            <Typography variant="h6" color="grey.600">Question Duration</Typography>
            <TextField
                label="Duration"
                type="number"
                helperText="seconds"
                InputLabelProps={{
                    shrink: true,
                }}
                error={value === "NaN"}
                value={value}
                onChange={onChange}
                // When the up and down arrows are released, fire the listener
                onKeyUp={onKeyUp}
                // When the click has released from the up and down arrow buttons
                // of the input, fire the listener
                onPointerUp={() => onDurationChanged(fieldValueToSubmitValue(value))}
                sx={{
                    marginTop: 1.5,
                }}
            />
        </>
    )
}

export default QuestionDurationBlock

/**
 * Converts the fieldValue to a numeric value for
 * firing the onDurationChanged listener.
 * 
 * @param fieldValue value the field is set to
 */
function fieldValueToSubmitValue(fieldValue: string): number {
    if (fieldValue === "NaN") {
        return 0
    } else {
        return parseInt(fieldValue)
    }
}
import { IconButton, Snackbar, Stack, TextField } from "@mui/material"
import { useRef, useState } from "react"
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

interface IQuizAccessCodeProps {
    accessCode: string,
}

function QuizAccessCode(props: IQuizAccessCodeProps) {
    
    const [snackbarVisible, setSnackbarVisible] = useState(false)
    const accessCodeRef = useRef(null)

    /**
     * Copies the code to clipboard
     */
    function onCopyIconClicked() {
        const element: HTMLInputElement = accessCodeRef.current!
        element.select()
        document.execCommand("copy")

        // Display the copy snackbar
        setSnackbarVisible(true)
    }

    return (
        <Stack
            direction="row"
        >
            <TextField
                inputRef={accessCodeRef}
                id="access-code-field"
                label="Access Code"
                defaultValue={props.accessCode}
                InputProps={{
                    readOnly: true,
                }}
            />
            <IconButton aria-label="copy" onClick={onCopyIconClicked}>
                <ContentCopyIcon />
            </IconButton>
            <Snackbar
                open={snackbarVisible}
                autoHideDuration={1000}
                onClose={() => setSnackbarVisible(false)}
                message="Access code copied!"
                anchorOrigin={{
                    vertical: "bottom",
                    horizontal: "right",
                }}
            />
        </Stack>
    )
}

export default QuizAccessCode
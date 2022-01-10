import { Badge, Box, IconButton, Snackbar, Stack, TextField, Typography } from "@mui/material"
import { useRef, useState } from "react"
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import MenuIcon from '@mui/icons-material/Menu';
import theme from "../../themes/theme";

interface IQuizAccessCodeProps {
    accessCode: string,
    showMenu: boolean,
    menuBadge: string,
    menuClicked: () => void,
}

function QuizAccessCode(props: IQuizAccessCodeProps) {
    const [snackbarVisible, setSnackbarVisible] = useState(false)
    const accessCodeRef = useRef(null)

    const {accessCode, showMenu, menuBadge, menuClicked} = props

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
        <Box
            display={"flex"}
            flexDirection={"row"}
            alignItems={"stretch"}
            justifyContent={"center"}
        >
            <Box>
                <Typography variant="h6" color={theme.palette.grey["600"]}>Participants</Typography>
                <Typography variant="body1" color={theme.palette.grey["500"]}>Invite friends to join by sharing the following code</Typography>
                <Stack
                    direction="row"
                    marginTop={1.5}
                >
                    <TextField
                        inputRef={accessCodeRef}
                        id="access-code-field"
                        label="Access Code"
                        defaultValue={accessCode}
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
            </Box>
            <Box
                display={showMenu ? "inherit" : "none"}
                alignSelf={"start"}
                marginLeft={3}
            >
                <IconButton aria-label="menu" onClick={menuClicked}>
                    <Badge badgeContent={menuBadge} color="primary">
                        <MenuIcon />
                    </Badge>
                </IconButton>
            </Box>
        </Box>
    )
}

export default QuizAccessCode
import { Fab, Fade } from "@mui/material";
import theme from "../../themes/theme";

interface IStartFabProps {
    enabled: boolean,
    onStartClicked: () => void,
}

function StartFab(props: IStartFabProps) {

    const {enabled, onStartClicked} = props

    return (
        <Fade in={enabled}>
            <Fab
                variant="extended"
                color="primary"
                disabled={!enabled}
                onClick={onStartClicked}
                sx={{
                    width: theme.spacing(16),
                    borderRadius: 4,
                    display: enabled ? "inherit" : "none", // hide the button when not enabled
                }}
            >
                Start
            </Fab>
        </Fade>
    )
}

export default StartFab
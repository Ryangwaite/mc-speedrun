import { Button, Card, LinearProgress, Typography } from "@mui/material"
import theme from "../../../themes/theme"

interface IProgressBlockProps {
    progressCurrent: number,        // i.e. how many participants have finished
    progressTotal: number,          // i.e. how many total participants
    onReturnToHomeClicked: () => void
}

function ProgressBlock(props: IProgressBlockProps) {
    const {progressCurrent, progressTotal, onReturnToHomeClicked} = props

    let content
    
    if (progressCurrent === progressTotal) {
        // All Participants have finished
        content = <>
            <Typography
                variant="h4"
                margin={3}
                marginBottom={1.5}
                textAlign={"center"}
            >Complete!</Typography>
            <Button
                variant="contained"
                onClick={onReturnToHomeClicked}
                sx={{
                    marginTop: 0,
                    marginBottom: 3,
                }}
            >RETURN TO HOME</Button>
        </>
    } else {
        // Some participants are still going
        const progress = (progressCurrent / progressTotal) * 100
        content = <>
            <Typography
                variant="subtitle1"
                margin={3}
                marginBottom={1.5}
            >{progressCurrent}/{progressTotal} finished</Typography>
            <LinearProgress
                variant="determinate"
                value={progress}
                sx={{
                    width: `calc(100% - ${theme.spacing(3)} - ${theme.spacing(3)})`, // = fullWidthParent - marginLeft - marginRight
                    marginBottom: 3,
                }}
            />
        </>
    }

    return (
        <Card
            sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
            }}
        >
            {content}
        </Card>
    )
}

export default ProgressBlock
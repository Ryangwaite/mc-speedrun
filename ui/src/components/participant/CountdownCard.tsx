import { Card, LinearProgress, Typography } from "@mui/material"

interface ICountdownCardProps {
    secondsRemaining: number,
    totalSeconds: number,
}

function CountdownCard(props: ICountdownCardProps) {

    const {secondsRemaining, totalSeconds} = props

    // Map to a value between 0 and 100
    const progressValue = 100 * (secondsRemaining / totalSeconds)

    return (
        <Card
            sx={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                height: "100%",
            }}
        >
            <Typography
                variant="h4"
                textAlign="center"
                marginBottom={1.5}
            >{secondsRemaining}s</Typography>
            <LinearProgress
                variant="determinate"
                value={progressValue}
                sx={{
                    marginRight: 3,
                    marginLeft: 3,
                }}
            />
        </Card>
    )
}

export default CountdownCard
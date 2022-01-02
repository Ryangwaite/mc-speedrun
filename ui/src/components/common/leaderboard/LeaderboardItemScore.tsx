import { Box, Typography } from "@mui/material"

interface ILeaderBoardItemScoreProps {
    score: number,
}

function LeaderBoardItemScore(props: ILeaderBoardItemScoreProps) {
    const borderDiameter = "58px"
    return (
        <Box
            sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                border: "5px solid green",
                borderRadius: "50%", // Circular border
                width: borderDiameter,
                height: borderDiameter,
            }}
        >
            <Typography
                variant="body1"
                fontWeight="bold"
            >{props.score}</Typography>
        </Box>
    )
}

export default LeaderBoardItemScore
import { Box, Typography } from "@mui/material"

export default function NotFound() {
    return (
        <Box
            // Position the container so the LeaderBoard and QuizSection can be positioned relative to it
            position="relative"
            display={"flex"}
            alignItems={"center"}
            justifyContent={"center"}
            sx={{
                flexGrow: 1,
                minWidth: "100%",
                height: "100%",
            }}
        >
            <Typography variant="h1" align="center">Page Not Found 😞</Typography>
        </Box>
    )
}

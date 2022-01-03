import { Box, Card, Typography } from "@mui/material"
import theme from "../../../themes/theme"

interface IStatCardProps {
    label: string,
    value: string,
    unit: string,
}

function StatCard(props: IStatCardProps) {

    const { label, value, unit } = props

    // Dont show the unit and label if the value is empty string
    const labelToRender = value.length > 0 ? label : ""
    const unitToRender = value.length > 0 ? unit : ""

    return (
        <Card
            sx={{
                width: "100%",
                // Centre the value in the middle
                display: "flex",
                justifyContent: "start",
                alignItems: "center",
            }}
        >
            <Box
                margin={3}
            >
                <Typography
                    variant="body1"
                    color={theme.palette.grey[600]}
                >{labelToRender}</Typography>
                <Typography
                    variant="h3"
                    display={"inline"}
                    marginRight={1}
                >{value}</Typography>
                <Typography
                    variant="body1"
                    display={"inline"}
                >{unitToRender}</Typography>
            </Box>
        </Card>
    )
}

export default StatCard
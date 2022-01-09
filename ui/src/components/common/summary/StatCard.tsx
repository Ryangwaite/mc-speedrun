import { Box, Card, Stack, Typography } from "@mui/material"
import theme from "../../../themes/theme"

interface IStatCardContentProps {
    label: string,
    value: string,
    unit: string,
}

function SmallStatCardContent(props: IStatCardContentProps) {
    const { label, value, unit } = props

    return (
        <>
            <Typography
                variant="body1"
                color={theme.palette.grey[600]}
                align="center"
            >{label}</Typography>
            <Typography
                variant="h4"
                align="center"
            >{value}</Typography>
            <Typography
                variant="body1"
                align="center"
            >{unit}</Typography>
        </>
    )
}

function LargeStatCardContent(props: IStatCardContentProps) {
    const { label, value, unit } = props

    return (
        <>
            <Typography
                variant="body1"
                color={theme.palette.grey[600]}
            >{label}</Typography>
            <Typography
                variant="h3"
                display={"inline"}
                marginRight={1}
            >{value}</Typography>
            <Typography
                variant="body1"
                display={"inline"}
            >{unit}</Typography>
        </>
    )
}

function LongStatCardContent(props: IStatCardContentProps) {
    const { label, value, unit } = props

    return (
        <Stack
            direction={"row"}
        >
            <Typography
                variant="body1"
                color={theme.palette.grey[600]}
                alignSelf={"start"}
            >{label}</Typography>
            <Typography
                variant="h4"
                alignSelf={"end"}
                marginLeft={1.5}
                marginRight={1}
            >{value}</Typography>
            <Typography
                variant="body1"
                alignSelf={"end"}
                marginBottom={0.5} // Bit of a hack to get the bottom of the unit to be inline with bottom of number (alignSelf=baseline not working)
            >{unit}</Typography>
        </Stack>
    )
}

export enum StatCardSize {
    SMALL, LARGE, LONG
}

interface IStatCardProps {
    size: StatCardSize,
    label: string,
    value: string,
    unit: string,
}

function StatCard(props: IStatCardProps) {

    const { size, label, value, unit } = props

    // Dont show the unit and label if the value is empty string
    const showEmpty = value.length === 0

    let content
    if (showEmpty) {
        content = null
    } else if (size === StatCardSize.SMALL) {
        content = <SmallStatCardContent label={label} value={value} unit={unit} />
    } else if (size === StatCardSize.LARGE) {
        content = <LargeStatCardContent label={label} value={value} unit={unit} />
    } else {
        content = <LongStatCardContent label={label} value={value} unit={unit} />
    }

    return (
        <Card
            sx={{
                width: "100%",
                // Centre the value in the middle
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
            }}
        >
            <Box
                margin={3}
                width={"100%"}
            >
                {content}
            </Box>
        </Card>
    )
}

export default StatCard
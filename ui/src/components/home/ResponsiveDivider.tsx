import { Box, Container, Divider } from "@mui/material"

interface IResponsiveDividerProps {
    orientation: "horizontal" | "vertical"
}

function ResponsiveDivider(props: IResponsiveDividerProps) {

    const marginSize = 2

    if (props.orientation === "vertical") {
        return (
            <Divider
                flexItem
                orientation="vertical"
                textAlign="center"
                sx={{
                    marginTop: "auto",
                    marginBottom: "auto",
                    marginLeft: marginSize,
                    marginRight: marginSize,
                    height: 320
                }}
            >
                OR
            </Divider>
        )
    } else {
        // Horizontal version
        return (
            <Divider
                textAlign="center"
                sx={{
                    marginTop: marginSize,
                    marginBottom: marginSize,
                }}
            >
                OR
            </Divider>
        )
    }
}

export default ResponsiveDivider
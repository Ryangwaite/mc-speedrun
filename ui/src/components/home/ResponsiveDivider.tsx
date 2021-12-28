import { Divider } from "@mui/material"
import theme from "../../themes/theme"

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
                    height: 320,
                    '&.MuiDivider-root': {
                        '&::before,::after': {
                            borderLeft: `1px solid ${theme.palette.grey[400]}`
                        } 
                    }
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
                    '&.MuiDivider-root': {
                        '&::before,::after': {
                            borderTop: `1px solid ${theme.palette.grey[400]}`
                        } 
                    }
                }}
            >
                OR
            </Divider>
        )
    }
}

export default ResponsiveDivider
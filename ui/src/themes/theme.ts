import { Color } from "@mui/material"
import { blue, green, grey, red } from "@mui/material/colors"
import { createTheme, SxProps, Theme } from "@mui/material/styles"

// Make all the shades of colors defined in the pallette below
// available to components.
// See https://stackoverflow.com/questions/67013112/material-ui-how-to-access-all-palette-shades-inside-component
type ColorPartial = Partial<Color>
declare module "@mui/material/styles/createPalette" {
    interface PaletteColor extends ColorPartial {}
}

const theme = createTheme({
    palette: {
        primary: {
            ...blue,
            main: blue[700],
        },
        grey: grey,
        success: green,
        error: red,
    },
    components: {
        MuiCard: {
            styleOverrides: {
                root: {
                    borderRadius: 16,
                    boxShadow: "none",
                },
            }
        }
    },
})

export default theme

// TODO: check if this can be stored in the theme object directly
export const scrollbarMixin: SxProps<Theme> = {
    "&::-webkit-scrollbar": {
        width: theme.spacing(1),
    },
    "&::-webkit-scrollbar-track": {
        boxShadow: theme.shadows[0],
    },
    "&::-webkit-scrollbar-thumb": {
        backgroundColor: theme.palette.grey[500],
        borderRadius: 5,
        "&:hover": {
            backgroundColor: theme.palette.grey[600],
        }
    },
}
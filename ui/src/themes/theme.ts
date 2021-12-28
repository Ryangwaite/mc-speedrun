import { Color } from "@mui/material"
import { blue, green, grey, red } from "@mui/material/colors"
import { createTheme } from "@mui/material/styles"
import { type } from "os"

const theme = createTheme({
    palette: {
        primary: {
            main: blue[700]
        },
        grey: grey,
        success: green,
        error: red,
    },
})

export default theme
import { blue, green, grey, red } from "@mui/material/colors"
import { createTheme } from "@mui/material/styles"

const theme = createTheme({
    palette: {
        primary: {
            ...blue,
            main: blue[800],
        },
        grey: grey,
        success: green,
        error: red,
    },
    // components: {
    //     MuiButton: {
    //         styleOverrides: {
    //             root: {
    //                 backgroundColor: "grey.100",
    //             }
    //         }
    //     }
    // }
})

export default theme
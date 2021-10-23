import { Button, Card, CardActions, CardContent, CardHeader, Divider, Grid, TextField } from "@mui/material";
import { Theme, useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

interface IInputTextBoxProps {
    title: string,
    label: string,
    buttonLabel: string,
}

function InputTextBox(props: IInputTextBoxProps) {
    const { title, label, buttonLabel} = props
    return (
        <Card sx={{
            marginLeft: "auto",
            marginRight: "auto",
            marginTop: "theme",
            maxWidth: 320
        }}>
            <CardHeader title={title} sx={{ textAlign: "center" }} />
            <CardContent>
                <TextField id="outlined-basic" label={label} fullWidth />
            </CardContent>
            <CardActions>
                <Button variant="contained" fullWidth>{buttonLabel}</Button>
            </CardActions>
        </Card>
    )
}

/**
 * Divider that switches between horizontal and vertical
 * depending on screen size
 */
function ResponsiveDivider() {

    const theme: Theme = useTheme();
    const isSmallAndUp = useMediaQuery(theme.breakpoints.up("sm"));

    const marginSize = 2

    if (isSmallAndUp) {
        // Vertical version
        return (
            <Divider
                flexItem
                orientation={isSmallAndUp ? "vertical" : "horizontal"}
                textAlign="center"
                sx={{
                    marginLeft: marginSize,
                    marginRight: marginSize
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
                    width: "80%"
                }}
            >
                OR
            </Divider>
        )
    }
}


interface IHomeProps {
    // TODO
}

function Home(props: IHomeProps) {

    return (
        <Grid
            container
            alignItems="center"
            justifyContent="center"
        >
            <Grid item xs={12} sm={5} >
                <InputTextBox
                    title={"Join"} 
                    label={"Access Code"} 
                    buttonLabel={"Enter"}
                />
            </Grid>
            <ResponsiveDivider />
            <Grid item xs={12} sm={5}>
                <InputTextBox
                    title={"Host"}
                    label={"Name of quiz"}
                    buttonLabel={"Join"}
                />
            </Grid>
        </Grid>
    )
}

export default Home;
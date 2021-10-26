import React from "react";
import { Button, Card, CardActions, CardContent, CardHeader, Divider, Grid, TextField } from "@mui/material";
import { Theme, useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

interface IInputTextBoxProps {
    title: string,
    label: string,
    buttonLabel: string,
    onSubmit: (inputContent: string) => void
}

interface IInputTextBoxState {
    fieldContent: string
}

class InputTextBox extends React.Component<IInputTextBoxProps, IInputTextBoxState> {
    constructor(props: IInputTextBoxProps) {
        super(props);
        this.state = {
            fieldContent: ""
        }
        this.onFieldChange = this.onFieldChange.bind(this);
    }
    
    private onFieldChange(event: React.ChangeEvent<HTMLInputElement>) {
        this.setState({fieldContent: event.target.value})
    }
    
    render() {
        const { title, label, buttonLabel, onSubmit} = this.props
        return (
            <Card sx={{
                marginLeft: "auto",
                marginRight: "auto",
                maxWidth: 320
            }}>
                <CardHeader title={title} sx={{ textAlign: "center" }} />
                <CardContent>
                    <TextField id="outlined-basic" label={label} fullWidth onChange={this.onFieldChange}/>
                </CardContent>
                <CardActions>
                    <Button
                        disabled={!this.state.fieldContent}
                        onClick={() => onSubmit(this.state.fieldContent)}
                        variant="contained" 
                        fullWidth
                    >{buttonLabel}</Button>
                </CardActions>
            </Card>
        )
    }
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

    const onParticipantJoin = (code: string) => {
        alert(`Preparing to join session '${code}'`)
    }

    const onHostBegin = (name: string) => {
        alert(`Preparing to host session '${name}'`)
    }

    return (
        <Grid
            container
            alignItems="center"
            justifyContent="center"
            marginTop="5vh"
        >
            <Grid item xs={12} sm={5} >
                <InputTextBox
                    title={"Join"} 
                    label={"Access Code"} 
                    buttonLabel={"Enter"}
                    onSubmit={onParticipantJoin}
                />
            </Grid>
            <ResponsiveDivider />
            <Grid item xs={12} sm={5}>
                <InputTextBox
                    title={"Host"}
                    label={"Name of quiz"}
                    buttonLabel={"Begin"}
                    onSubmit={onHostBegin}
                />
            </Grid>
        </Grid>
    )
}

export default Home;
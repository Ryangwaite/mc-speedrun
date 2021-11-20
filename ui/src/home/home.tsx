import React, { useState } from "react";
import { Button, Card, CardActions, CardContent, CardHeader, Divider, Grid, TextField } from "@mui/material";
import { Theme, useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useNavigate } from "react-router-dom";
import { postHostQuiz, postJoinQuiz } from "../api/auth";
interface IInputTextBoxProps {
    title: string,
    label: string,
    buttonLabel: string,
    onSubmit: (inputContent: string) => void
}

function InputTextBox(props: IInputTextBoxProps) {

    const [fieldContent, setFieldContent] = useState("")

    function onFieldChange(event: React.ChangeEvent<HTMLInputElement>) {
        const value = event.target.value;
        console.debug(`Field has updated to '${value}'`)
        setFieldContent(value)
    }
    
    const { title, label, buttonLabel, onSubmit} = props
    return (
        <Card sx={{
            marginLeft: "auto",
            marginRight: "auto",
            maxWidth: 320
        }}>
            <CardHeader title={title} sx={{ textAlign: "center" }} />
            <CardContent>
                <TextField id="outlined-basic" label={label} fullWidth onChange={onFieldChange}/>
            </CardContent>
            <CardActions>
                <Button
                    disabled={!fieldContent}
                    onClick={() => onSubmit(fieldContent)}
                    variant="contained" 
                    fullWidth
                >{buttonLabel}</Button>
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

    let navigate = useNavigate();

    const onParticipantJoin = async (code: string) => {
        console.debug(`Joining lobby with code '${code}'`)
        try {
            const authorizationResponse = await postJoinQuiz(code)
            // TODO: Store the JWT token somewhere
            console.log("Authorization Response:", authorizationResponse)
            navigate(`/lobby`)
        } catch(e) {
            alert("Failed to join session:" + e)
        }
    }

    const onHostBegin = async (name: string) => {
        console.debug(`Hosting lobby with name '${name}'`)
        try {
            const authorizationResponse = await postHostQuiz(name)
            // TODO: Store the JWT token somewhere
            console.log("Authorization Response:", authorizationResponse)
            navigate(`/config`)
        } catch(e) {
            alert("Failed to host session:" + e)
        }
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
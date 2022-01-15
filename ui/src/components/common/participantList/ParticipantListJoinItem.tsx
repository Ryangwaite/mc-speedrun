import { Button, Card, TextField, Typography } from "@mui/material";
import { useState } from "react";
import theme from "../../../themes/theme";

interface IParticipantListJoinItemProps {
    initialUsername: string,
    userJoined: boolean,
    onJoin: (name: string) => void
}

function ParticipantListJoinItem(props: IParticipantListJoinItemProps) {

    const { initialUsername, userJoined, onJoin } = props;

    const [nameField, setNameField] = useState(initialUsername);

    function onFieldChange(event: React.ChangeEvent<HTMLInputElement>) {
        const value = event.target.value
        setNameField(value)
    }

    function onKeyDown(event: React.KeyboardEvent) {
        if ((event.code === "Enter" || event.code === "NumpadEnter") && nameField) {
            event.preventDefault()
            onJoin(nameField)
        }
    }

    let content = userJoined ? (
        <Typography
            variant="h6"
            textAlign="center"
            margin={0}
            padding={3}
            width="100%"
        >{nameField}</Typography>
    ) : (
        <>
            <TextField
                id="outlined-basic"
                label="name"
                onChange={onFieldChange}
                onKeyDown={onKeyDown}
                sx={{
                    marginTop: 3,
                    marginBottom: 3,
                    marginLeft: 3,
                    marginRight: 4,
                }}
            />
            <Button
                disabled={!nameField}
                onClick={() => onJoin(nameField)}
                variant="contained"
                sx={{
                    marginRight: 3,
                    flexGrow: 1,
                }} 
            >Join</Button>
        </>
    )

    return (
        <Card
            sx={{
                display: "flex",
                alignItems: "center",
                backgroundColor: theme.palette.primary[50],
                width: "100%",
            }}
        >
            {content}
        </Card>
    )
}

export default ParticipantListJoinItem

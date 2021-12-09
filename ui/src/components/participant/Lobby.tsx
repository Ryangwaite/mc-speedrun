import React, { useState } from "react";
import { Button, Box, TextField, ListItem, ListItemText, Container, Typography} from "@mui/material";
import ParticipantList from "../common/ParticipantList";
import { useAppDispatch, useAppSelector } from "../../hooks";
import { selectUsername, setUsername } from "../../slices/participant";

interface IJoinListItemProps {
    listItemKey: string,
    userJoined: boolean,
    onJoin: (name: string) => void
}

function JoinListItem(props: IJoinListItemProps) {

    const [nameField, setNameField] = useState("");

    function onFieldChange(event: React.ChangeEvent<HTMLInputElement>) {
        const value = event.target.value
        setNameField(value)
        console.debug(`Name field changed to '${value}'`)
    }

    function onJoinClicked() {
        props.onJoin(nameField);
        console.debug(`Join clicked with '${nameField}'`)
    }

    const { listItemKey, userJoined } = props;

    const content = userJoined ?
        <ListItemText primary={nameField} /> :
        <Container
            sx={{
                display: "flex",
                alignItems: "baseline"
            }}
        >
            <TextField
                fullWidth
                id="outlined-basic"
                label="name"
                onChange={onFieldChange}
            />
            <Button
                disabled={!nameField}
                onClick={onJoinClicked}
                variant="contained"
                sx={{
                    margin: 2
                }}
            >JOIN</Button>
        </Container>

    return (
        <ListItem
            key={listItemKey}
            sx={{
                border: "1px solid green", // TODO: properly style this
            }}
        >
            {content}
        </ListItem>
    )
}

interface ILobbyProps {
    // participants // will add this eventually
}

function Lobby(props: ILobbyProps) {

    // Whether the user has entered their name and pressed the "JOIN" button
    const [userJoined, setUserJoined] = useState(false)

    const dispatch = useAppDispatch()

    function onJoin(name: string) {
        setUserJoined(true)
        dispatch(setUsername(name))
    }

    const participants: Set<string> = new Set(Array.from(Array(150).keys()).map(x => `participant ${x}`))

    let joinListItem = <JoinListItem
        userJoined={userJoined}
        listItemKey={"joinListItem"}  // NOTE: probably come up with a better key than this
        onJoin={onJoin} 
    />;

    return (
        <Box
            display="flex"
            flexDirection="column"
            justifyContent="flex-start"
            alignItems="center"
            height="100%"
            sx={{
                overflowY: "auto"
            }}
        >
            <Typography>Waiting for host to start...</Typography>

            <ParticipantList
                thisParticipant={joinListItem}
                otherParticipants={participants}
            />
        </Box>
    )
}

export default Lobby;
import React, { useState } from "react";
import { Button, Box, TextField, ListItem, ListItemText, Container, Typography} from "@mui/material";
import ParticipantList from "../common/ParticipantList";
import { useAppDispatch, useAppSelector } from "../../hooks";
import { selectUserId, setUsername } from "../../slices/participant";
import { selectLeaderboard } from "../../slices/common";

interface IJoinListItemProps {
    listItemKey: string,
    userJoined: boolean,
    onJoin: (name: string) => void
}

function JoinListItem(props: IJoinListItemProps) {

    const { listItemKey, userJoined, onJoin } = props;

    const [nameField, setNameField] = useState("");

    function onFieldChange(event: React.ChangeEvent<HTMLInputElement>) {
        const value = event.target.value
        setNameField(value)
        console.debug(`Name field changed to '${value}'`)
    }

    function onKeyDown(event: React.KeyboardEvent) {
        if ((event.code === "Enter" || event.code === "NumpadEnter") && nameField) {
            event.preventDefault()
            onJoin(nameField)
        }
    }

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
                onKeyDown={onKeyDown}
            />
            <Button
                disabled={!nameField}
                onClick={() => onJoin(nameField)}
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

    const leaderboard = useAppSelector(state => selectLeaderboard(state))
    const userId = useAppSelector(state => selectUserId(state))

    const otherParticipants = leaderboard.filter(participant => participant.userId !== userId)
    
    function onJoin(name: string) {
        setUserJoined(true)
        dispatch(setUsername(name))
    }

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
                otherParticipants={otherParticipants}
            />
        </Box>
    )
}

export default Lobby;
import React, { useState } from "react";
import { Box, Typography} from "@mui/material";
import ParticipantList from "../components/common/participantList/ParticipantList";
import ParticipantListJoinItem from "../components/common/participantList/ParticipantListJoinItem";
import { useAppDispatch, useAppSelector } from "../hooks";
import { selectLeaderboard } from "../slices/common";
import { selectUserId, selectUsername, setUsername } from "../slices/participant";
import theme, { scrollbarMixin, COLUMN_MARGIN_TOP } from "../themes/theme";

interface ILobbyProps {
    // participants // will add this eventually
}

function Lobby(props: ILobbyProps) {

    // Whether the user has entered their name and pressed the "JOIN" button
    const [userJoined, setUserJoined] = useState(false)

    const dispatch = useAppDispatch()

    const leaderboard = useAppSelector(state => selectLeaderboard(state))
    const userId = useAppSelector(state => selectUserId(state))
    const username = useAppSelector(state => selectUsername(state)) || ""

    const otherParticipants = leaderboard.filter(participant => participant.userId !== userId)
    
    function onJoin(name: string) {
        setUserJoined(true)
        dispatch(setUsername(name))
    }

    return (
        <Box
            display="flex"
            flexDirection="column"
            justifyContent="flex-start"
            alignItems="center"
            height="100%"
            sx={{
                overflowY: "auto",
                ...scrollbarMixin,
            }}
        >
            <Typography
                variant="h6"
                margin={3}
                marginTop={COLUMN_MARGIN_TOP}
                padding={0}
            >Waiting for host to start...</Typography>

            <ParticipantList
                sx={{
                    width: "100%",
                    maxWidth: theme.spacing(50),
                    padding: 0,
                    paddingLeft: 3,
                    paddingRight: 3,
                }}
                thisParticipant={
                    <ParticipantListJoinItem
                        key={otherParticipants.length + 1}
                        username={username}
                        userJoined={userJoined}
                        onJoin={onJoin}
                    />
                }
                otherParticipants={otherParticipants}
            />
        </Box>
    )
}

export default Lobby;
import React, { useState } from "react";
import { Box, Typography} from "@mui/material";
import ParticipantList from "../common/participantList/ParticipantList";
import { useAppDispatch, useAppSelector } from "../../hooks";
import { selectUserId, selectUsername, setUsername } from "../../slices/participant";
import { selectLeaderboard } from "../../slices/common";
import ParticipantListJoinItem from "../common/participantList/ParticipantListJoinItem";
import theme, { COLUMN_MARGIN_TOP, scrollbarMixin } from "../../themes/theme";
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
                    width: theme.spacing(50),
                    padding: 0,
                }}
                thisParticipant={
                    <ParticipantListJoinItem
                        key={otherParticipants.length + 1}
                        initialUsername={username}
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
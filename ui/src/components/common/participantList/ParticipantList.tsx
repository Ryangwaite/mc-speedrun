import { List, ListItem, SxProps, Theme } from "@mui/material";
import { ILeaderboardItem } from "../../../types";
import ParticipantListItem from "./ParticipantListItem";

interface IParticipantListProps {
    sx?: SxProps<Theme>,
    thisParticipant?: React.ReactElement,
    otherParticipants: ILeaderboardItem[],
}

export default function ParticipantList(props: IParticipantListProps) {

    const participantItems = props.otherParticipants.map(participant => (
        <ListItem
            key={participant.userId}
            sx={{
                padding: 0,
                marginBottom: 2,
            }}
        >
            <ParticipantListItem name={participant.name} />
        </ListItem>
    ));

    if (props.thisParticipant) {
        // Prepend this user to the top of participants
        participantItems.unshift(
            <ListItem
                key={"this_participant"}
                sx={{
                    padding: 0,
                    marginBottom: 2,
                }}
            >
                {props.thisParticipant}
            </ListItem>
        )
    }
    

    return (
        <List
            sx={props.sx}
        >
            {participantItems}
        </List>
    )
}
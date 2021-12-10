import { List, ListItem, ListItemText } from "@mui/material";
import { ILeaderboardItem } from "../../types";

interface IParticipantListProps {
    thisParticipant: React.ReactElement | null,
    otherParticipants: ILeaderboardItem[],
}

export default function ParticipantList(props: IParticipantListProps) {

    const otherParticipantItems = props.otherParticipants.map(participant => (
        <ListItem
            key={participant.userId}
        >
            <ListItemText primary={participant.name} />
        </ListItem>
    ));

    return (
        <List>
            {props.thisParticipant}
            {otherParticipantItems}
        </List>
    )
}
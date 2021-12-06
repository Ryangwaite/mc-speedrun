import { List, ListItem, ListItemText } from "@mui/material";

interface IParticipantListProps {
    thisParticipant: React.ReactElement | null,
    otherParticipants: Set<string>
}

export default function ParticipantList(props: IParticipantListProps) {

    const otherParticipantItems = Array.from(props.otherParticipants.values(), participant => (
        <ListItem
            key={participant}
        >
            <ListItemText primary={participant} />
        </ListItem>
    ));

    return (
        <List>
            {props.thisParticipant}
            {otherParticipantItems}
        </List>
    )
}
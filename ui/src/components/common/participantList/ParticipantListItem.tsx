import { Card, Typography } from "@mui/material";

interface IParticipantListItemProps {
    name: string,
}

function ParticipantListItem(props: IParticipantListItemProps) {
    return (
        <Card
            sx={{
                width: "100%",
            }}
        >
            <Typography
                variant="h6"
                textAlign="center"
                margin={0}
                padding={3}
            >{props.name}</Typography>
        </Card>
    )
}

export default ParticipantListItem
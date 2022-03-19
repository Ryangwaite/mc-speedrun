import { Card, Divider, ListItem, ListItemAvatar, ListItemText, Typography } from "@mui/material";
import theme from "../../../themes/theme";
import { ILeaderboardItem } from "../../../types";
import { getOrdinal } from "../../../utilities";
import LeaderBoardItemScore from "./LeaderboardItemScore";

export interface ILeaderBoardItemProps {
    item: ILeaderboardItem,
    position: number,
    selected: boolean,
}

export function LeaderBoardItem(props: ILeaderBoardItemProps) {

    const {name, score} = props.item;
    const {position, selected} = props
    const positionString = `${position}${getOrdinal(position as number)}`

    return (
        <Card
            sx={{
                marginBottom: "10px",
                background: selected ? theme.palette.primary[50] : undefined // A random light green colour only first selected
            }}
        >
            <ListItem
                secondaryAction={<LeaderBoardItemScore score={score} />}
                sx={{
                    padding: 3,
                }}
            >
                <ListItemAvatar
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-evenly",
                    }}
                >
                    <Typography
                        textAlign="center"
                        variant="h5"
                        marginRight={1.5}
                    >{positionString}</Typography>
                    <Divider flexItem orientation="vertical" />
                </ListItemAvatar>
                <ListItemText
                    primary={<Typography variant="h6">{name}</Typography>}
                    sx={{
                        marginLeft: 1.5,
                    }}
                />
            </ListItem>
        </Card>
    )
}
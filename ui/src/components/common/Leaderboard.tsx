import { Box, Card, Container, Divider, List, ListItem, ListItemAvatar, ListItemText, Typography } from "@mui/material";
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import { getOrdinal } from "../../utilities";
import { ILeaderboardItem } from "../../types";

interface ILeaderBoardItemScoreProps {
    score: number,
}

function LeaderBoardItemScore(props: ILeaderBoardItemScoreProps) {
    const borderDiameter = "58px"
    return (
        <Container
            sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                border: "5px solid green",
                borderRadius: "50%", // Circular border
                width: borderDiameter,
                height: borderDiameter,
            }}
        >
            <Typography
                variant="body1"
                fontWeight="bold"
            >{props.score}</Typography>
        </Container>
    )
}

interface ILeaderBoardItemProps {
    key: number,
    item: ILeaderboardItem,
    position: number,
    selected: boolean,
}

function LeaderBoardItem(props: ILeaderBoardItemProps) {

    const {name, score} = props.item;
    const {position, selected} = props
    const positionString = `${position}${getOrdinal(position as number)}`

    return (
        <Card
            sx={{
                marginBottom: "10px",
                background: selected ? "#e3ffe3" : undefined // A random light green colour only first selected
            }}
            key={props.key}
        >
            <ListItem
                secondaryAction={<LeaderBoardItemScore score={score} />}
                sx={{
                    paddingTop: "20px",
                    paddingBottom: "20px",
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
                    >{positionString}</Typography>
                    <Divider flexItem orientation="vertical" />
                </ListItemAvatar>
                <ListItemText
                    primary={name}
                />
            </ListItem>
        </Card>
    )
}

interface ILeaderBoardOmissionProps {
    key: number
}

function LeaderBoardOmission(props: ILeaderBoardOmissionProps) {
    return (
        <ListItem
            key={props.key}
            sx={{
                paddingTop: "20px",
                paddingBottom: "20px",
                display: "flex",
                justifyContent: "center"
            }}
        >
            <MoreHorizIcon />
        </ListItem>
    )
}

interface ILeaderBoardProps {
    items: ILeaderboardItem[],
    selectedUserId: string,
}

class LeaderBoardOmissionToken {}

export function LeaderBoard(props: ILeaderBoardProps) {

    /**
     * Only show a subset of the leaderboard. The top 2, bottom 2 and the users current
     * position +/-1. Gaps are rendered with a "...". There's 9 slots total. No omitting
     * will be done if there's <= 9 items.
     */
    const { items, selectedUserId } = props
    items.sort((a: ILeaderboardItem, b: ILeaderboardItem) => b.score - a.score) // sort highest to lowest

    let renderInstructions: ({item: ILeaderboardItem, position: number}|LeaderBoardOmissionToken)[] = []
    if (items.length <= 9) {
        renderInstructions = items.map((item, index) => ({item: item, position: index + 1}));
    } else {
        const participantIndex = items.findIndex(x => x.userId === selectedUserId)
        let renderIndexes = []
        // Always show first two...
        renderIndexes.push(0, 1)
        // ... and Participant position and one on either side
        if (participantIndex - 1 > 0) renderIndexes.push(participantIndex - 1)
        renderIndexes.push(participantIndex)
        if (participantIndex + 1 < items.length - 1) renderIndexes.push(participantIndex + 1)
        // ... and the last two
        renderIndexes.push(items.length - 2, items.length - 1)

        // Remove duplicate indexes
        let uniqueIndexes = Array.from(new Set(renderIndexes)).sort((a, b) => a - b)

        // Build the instructions
        let i = 0
        while (i < uniqueIndexes.length) {
            let currentIndex = uniqueIndexes[i]
            let currentLeaderboardItem = items[currentIndex]
            renderInstructions.push({
                item: currentLeaderboardItem,
                position: currentIndex + 1
            });
            
            // Determine if we need a "..." row between this entry and the next
            let nextIndex = i + 1 < uniqueIndexes.length ? uniqueIndexes[i+1] : null
            if (nextIndex && nextIndex - currentIndex > 1) {
                renderInstructions.push(new LeaderBoardOmissionToken())
            }
            i++
        }
    }
    
    const elements = renderInstructions.map((value, index) => {
        if (value instanceof LeaderBoardOmissionToken) {
            return <LeaderBoardOmission key={index} />
        } else {
            return <LeaderBoardItem key={index} selected={value.item.userId === selectedUserId} {...value} />
        }
    })

    return (
        <List>
            {elements}
        </List>
    )
}

export const LEADERBOARD_COLUMN_WIDTH = "300px"

export function LeaderboardColumn(props: ILeaderBoardProps) {

    return (
        <Box
            // Position on the rhs
            position="absolute"
            top="0"
            right="0"
            bottom="0"
            width={LEADERBOARD_COLUMN_WIDTH}
            marginRight="12px"
            sx={{
                overflowY: "auto",
            }}
        >
            <Typography variant="h4">Leaderboard</Typography>
            <LeaderBoard {...props} />
        </Box>
    )
}
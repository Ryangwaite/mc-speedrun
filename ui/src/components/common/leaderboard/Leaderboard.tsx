import { Box, List } from "@mui/material";

import { ILeaderboardItem } from "../../../types";
import _ from "lodash";
import LeaderBoardItem from "./LeaderboardItem";
import LeaderBoardOmission from "./LeaderboardOmission";

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
    const selectedUserId = props.selectedUserId

    // 
    const items = _.sortBy(props.items, x => x.score).reverse()
    // items.sort((a: ILeaderboardItem, b: ILeaderboardItem) => b.score - a.score) // sort highest to lowest

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

export const LEADERBOARD_COLUMN_WIDTH = "340px"

export function PositionedLeaderboard(props: ILeaderBoardProps) {

    return (
        <Box
            // Position on the rhs
            position="absolute"
            top="0"
            right="0"
            bottom="0"
            width={LEADERBOARD_COLUMN_WIDTH}
            sx={{
                overflowY: "auto",
                margin: 3,
            }}
        >
            <LeaderBoard {...props} />
        </Box>
    )
}
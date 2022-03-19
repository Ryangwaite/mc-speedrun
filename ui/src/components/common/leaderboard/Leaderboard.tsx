import { List } from "@mui/material";

import { ILeaderboardItem } from "../../../types";
import _ from "lodash";
import {LeaderBoardItem} from "./LeaderboardItem";
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

    const items = _.sortBy(props.items, x => x.score).reverse()

    let renderInstructions: ({item: ILeaderboardItem, position: number}|LeaderBoardOmissionToken)[] = []
    if (items.length <= 9) {
        renderInstructions = items.map((item, index) => ({item: item, position: index + 1}));
    } else {
        const renderIndexes = getRenderIndexes(items, selectedUserId)
        // Build the instructions
        let i = 0
        while (i < renderIndexes.length) {
            let currentIndex = renderIndexes[i]
            let currentLeaderboardItem = items[currentIndex]
            renderInstructions.push({
                item: currentLeaderboardItem,
                position: currentIndex + 1
            });
            
            // Determine if we need a "..." row between this entry and the next
            let nextIndex = i + 1 < renderIndexes.length ? renderIndexes[i+1] : null
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
        <List
            disablePadding
        >
            {elements}
        </List>
    )
}

export const LEADERBOARD_COLUMN_WIDTH = "340px"

/**
 * Determines the list of leaderboard indexes to
 * render when there's more to show than space available.
 * The threshold is 9.
 * 
 * @returns list of leaderboard indexes to render
 */
function getRenderIndexes(items: readonly ILeaderboardItem[], selectedUserId: string): number[] {
    let renderIndexes: number[] = []

    const participantIndex = items.findIndex(x => x.userId === selectedUserId)
    
    if (participantIndex < 5) {
        // Participant is in the leading pack - show first 6...
        renderIndexes.push(..._.range(0, 6))
        // ... and the two in last place
        renderIndexes.push(items.length - 2, items.length - 1)
    } else if (participantIndex > items.length - 6) {
        // Participant is in the trailing pack - show two at front...
        renderIndexes.push(0, 1)
        // ... and 6 in last place
        renderIndexes.push(..._.range(items.length - 6, items.length))
    } else {
        // Participant is middle of the pack - always show first two...
        renderIndexes.push(0, 1)
        // ... and Participant position and one on either side ...
        renderIndexes.push(participantIndex - 1)
        renderIndexes.push(participantIndex)
        renderIndexes.push(participantIndex + 1)
        // ... and the last two
        renderIndexes.push(items.length - 2, items.length - 1)
    }

    return renderIndexes
}
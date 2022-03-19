import { ListItem } from "@mui/material";
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';

interface ILeaderBoardOmissionProps {}

function LeaderBoardOmission(props: ILeaderBoardOmissionProps) {
    return (
        <ListItem
            sx={{
                paddingTop: "20px",
                paddingBottom: "20px",
                display: "flex",
                justifyContent: "center"
            }}
        >
            <MoreHorizIcon titleAccess="omitted leaderboard items" />
        </ListItem>
    )
}

export default LeaderBoardOmission
import { ListItem } from "@mui/material";
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';

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

export default LeaderBoardOmission
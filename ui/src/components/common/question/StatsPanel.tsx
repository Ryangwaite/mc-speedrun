import { Box, List, ListItem, ListItemText, Tooltip, Typography } from "@mui/material";
import { IQuestionAnswerStats } from "../../../const";
import theme from "../../../themes/theme";
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import AccessAlarmIcon from '@mui/icons-material/AccessAlarm';

interface IQuestionStatsTooltipContentProps {
    type:
    "Correctly answered by" |
    "Incorrectly answered by" |
    "Time expired for",
    names: string[]
}

function QuestionStatsTooltipContent(props: IQuestionStatsTooltipContentProps) {

    const { type, names } = props

    const content = <>
        <Typography variant="body1">{type}:</Typography>
        <ul
            style={{
                paddingLeft: theme.spacing(3),
            }}
        >
            {names.map((value, index) => <li key={index}>
                <Typography variant="body2">{value}</Typography>
            </li>)}
        </ul>
    </>

    return (
        <Box
            margin={1.5}
        >
            {content}
        </Box>
    )
}

interface IQuestionStatsPanelProps {
    answerStats: IQuestionAnswerStats
}

function QuestionStatsPanel(props: IQuestionStatsPanelProps) {

    const { correctAnswerers, incorrectAnswerers, timeExpiredAnswerers } = props.answerStats;

    return (
        <List
            dense
            sx={{
                margin: 3,
                padding: 0,
            }}
        >
            <Tooltip
                title={
                    <QuestionStatsTooltipContent
                        type="Correctly answered by"
                        names={correctAnswerers}
                    />
                }
                arrow
                placement="right"
            >
                <ListItem>
                    <CheckCircleOutlinedIcon
                        sx={{
                            color: theme.palette.success[900],
                            marginRight: 1.5,
                        }}
                    />
                    <ListItemText
                        primary={correctAnswerers.length}
                    />
                </ListItem>
            </Tooltip>
            <Tooltip
                title={
                    <QuestionStatsTooltipContent
                        type="Incorrectly answered by"
                        names={incorrectAnswerers}
                    />
                }
                arrow
                placement="right"
                
            >
                <ListItem>
                    <CancelOutlinedIcon
                        sx={{
                            color: theme.palette.error[900],
                            marginRight: 1.5,
                        }}
                    />
                    <ListItemText
                        primary={incorrectAnswerers.length}
                    />
                </ListItem>
            </Tooltip>
            <Tooltip
                title={
                    <QuestionStatsTooltipContent
                        type="Time expired for"
                        names={timeExpiredAnswerers}
                    />
                }
                arrow
                placement="right"
            >
                <ListItem>
                    <AccessAlarmIcon
                        sx={{
                            color: theme.palette.grey[900],
                            marginRight: 1.5,
                        }}
                    />
                    <ListItemText
                        primary={timeExpiredAnswerers.length}
                    />
                </ListItem>
            </Tooltip>
        </List>
    )
}

export default QuestionStatsPanel
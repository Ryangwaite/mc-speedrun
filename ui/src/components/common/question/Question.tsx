import {
    Card, Typography, CardContent, CardActions,
    List, ListItem, ListItemIcon, ListItemText, Container, Tooltip, Divider,
} from "@mui/material";
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import AccessAlarmIcon from '@mui/icons-material/AccessAlarm';
import { IQuestionAnswerStats } from "../../../const";
import Option, { OptionMode } from "./Option";
import theme from "../../../themes/theme";

interface IQuestionStatsTooltipContentProps {
    type:
        "Correctly answered by" |
        "Incorrectly answered by" |
        "Time expired for",
    names: string[]
}

function QuestionStatsTooltipContent(props: IQuestionStatsTooltipContentProps) {

    const {type, names} = props

    return (
        <Container>
            <Typography variant="subtitle1">{type}:</Typography>
            <ul>
                {names.map((value, index) => <li key={index}>{value}</li>)}
            </ul>
        </Container>
    )
}

interface IQuestionStatsPanelProps {
    answerStats: IQuestionAnswerStats
}

function QuestionStatsPanel(props: IQuestionStatsPanelProps) {

    const {correctAnswerers, incorrectAnswerers, timeExpiredAnswerers} = props.answerStats;

    return (
        <List
            dense
            sx={{
                minWidth: "128px"
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
                    <ListItemIcon>
                        <CheckCircleOutlinedIcon sx={{color: theme.palette.success[900]}} />
                    </ListItemIcon>
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
                    <ListItemIcon>
                        <CancelOutlinedIcon sx={{color: theme.palette.error[900]}} />
                    </ListItemIcon>
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
                    <ListItemIcon>
                        <AccessAlarmIcon sx={{color: theme.palette.grey[900]}} />
                    </ListItemIcon>
                    <ListItemText
                        primary={timeExpiredAnswerers.length}
                    />
                </ListItem>
            </Tooltip>
        </List>
    )
}

interface IQuestionCardWithStatsProps {
    question: string,
    numCorrectOptions: number,
    options: {
        text: string,
        mode: OptionMode,
    }[],
    answerStats: IQuestionAnswerStats
}

export function QuestionCardWithStats(props: IQuestionCardWithStatsProps) {

    const {question, numCorrectOptions, options} = props

    const optionElements = options.map((option, index) => {
        return <Option text={option.text} choiceLabel={String.fromCharCode(65 + index) + ")"} mode={option.mode} />
    })

    return (
        <Card
            variant="outlined"
            sx={{
                display: "flex",
                alignItems: "center"
            }}
        >
            <Container>
                <CardContent>
                    <Typography variant="h5">{question}</Typography>
                    <Typography variant="caption" color="text.secondary">Select {numCorrectOptions}</Typography>
                </CardContent>
                <CardActions
                    sx={{
                        display: "flex",
                        justifyContent: "space-evenly",
                        margin: "8px"
                    }}
                >
                    {optionElements}
                </CardActions>
            </Container>
            <Divider flexItem orientation="vertical"/>
            <QuestionStatsPanel {...props}/>
        </Card>
    )
}
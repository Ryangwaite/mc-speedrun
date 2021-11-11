import {
    Card, Typography, Box, CardContent, CardActions,
    List, ListItem, ListItemIcon, ListItemText, Container, Tooltip, Divider,
} from "@mui/material";
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import CircleOutlinedIcon from '@mui/icons-material/CircleOutlined';
import AccessAlarmIcon from '@mui/icons-material/AccessAlarm';
import { IQuestionAnswerStats } from "../const";

export enum OptionMode {
    PLAIN,                              // When no answer has been selected and it hasn't been marked
    SELECTED_UNMARKED,                  // When an option has been selected but not yet been marked
    SELECTED_AND_MARKED_CORRECT,        // when an option has been selected and marked as correct
    SELECTED_AND_MARKED_INCORRECT,      // When an option has been selected but it was incorrect
    UNSELECTED_AND_MARKED_CORRECT,      // When an option was not selected but it is correct
}

interface IOptionProps {
    text: string,
    choiceLabel: string,  // e.g. "a)"
    mode: OptionMode,
    onClick?: () => void                    // Only applies to 'PLAIN' and 'SELECTED_UNMARKED' modes
}

function Option(props: IOptionProps) {

    const { text, choiceLabel, mode, onClick } = props;

    switch (mode) {
        case OptionMode.PLAIN:
            return (
                <Box
                    display="flex"
                    justifyContent="center"
                    alignItems="center"
                    onClick={onClick}
                >
                    <Typography
                        variant="body1"
                        sx={{userSelect: "none"}} // Dont display text highlight for copy-paste onclick
                    >{choiceLabel} {text}</Typography>
                </Box>
            )
        case OptionMode.SELECTED_UNMARKED:
            return (
                <Box
                    display="flex"
                    justifyContent="center"
                    alignItems="center"
                    onClick={onClick}
                >
                    <Typography
                        variant="body1"
                        sx={{
                            border: "1px solid green",
                            userSelect: "none", // Dont display text highlight for copy-paste onclick
                        }}
                    >{choiceLabel} {text}</Typography>
                </Box>
            )
        case OptionMode.SELECTED_AND_MARKED_CORRECT:
            return (
                <Box
                    display="flex"
                    justifyContent="center"
                    alignItems="center"
                >
                    <Typography
                        variant="body1"
                        sx={{
                            border: "1px solid green",
                            background: "green",
                            userSelect: "none", // Dont display text highlight for copy-paste onclick
                        }}
                    >{choiceLabel} {text}</Typography>
                    <CheckCircleOutlinedIcon sx={{color: "green"}} />
                </Box>
            )
        case OptionMode.SELECTED_AND_MARKED_INCORRECT:
            return (
                <Box
                    display="flex"
                    justifyContent="center"
                    alignItems="center"
                >
                    <Typography
                        variant="body1"
                        sx={{
                            border: "1px solid red",
                            userSelect: "none", // Dont display text highlight for copy-paste onclick
                        }}
                    >{choiceLabel} {text}</Typography>
                    <CancelOutlinedIcon sx={{color: "red"}} />
                </Box>
            )
        case OptionMode.UNSELECTED_AND_MARKED_CORRECT:
            return (
                <Box
                    display="flex"
                    justifyContent="center"
                    alignItems="center"
                >
                    <Typography
                        variant="body1"
                        sx={{
                            border: "1px solid green",
                            userSelect: "none", // Dont display text highlight for copy-paste onclick
                        }}
                    >{choiceLabel} {text}</Typography>
                    <CircleOutlinedIcon fontSize="small" sx={{color: "green"}} />
                </Box>
            )
        default:
            throw new Error(`Invalid Option mode '${mode}'`)
    }
}

interface IQuestionCardProps {
    question: string,
    numCorrectOptions: number,
    options: {
        text: string,
        mode: OptionMode
    }[],
    onOptionClicked?: (optionIndex: number) => void,
}

export function QuestionCard(props: IQuestionCardProps) {
    const { question, options, numCorrectOptions, onOptionClicked} = props

    return (
        <Card
            variant="outlined"
        >
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
                {options.map((option, index) => (
                    <Option
                        key={index}
                        text={option.text}
                        choiceLabel={String.fromCharCode(65 + index) + ")"}
                        onClick={onOptionClicked ? () => onOptionClicked(index) : undefined}
                        mode={option.mode}
                    />))
                }
            </CardActions>
        </Card>
    )
}

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
                        <CheckCircleOutlinedIcon sx={{color: "green"}} />
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
                        <CancelOutlinedIcon sx={{color: "red"}} />
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
                        <AccessAlarmIcon sx={{color: "grey"}} />
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
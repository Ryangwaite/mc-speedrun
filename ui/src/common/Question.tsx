import React from "react";
import {
    Card, Typography, Box, CardContent, CardActions,
    List, ListItem, ListItemIcon, ListItemText, Container, Tooltip, Divider,
} from "@mui/material";
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import CircleOutlinedIcon from '@mui/icons-material/CircleOutlined';
import AccessAlarmIcon from '@mui/icons-material/AccessAlarm';
import { IQuestionAnswerStats } from "../const";

enum OptionMode {
    PLAIN,                              // When no answer has been selected and it hasn't been marked
    SELECTED_UNMARKED,                  // When an option has been selected but not yet been marked
    SELECTED_AND_MARKED_CORRECT,        // when an option has been selected and marked as correct
    SELECTED_AND_MARKED_INCORRECT,      // When an option has been selected but it was incorrect
    UNSELECTED_AND_MARKED_CORRECT,      // When an option was not selected but it is correct
}

interface IOptionProps {
    text: string,
    selectable: boolean, // Whether the option is selectable i.e. when participant selecting it as a correct answer
    choiceLabel: string,  // e.g. "a)"
    initialMode?: OptionMode,
    onClick?: (isSelected: boolean) => void                    // Only applies to 'PLAIN' and 'SELECTED_UNMARKED' modes
}

interface IOptionState {
    mode: OptionMode
}

class Option extends React.Component<IOptionProps, IOptionState> {
    constructor(props: IOptionProps) {
        super(props);
        this.state = {
            mode: this.props.initialMode === undefined ? OptionMode.PLAIN : this.props.initialMode
        };

        this.toggleOptionSelection = this.toggleOptionSelection.bind(this);
    }

    /**
     * Toggles the option between 'PLAIN' and 'SELECTED_UNMARKED'.
     * 
     * Invokes the 'onClick' prop with the updated selection state of the button
     * post toggle.
     */
    toggleOptionSelection() {
        if (this.props.selectable) {
            this.setState((state, props) => {         
                const updatedMode = state.mode === OptionMode.PLAIN ? OptionMode.SELECTED_UNMARKED : OptionMode.PLAIN;
                if (props.onClick) {
                    props.onClick(updatedMode === OptionMode.SELECTED_UNMARKED)
                }
                return {mode: updatedMode}
            })
        }
    }

    render() {
        // const { mode } = this.state;
        const { text, choiceLabel } = this.props;

        switch (this.state.mode) {
            case OptionMode.PLAIN:
                return (
                    <Box
                        display="flex"
                        justifyContent="center"
                        alignItems="center"
                        onClick={() => this.toggleOptionSelection()}
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
                        onClick={() => this.toggleOptionSelection()}
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
                throw new Error(`Invalid Option mode '${this.state.mode}'`)
        }
    }
}

interface IQuestionCardProps {
    question: string,
    options: string[],
    correctAnswers: number[],
}

interface IQuestionCardState {}

export class QuestionCard extends React.Component<IQuestionCardProps, IQuestionCardState> {
    constructor(props: IQuestionCardProps) {
        super(props);
        this.state = {}
    }

    render() {
        const { question, options, correctAnswers} = this.props

        

        return (
            <Card
                variant="outlined"
            >
                <CardContent>
                    <Typography variant="h5">{question}</Typography>
                    <Typography variant="caption" color="text.secondary">Select {correctAnswers.length}</Typography>
                </CardContent>
                <CardActions
                    sx={{
                        display: "flex",
                        justifyContent: "space-evenly",
                        margin: "8px"
                    }}
                >
                    {options.map((option, index) => <Option selectable={true} text={option} choiceLabel={String.fromCharCode(65 + index) + ")"} />)}
                </CardActions>
            </Card>
        )
    }
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

interface IQuestionCardWithStatsProps extends IQuestionCardProps {
    participantAnswers: number[],
    answerStats: IQuestionAnswerStats
}

export function QuestionCardWithStats(props: IQuestionCardWithStatsProps) {

    const {question, options, correctAnswers, participantAnswers} = props

    const optionElements = options.map((option, index) => {

        // Determine initial label
        let initialMode = undefined
        if (correctAnswers.includes(index)) {
            // Find out of the user choose it
            if (participantAnswers?.includes(index)) {
                initialMode = OptionMode.SELECTED_AND_MARKED_CORRECT
            } else {
                initialMode = OptionMode.UNSELECTED_AND_MARKED_CORRECT
            }
        } else if (participantAnswers?.includes(index)) {
            // This option is not correct but the participant selected it
            initialMode = OptionMode.SELECTED_AND_MARKED_INCORRECT
        } // else dont provide an initialLabel since this is unmarked so will toggle between "PLAIN" and "SELECTED_UNMARKED"

        return <Option selectable={false} text={option} choiceLabel={String.fromCharCode(65 + index) + ")"} initialMode={initialMode} />
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
                    <Typography variant="caption" color="text.secondary">Select {correctAnswers.length}</Typography>
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
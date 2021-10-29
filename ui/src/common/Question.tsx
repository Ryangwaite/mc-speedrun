import React from "react";
import { Card, Button, Grid, Typography, Box, Link, FormGroup, FormControlLabel, Checkbox, TextField, CardContent, CardActions} from "@mui/material";
import { margin } from "@mui/system";
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import CircleOutlinedIcon from '@mui/icons-material/CircleOutlined';

enum OptionMode {
    PLAIN,                              // When no answer has been selected and it hasn't been marked
    SELECTED_UNMARKED,                  // When an option has been selected but not yet been marked
    SELECTED_AND_MARKED_CORRECT,        // when an option has been selected and marked as correct
    SELECTED_AND_MARKED_INCORRECT,      // When an option has been selected but it was incorrect
    UNSELECTED_AND_MARKED_CORRECT,      // When an option was not selected but it is correct
}

interface IOptionProps {
    text: string,
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
        this.setState((state, props) => {         
            const updatedMode = state.mode === OptionMode.PLAIN ? OptionMode.SELECTED_UNMARKED : OptionMode.PLAIN;
            if (props.onClick) {
                props.onClick(updatedMode === OptionMode.SELECTED_UNMARKED)
            }
            return {mode: updatedMode}
        })
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
                        <Typography variant="body1">{choiceLabel} {text}</Typography>
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
                                border: "1px solid green"
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
                                background: "green"
                            }}
                        >{choiceLabel} {text}</Typography>
                        <CheckCircleOutlinedIcon sx={{color: "green"}} /> :
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
                            }}
                        >{choiceLabel} {text}</Typography>
                        <CancelOutlinedIcon sx={{color: "red"}} /> :
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
                            }}
                        >{choiceLabel} {text}</Typography>
                        <CircleOutlinedIcon fontSize="small" sx={{color: "green"}} /> :
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
    answers: number[],
}

interface IQuestionCardState {}

export class QuestionCard extends React.Component<IQuestionCardProps, IQuestionCardState> {
    constructor(props: IQuestionCardProps) {
        super(props);
        this.state = {}
    }

    render() {
        const { question, options, answers } = this.props

        return (
            <Card
                variant="outlined"
                sx={{
                    margin: "40px"
                }}
            >
                <CardContent>
                    <Typography variant="h5">{question}</Typography>
                    <Typography variant="caption" color="text.secondary">Select {answers.length}</Typography>
                </CardContent>
                <CardActions
                    sx={{
                        display: "flex",
                        justifyContent: "space-evenly",
                        margin: "8px"
                    }}
                >
                        {options.map((option, index) => <Option text={option} choiceLabel={String.fromCharCode(65 + index) + ")"} />)}
                </CardActions>
            </Card>
        )
    }
}
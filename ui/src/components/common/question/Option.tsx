import CircleOutlinedIcon from '@mui/icons-material/CircleOutlined';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import { Box, Stack, Typography } from "@mui/material";
import theme from '../../../themes/theme';

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

    const iconSize = "small"

    switch (mode) {
        case OptionMode.PLAIN:
            return (
                <Stack
                    direction="row"
                    justifyContent="center"
                    alignItems="center"
                    onClick={onClick}
                    sx={{
                        padding: 0.5,
                        // Display same border as when selected so that positioning of the element
                        // doesnt change across toggling it.
                        borderWidth: 2,
                        borderColor: "transparent",
                        borderStyle: "solid",
                        borderRadius: 4,
                    }}
                >
                    <Typography
                        variant="body1"
                        sx={{userSelect: "none"}} // Dont display text highlight for copy-paste onclick
                    >{choiceLabel} {text}</Typography>
                </Stack>
            )
        case OptionMode.SELECTED_UNMARKED:
            return (
                <Stack
                    direction="row"
                    justifyContent="center"
                    alignItems="center"
                    onClick={onClick}
                    sx={{
                        padding: 0.5,
                        borderWidth: 2,
                        borderColor: theme.palette.success[900],
                        borderStyle: "solid",
                        borderRadius: 4,
                    }}
                >
                    <Typography
                        variant="body1"
                        sx={{
                            userSelect: "none", // Dont display text highlight for copy-paste onclick
                        }}
                    >{choiceLabel} {text}</Typography>
                </Stack>
            )
        case OptionMode.SELECTED_AND_MARKED_CORRECT:
            return (
                <Stack
                    direction="row"
                    justifyContent="center"
                    alignItems="center"
                    sx={{
                        padding: 0.5,
                        borderWidth: 2,
                        borderColor: theme.palette.success[900],
                        borderStyle: "solid",
                        borderRadius: 4,
                        backgroundColor: theme.palette.success[100],
                    }}
                >
                    <Typography
                        variant="body1"
                        sx={{
                            userSelect: "none", // Dont display text highlight for copy-paste onclick
                            marginRight: 1,
                            color: theme.palette.success[900],
                            fontWeight: 500,
                        }}
                    >{choiceLabel} {text}</Typography>
                    <CheckCircleOutlinedIcon fontSize={iconSize} sx={{color: theme.palette.success[900]}} />
                </Stack>
            )
        case OptionMode.SELECTED_AND_MARKED_INCORRECT:
            return (
                <Stack
                    direction="row"
                    justifyContent="center"
                    alignItems="center"
                    sx={{
                        padding: 0.5,
                        borderWidth: 2,
                        borderColor: theme.palette.error[900],
                        borderStyle: "solid",
                        borderRadius: 4,
                        backgroundColor: theme.palette.error[100],
                    }}
                >
                    <Typography
                        variant="body1"
                        sx={{
                            userSelect: "none", // Dont display text highlight for copy-paste onclick
                            marginRight: 1,
                            color: theme.palette.error[900],
                            fontWeight: 500,
                        }}
                    >{choiceLabel} {text}</Typography>
                    <CancelOutlinedIcon fontSize={iconSize} sx={{color: theme.palette.error[900]}} />
                </Stack>
            )
        case OptionMode.UNSELECTED_AND_MARKED_CORRECT:
            return (
                <Stack
                    direction="row"
                    justifyContent="center"
                    alignItems="center"
                    sx={{
                        padding: 0.5,
                        borderWidth: 2,
                        // borderColor: theme.palette.success[900],
                        borderColor: "transparent",
                        borderStyle: "solid",
                        borderRadius: 4,
                    }}
                >
                    <Typography
                        variant="body1"
                        sx={{
                            userSelect: "none", // Dont display text highlight for copy-paste onclick
                            marginRight: 1,
                            color: theme.palette.success[900],
                            fontWeight: 500,
                        }}
                    >{choiceLabel} {text}</Typography>
                    <CircleOutlinedIcon fontSize={iconSize} sx={{color: theme.palette.success[900]}} />
                </Stack>
            )
        default:
            throw new Error(`Invalid Option mode '${mode}'`)
    }
}

export default Option
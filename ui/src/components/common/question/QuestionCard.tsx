import { Card, CardActions, CardContent, Typography } from "@mui/material"
import theme from "../../../themes/theme"
import Option, { OptionMode } from "./Option"

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
            <CardContent
                sx={{
                    padding: 0,
                    margin: 3,
                }}
            >
                <Typography variant="h5">{question}</Typography>
                <Typography variant="caption" color={theme.palette.grey[700]}>Select {numCorrectOptions}</Typography>
            </CardContent>
            <CardActions
                sx={{
                    display: "flex",
                    justifyContent: "space-evenly",
                    margin: 3,
                    padding: 0,
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

export default QuestionCard
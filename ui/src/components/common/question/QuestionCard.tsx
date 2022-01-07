import { Box, Card, CardContent, SxProps, Theme, Typography } from "@mui/material"
import theme from "../../../themes/theme"
import Option, { OptionMode } from "./Option"

export enum QuestionCardVariant {
    ROW,
    COLUMN,
    BOX,
}

interface IQuestionCardProps {
    variant: QuestionCardVariant,
    question: string,
    numCorrectOptions: number,
    options: {
        text: string,
        mode: OptionMode
    }[],
    onOptionClicked?: (optionIndex: number) => void,
}

export function QuestionCard(props: IQuestionCardProps) {
    const { variant, question, options, numCorrectOptions, onOptionClicked} = props

    let variantSx: SxProps<Theme>
    switch (variant) {
        case QuestionCardVariant.ROW:
            variantSx = {
                display: "flex",
                justifyContent: "space-evenly",
            }
            break
        case QuestionCardVariant.COLUMN:
            variantSx = {
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-evenly",
            }
            break
        case QuestionCardVariant.BOX:
            variantSx = {
                display: "grid",
                gridTemplateRows: "auto auto",
                gridTemplateColumns: "auto auto",
                rowGap: theme.spacing(1),
                justifyItems: "start",
            }
            break
    }

    return (
        <Card>
            <CardContent
                sx={{
                    padding: 0,
                    margin: 3,
                }}
            >
                <Typography variant="h5">{question}</Typography>
                <Typography variant="caption" color={theme.palette.grey[700]}>Select {numCorrectOptions}</Typography>
            </CardContent>
            <Box
                sx={{
                    margin: 3,
                    padding: 0,
                    ...variantSx,
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
            </Box>
        </Card>
    )
}

export default QuestionCard
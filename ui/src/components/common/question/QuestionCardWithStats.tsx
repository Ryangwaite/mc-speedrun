import {Card, Typography, CardContent, CardActions, Box, Divider,} from "@mui/material";
import { IQuestionAnswerStats } from "../../../const";
import theme from "../../../themes/theme";
import Option, { OptionMode } from "./Option";
import QuestionStatsPanel from "./StatsPanel";

interface IQuestionCardWithStatsProps {
    question: string,
    numCorrectOptions: number,
    options: {
        text: string,
        mode: OptionMode,
    }[],
    answerStats: IQuestionAnswerStats
}

function QuestionCardWithStats(props: IQuestionCardWithStatsProps) {

    const {question, numCorrectOptions, options} = props

    const optionElements = options.map((option, index) => {
        return <Option
                    key={index}
                    text={option.text}
                    choiceLabel={String.fromCharCode(65 + index) + ")"}
                    mode={option.mode}
                />
    })

    return (
        <Card
            sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: 0, 
            }}
        >
            <Box
                flexGrow={1}
            >
                <CardContent
                    sx={{
                        padding: 0,
                        marginRight: 3,
                        marginLeft: 3,
                        marginTop: 3,
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
                    {optionElements}
                </CardActions>
            </Box>
            <Box
                alignSelf={"stretch"}
                marginTop={3}
                marginBottom={3}
            >
                <Divider
                    flexItem
                    orientation="vertical"
                    sx={{
                        height: "100%",
                    }}
                />
            </Box>
            <QuestionStatsPanel {...props}/>
        </Card>
    )
}

export default QuestionCardWithStats
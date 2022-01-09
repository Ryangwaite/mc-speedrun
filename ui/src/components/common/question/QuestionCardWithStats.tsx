import { Card, Typography, CardContent, CardActions, Box, Divider, } from "@mui/material";
import { IQuestionAnswerStats } from "../../../const";
import theme from "../../../themes/theme";
import Option, { OptionMode } from "./Option";
import { QuestionCardVariant } from "./QuestionCard";
import QuestionStatsPanel, { QuestionStatsVariant } from "./StatsPanel";

interface IQuestionCardWithStatsProps {
    variant: QuestionCardVariant,
    question: string,
    numCorrectOptions: number,
    options: {
        text: string,
        mode: OptionMode,
    }[],
    answerStats: IQuestionAnswerStats
}

function QuestionCardWithStats(props: IQuestionCardWithStatsProps) {

    const { variant, question, numCorrectOptions, options } = props

    const optionElements = options.map((option, index) => {
        return <Option
            key={index}
            text={option.text}
            choiceLabel={String.fromCharCode(65 + index) + ")"}
            mode={option.mode}
        />
    })

    let content
    switch (variant) {
        case QuestionCardVariant.COLUMN:
            content = null
            break
        case QuestionCardVariant.BOX:
            content = (
                <Box
                    display={"flex"}
                    flexDirection={"column"}
                    alignItems={"center"}
                    marginRight="auto"
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
                        <Box
                            sx={{
                                display: "grid",
                                gridTemplateRows: "auto auto",
                                gridTemplateColumns: "auto auto",
                                rowGap: theme.spacing(1),
                                justifyItems: "start",
                                margin: 3,
                                padding: 0,
                            }}
                        >
                            {optionElements}
                        </Box>
                    </Box>
                    <Box
                        alignSelf={"stretch"}
                        marginLeft={3}
                        marginRight={3}
                    >
                        <Divider
                            orientation="horizontal"
                        />
                    </Box>
                    <Box
                        marginTop={3}
                        marginBottom={3}
                    >
                        <QuestionStatsPanel variant={QuestionStatsVariant.HORIZONTAL} answerStats={props.answerStats} />
                    </Box>
                </Box>
            )
            break
        case QuestionCardVariant.ROW:
            content = (
                <>
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
                    <QuestionStatsPanel variant={QuestionStatsVariant.VERTICAL} answerStats={props.answerStats} />
                </>
            )
            break
    }

    return (
        <Card
            sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: 0,
            }}
        >
            {content}
        </Card>
    )
}

export default QuestionCardWithStats
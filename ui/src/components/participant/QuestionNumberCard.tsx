import { Card, Typography } from "@mui/material";
import theme from "../../themes/theme";


interface IQuestionNumberCardProps {
    questionNumber: number,
    totalQuestions: number,
}

function QuestionNumberCard(props: IQuestionNumberCardProps) {

    const { questionNumber, totalQuestions } = props;

    return (
        <Card
            sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "100%",
            }}
        >
            <Typography
                variant="h4"
                textAlign="center"
            >Question {questionNumber}/{totalQuestions}</Typography>
        </Card>
    )
}

export default QuestionNumberCard
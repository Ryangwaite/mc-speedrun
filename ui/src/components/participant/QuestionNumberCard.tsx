import { Box, Card, Typography } from "@mui/material";
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
            <Box
                display={"flex"}
                flexDirection={"row"}
                alignItems={"baseline"}
                flexWrap={"wrap"}
                justifyContent={"center"}
            >
                <Typography
                    variant="h5"
                    textAlign="center"
                    marginRight={1}
                    color={theme.palette.grey[600]}
                >Question</Typography>
                <Typography
                    variant="h4"
                    textAlign="center"
                >{questionNumber}/{totalQuestions}</Typography>
            </Box>
        </Card>
    )
}

export default QuestionNumberCard
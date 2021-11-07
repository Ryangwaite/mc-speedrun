import React from "react";
import { Button, Typography, Box, Card, LinearProgress, Container} from "@mui/material";
import { QuestionCard } from "../common/Question";
import { SAMPLE_QUESTIONS_AND_ANSWERS } from "../const";
import { LeaderboardColumn, LEADERBOARD_COLUMN_WIDTH } from "../common/Leaderboard";
interface IQuestionNumberCardProps {
    questionNumber: number,
    totalQuestions: number,
}

function QuestionNumberCard(props: IQuestionNumberCardProps) {

    const { questionNumber, totalQuestions } = props;

    return (
        <Card
            sx={{
                padding: "12px"
            }}
        >
            <Typography
                variant="h4"
                textAlign="center"
            >Question {questionNumber}/{totalQuestions}</Typography>
        </Card>
    )
}

interface ICountdownCardProps {
    secondsRemaining: number,
    totalSeconds: number,
}

function CountdownCard(props: ICountdownCardProps) {

    const {secondsRemaining, totalSeconds} = props

    // Map to a value between 0 and 100
    const progressValue = 100 * (secondsRemaining / totalSeconds)

    return (
        <Card
            sx={{
                padding: "10px"
            }}
        >
            <Typography
                variant="h4"
                textAlign="center"
            >{secondsRemaining}s</Typography>
            <LinearProgress variant="buffer" value={progressValue}/>
        </Card>
    )
}

interface IQuizSectionProps {
    questionNumber: number,
    totalQuestions: number,
    secondsRemaining: number,
    totalSeconds: number,
}

interface IQuizSectionState {}

class QuizSection extends React.Component<IQuizSectionProps, IQuizSectionState> {
    constructor(props: IQuizSectionProps) {
        super(props)
        this.state = {}
    }

    render() {

        const { questionNumber, totalQuestions, secondsRemaining, totalSeconds } = this.props

        // Grab a question to render
        const {question, options, answers} = SAMPLE_QUESTIONS_AND_ANSWERS[0];

        return (
            <Container
                disableGutters={true}
                maxWidth={false}  // Prevent mui from controlling the width
                sx={{
                    display: "grid",
                    gridTemplateColumns: "50% 50%",
                    gridTemplateRows: "84px 178px 64px",
                    gridTemplateAreas: `'question-number      countdown'
                                        'question            question'
                                        'button              button'`,
                    maxWidth: "800px",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <Container sx={{gridArea: "question-number"}}>
                    <QuestionNumberCard questionNumber={questionNumber} totalQuestions={totalQuestions} />
                </Container>
                <Container sx={{gridArea: "countdown"}}>
                    <CountdownCard secondsRemaining={secondsRemaining} totalSeconds={totalSeconds} />
                </Container>
                <Container sx={{gridArea: "question"}}>
                    <QuestionCard
                        question={question}
                        options={options}
                        correctAnswers={answers}
                    />
                </Container>
                    <Button
                        variant="contained"
                        sx={{
                            marginLeft: "auto",
                            marginRight: "auto",
                            gridArea: "button",
                            placeSelf: "center"
                        }}
                    >Submit</Button>
            </Container>
        )
    }
}

function PositionedQuizSection(props: IQuizSectionProps) {
    return (
        <Container
            disableGutters
            maxWidth={false}
            sx={{
                // Position container on lhs
                position: "absolute",
                top: 0,
                left: 0,
                bottom: 0,
                // Position content within
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: `calc(100vw - ${LEADERBOARD_COLUMN_WIDTH})`
            }}
        >
            <QuizSection {...props} />
        </Container>
    )
}

interface IQuizProps {
}

interface IQuizState {
    
}

class Quiz extends React.Component<IQuizProps, IQuizState> {
    constructor(props: IQuizProps) {
        super(props)
        this.state = {}
    }

    render() {
        return (
            <Box
                // Position the container so the Leaderboard and QuizSection can be positioned relative to it
                position="relative"
                sx={{
                    flexGrow: 1,
                    minWidth: "100%",
                    height: "100%"
                }}
            >
                <PositionedQuizSection
                    questionNumber={4}
                    totalQuestions={50}
                    secondsRemaining={50}
                    totalSeconds={120}
                />
                <LeaderboardColumn />
            </Box>
            
        )
    }
}

export default Quiz;
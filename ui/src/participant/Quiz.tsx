import React from "react";
import { Button, Typography, Box, Grid, Card, LinearProgress, Checkbox, TextField, Container} from "@mui/material";
import ParticipantList from "../common/ParticipantList";
import { QuestionCard } from "../common/Question";
import { SAMPLE_QUESTIONS_AND_ANSWERS } from "../const";

const LEADERBOARD_COLUMN_WIDTH = "400px"

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

        // Map to a value between 0 and 100
        const progressValue = 100 * (secondsRemaining / totalSeconds)

        // Grab a question to render
        const {question, options, answers} = SAMPLE_QUESTIONS_AND_ANSWERS[0];

        const topRowHeight = "84px"

        return (
            <Grid
                container
                // position="relative"
                // top="0"
                // bottom="0"
                // left="0"
                // sx={{
                //     maxWidth: `calc(100vw - ${LEADERBOARD_COLUMN_WIDTH})`,
                //     marginTop: "auto",
                //     marginBottom: "auto",
                //     height: "100%"
                // }}
                spacing={2}
                alignItems="center"
                justifyContent="center"
            >
                <Grid item xs={6}>
                    <Card
                        sx={{
                            height: topRowHeight
                        }}
                    >
                        <Typography
                            variant="h4"
                            textAlign="center"
                        >Question {questionNumber}/{totalQuestions}</Typography>
                    </Card>
                </Grid>
                <Grid item xs={6}>
                    <Card
                        sx={{
                            height: topRowHeight
                        }}
                    >
                        <Typography
                            variant="h4"
                            textAlign="center"
                        >{secondsRemaining}s</Typography>
                        <LinearProgress variant="buffer" value={progressValue}/>
                    </Card>
                </Grid>
                <Grid item xs={12}>
                    <Card>
                        <QuestionCard
                            question={question}
                            options={options}
                            answers={answers}
                        />
                    </Card>
                </Grid>
                <Grid item
                    xs={12}
                    sx={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center"
                    }}
                >
                    <Button variant="contained">Submit</Button>
                </Grid>
            </Grid>
        )
    }
}

interface IParticipantColumnProps {
}

function ParticipantColumn(props: IParticipantColumnProps) {

    const participants: Set<string> = new Set(Array.from(Array(100).keys()).map(x => `participant ${x}`));

    return (
        <Box
            // Position
            position="absolute"
            top="0"
            right="0"
            bottom="0"
            maxWidth={LEADERBOARD_COLUMN_WIDTH}
            sx={{
                overflowY: "auto",
            }}
        >
            <Typography variant="h4">Leaderboard</Typography>
            <ParticipantList otherParticipants={participants} thisParticipant={null} />
        </Box>
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
                // Position the container so the Leaderboard can be positioned relative to it
                position="relative"
                sx={{
                    flexGrow: 1,
                    minWidth: "100%",
                    height: "100%"
                }}
            >
                <Container
                    disableGutters
                    sx={{
                        border: "1px solid red",
                        height: "100%",
                        maxWidth: `calc(100vw - ${LEADERBOARD_COLUMN_WIDTH})`,
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        position: "relative",
                        top: "0",
                        bottom: "0",
                        left: "0"
                    }}
                >
                    <QuizSection
                        questionNumber={4}
                        totalQuestions={50}
                        secondsRemaining={50}
                        totalSeconds={120}
                    />
                </Container>


                
                {/* <QuizSection
                    questionNumber={4}
                    totalQuestions={50}
                    secondsRemaining={50}
                    totalSeconds={120}
                /> */}
                <ParticipantColumn />
            </Box>
        )
    }
}

export default Quiz;
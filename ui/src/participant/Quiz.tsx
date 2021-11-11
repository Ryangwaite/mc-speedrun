import React from "react";
import { Button, Typography, Box, Card, LinearProgress, Container} from "@mui/material";
import { OptionMode, QuestionCard } from "../common/Question";
import { IQuestionAndAnswers, SAMPLE_PARTICIPANTS, SAMPLE_QUESTIONS_AND_ANSWERS } from "../const";
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
            <LinearProgress variant="determinate" value={progressValue} />
        </Card>
    )
}

interface IQuizSectionProps {
    questionNumber: number,
    totalQuestions: number,
    secondsRemaining: number,
    totalSeconds: number,
    questionText: string,
    numCorrectOptions: number,
    options: {
        text: string,
        mode: OptionMode,
    }[]
    onSubmit: () => void,
    onOptionClicked: (option: number) => void
}

function QuizSection(props: IQuizSectionProps) {

    const {
        questionNumber, totalQuestions, secondsRemaining, totalSeconds,
        questionText, numCorrectOptions, options,
    } = props

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
                    question={questionText}
                    numCorrectOptions={numCorrectOptions}
                    options={options}
                    onOptionClicked={props.onOptionClicked}
                />
            </Container>
                <Button
                    variant="contained"
                    onClick={props.onSubmit}
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
    // Just temporary state
    currentQuestionIndex: number,
    // What the user has currently selected as the correct answers before submitting
    optionSelection: number[],
}

class Quiz extends React.Component<IQuizProps, IQuizState> {
    constructor(props: IQuizProps) {
        super(props)
        this.state = {
            currentQuestionIndex: 0,
            optionSelection: [],
        }

        this.onSubmit = this.onSubmit.bind(this);
        this.clickOption = this.clickOption.bind(this);
    }

    clickOption(optionIndex: number) {
        this.setState(prevState => {
            let updatedOptionSelection = [...prevState.optionSelection]
            if (updatedOptionSelection.includes(optionIndex)) {
                // Remove it from selection
                updatedOptionSelection.filter(x => x !== optionIndex)
            } else {
                // Add it to selection
                updatedOptionSelection.push(optionIndex)
            }
            return {optionSelection: updatedOptionSelection}
        })
    }

    onSubmit() {
        console.log(`Selected options were: ${this.state.optionSelection}`)

        // Just move onto next question
        this.setState(prevState => ({
            currentQuestionIndex: (prevState.currentQuestionIndex + 1) % SAMPLE_QUESTIONS_AND_ANSWERS.length // wrap around
        }))

        this.setState({optionSelection: []})
    }

    render() {

        // Get some participants.
        // NOTE: if this isn't deep cloned, weird rendering things happen with multiple list items shown as selected
        const participants = SAMPLE_PARTICIPANTS.map(participant => ({...participant}))
        participants[10].selected = true // Make a "random" participant highlighted.

        const qAndA: IQuestionAndAnswers = SAMPLE_QUESTIONS_AND_ANSWERS[this.state.currentQuestionIndex]
        const options = qAndA.options.map((value, index) => ({
            text: value,
            mode: this.state.optionSelection.includes(index) ? OptionMode.SELECTED_UNMARKED : OptionMode.PLAIN,
        }))

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
                    questionNumber={this.state.currentQuestionIndex + 1}
                    totalQuestions={SAMPLE_QUESTIONS_AND_ANSWERS.length}
                    secondsRemaining={50}
                    totalSeconds={120}
                    questionText={qAndA.question}
                    numCorrectOptions={qAndA.answers.length}
                    options={options}
                    onOptionClicked={this.clickOption}
                    onSubmit={this.onSubmit}
                />
                <LeaderboardColumn participants={participants} />
            </Box>
            
        )
    }
}

export default Quiz;
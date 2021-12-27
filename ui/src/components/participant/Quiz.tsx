import React, { useEffect, useState } from "react";
import { Button, Typography, Box, Card, LinearProgress, Container, CircularProgress} from "@mui/material";
import { OptionMode, QuestionCard } from "../common/Question";
import { LeaderboardColumn, LEADERBOARD_COLUMN_WIDTH } from "../common/Leaderboard";
import { selectCurrentQuestion, selectNumberOfQuestions, selectQuestionDuration, selectRequestQuestion, selectUserId, setQuestionAnswer, setQuestionAnswerTimeout, setRequestQuestion } from "../../slices/participant";
import { useAppDispatch, useAppSelector } from "../../hooks";
import { selectLeaderboard } from "../../slices/common";
import { useNavigate } from "react-router-dom";
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
    }[],
    submitDisabled: boolean,
    onSubmit: () => void,
    onOptionClicked: (option: number) => void
}

function QuizSection(props: IQuizSectionProps) {

    const {
        questionNumber, totalQuestions, secondsRemaining, totalSeconds,
        questionText, numCorrectOptions, options, submitDisabled
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
                    disabled={submitDisabled}
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

function Quiz(props: IQuizProps) {

    // App State
    const userId = useAppSelector(state => selectUserId(state))!
    const leaderboard = useAppSelector(state => selectLeaderboard(state))
    const questionDuration =  useAppSelector(state => selectQuestionDuration(state))!
    const numberOfQuestions = useAppSelector(state => selectNumberOfQuestions(state))!
    const requestQuestion = useAppSelector(state => selectRequestQuestion(state))
    const currentQuestion = useAppSelector(state => selectCurrentQuestion(state))!

    // Local State
    const [optionSelection, setOptionSelection] = useState<number[]>([])
    const [timeRemaining, setTimeRemaining] = useState<number>(questionDuration)

    const dispatch = useAppDispatch()
    let navigate = useNavigate();

    // Make the countdown functional
    useEffect(() => {
        console.debug("Initialized new timeout")
        const timeout = setTimeout(() => {
            console.debug("Timeout fired")
            setTimeRemaining(timeRemaining - 1)
            console.log(`Time remaining is: ${timeRemaining}`)
            if (timeRemaining === 0) {
                dispatch(setQuestionAnswerTimeout({questionIndex: currentQuestion.questionIndex}))
                transitionToNextQuestion()
            } // else continue counting down
        }, 1000)
        return function cleanup() {
            clearTimeout(timeout)
            console.debug("Cleaned up countdown timer")
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [timeRemaining])

    function clickOption(optionIndex: number) {
        let updatedSelection = [...optionSelection]
        if (updatedSelection.includes(optionIndex)) {
            // Remove it from selection
            updatedSelection = updatedSelection.filter(x => x !== optionIndex)
        } else {
            if (updatedSelection.length === currentQuestion.numberOfOptionsToSelect) {
                // Deselect the last option
                updatedSelection.pop()
            }

            // Add the freshly clicked one to the selection
            updatedSelection.push(optionIndex)
        }
        setOptionSelection(updatedSelection)
    }

    function onSubmit() {
        console.log(`Selected options were: ${optionSelection}`)
        dispatch(setQuestionAnswer({
            questionIndex: currentQuestion.questionIndex,
            selectedOptionIndexes: optionSelection,
            answerDuration: questionDuration - timeRemaining,
        }))
        transitionToNextQuestion()
    }

    function transitionToNextQuestion() {
        const lastQuestion = currentQuestion.questionIndex + 1 === numberOfQuestions
        if (lastQuestion) {
            navigate("/summary")
        } else {
            // Clear the option selection ready for the next question
            setOptionSelection([])

            // Request the next question
            dispatch(setRequestQuestion({isRequesting: true, questionIndex: currentQuestion.questionIndex + 1 }))
            
            // Restart the timer
            setTimeRemaining(questionDuration)
        }
    }

    let content
    if (requestQuestion) {
        content = <CircularProgress />
    } else {
        const options = currentQuestion.options.map((value, index) => ({
            text: value,
            mode: optionSelection.includes(index) ? OptionMode.SELECTED_UNMARKED : OptionMode.PLAIN,
        }))

        const submitDisabled = currentQuestion.numberOfOptionsToSelect !== optionSelection.length

        content = (
            <PositionedQuizSection
                questionNumber={currentQuestion.questionIndex + 1}
                totalQuestions={numberOfQuestions}
                secondsRemaining={timeRemaining}
                totalSeconds={questionDuration}
                questionText={currentQuestion.question}
                numCorrectOptions={currentQuestion.numberOfOptionsToSelect}
                options={options}
                onOptionClicked={clickOption}
                submitDisabled={submitDisabled}
                onSubmit={onSubmit}
            />
        )
    }

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
            {content}
            <LeaderboardColumn items={leaderboard} selectedUserId={userId} />
        </Box>
        
    )
}

export default Quiz;
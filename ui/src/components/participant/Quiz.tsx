import React, { useEffect, useState } from "react";
import { Button, Box, Card, LinearProgress, Container, CircularProgress} from "@mui/material";
import { PositionedLeaderboard, LEADERBOARD_COLUMN_WIDTH } from "../common/leaderboard/Leaderboard";
import { selectCurrentQuestion, selectNumberOfQuestions, selectQuestionDuration, selectRequestQuestion, selectUserId, setQuestionAnswer, setQuestionAnswerTimeout, setRequestQuestion } from "../../slices/participant";
import { useAppDispatch, useAppSelector } from "../../hooks";
import { selectLeaderboard } from "../../slices/common";
import { useNavigate } from "react-router-dom";
import { OptionMode } from "../common/question/Option";
import QuestionCard from "../common/question/QuestionCard";
import QuestionNumberCard from "./QuestionNumberCard";
import CountdownCard from "./CountdownCard";
import theme from "../../themes/theme";

const COLUMN_WIDTH = "340px"

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
        <Box
            sx={{
                display: "grid",
                gridTemplateColumns: `calc(50% - ${theme.spacing(1.5)}) calc(50% - ${theme.spacing(1.5)})`, // NOTE: This needs to sum to 100% including columnGap
                gridTemplateRows: `${theme.spacing(15)} auto auto`,
                gridTemplateAreas: `'question-number      countdown'
                                    'question            question'
                                    'button              button'`,
                // maxWidth: theme.spacing(100),
                // justifyItems: "stretch",
                columnGap: theme.spacing(3),
                rowGap: theme.spacing(3),
                margin: 3,
            }}
        >
            <Box sx={{gridArea: "question-number"}}>
                <QuestionNumberCard questionNumber={questionNumber} totalQuestions={totalQuestions} />
            </Box>
            <Box sx={{gridArea: "countdown"}}>
                <CountdownCard secondsRemaining={secondsRemaining} totalSeconds={totalSeconds} />
            </Box>
            <Box sx={{gridArea: "question"}}>
                <QuestionCard
                    question={questionText}
                    numCorrectOptions={numCorrectOptions}
                    options={options}
                    onOptionClicked={props.onOptionClicked}
                />
            </Box>
                <Button
                    variant="contained"
                    disabled={submitDisabled}
                    onClick={props.onSubmit}
                    sx={{
                        gridArea: "button",
                        justifySelf: "center",
                    }}
                >Submit</Button>
        </Box>
    )
}

function PositionedQuizSection(props: IQuizSectionProps) {
    return (
        <Box
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
                width: `calc(100% - ${LEADERBOARD_COLUMN_WIDTH} - ${theme.spacing(3)})` // The spacing is the left margin of leaderboard
            }}
        >
            <QuizSection {...props} />
        </Box>
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
            <PositionedLeaderboard items={leaderboard} selectedUserId={userId} />
        </Box>
        
    )
}

export default Quiz;
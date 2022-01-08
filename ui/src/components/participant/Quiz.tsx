import React, { useEffect, useState } from "react";
import { Button, Box, CircularProgress} from "@mui/material";
import { LeaderBoard, LEADERBOARD_COLUMN_WIDTH } from "../common/leaderboard/Leaderboard";
import { selectCurrentQuestion, selectNumberOfQuestions, selectQuestionDuration, selectRequestQuestion, selectUserId, setQuestionAnswer, setQuestionAnswerTimeout, setRequestQuestion } from "../../slices/participant";
import { useAppDispatch, useAppSelector, usePageVariant } from "../../hooks";
import { selectLeaderboard } from "../../slices/common";
import { useNavigate } from "react-router-dom";
import { OptionMode } from "../common/question/Option";
import QuestionCard, { QuestionCardVariant } from "../common/question/QuestionCard";
import QuestionNumberCard from "./QuestionNumberCard";
import CountdownCard from "./CountdownCard";
import theme, { COLUMN_MARGIN_TOP, scrollbarMixin } from "../../themes/theme";
import { PageVariant } from "../../types";

const COLUMN_WIDTH = "340px"

interface IQuizSectionProps {
    questionNumber: number,
    totalQuestions: number,
    secondsRemaining: number,
    totalSeconds: number,
    questionText: string,
    numCorrectOptions: number,
    questionCardVariant: QuestionCardVariant,
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
        questionText, numCorrectOptions, questionCardVariant, options,
        submitDisabled,
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
                columnGap: theme.spacing(3),
                rowGap: theme.spacing(3),
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
                    variant={questionCardVariant}
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

interface IQuizPageContainerProps {
    variant: PageVariant,
    quizSection: React.ReactNode | React.ReactNode[],
    leaderboardSection: React.ReactNode | React.ReactNode[],
}

function QuizPageContainer(props: IQuizPageContainerProps) {
    const { variant, quizSection, leaderboardSection } = props

    switch (variant) {
        case PageVariant.SMALL:
            return null
        case PageVariant.MEDIUM:
        case PageVariant.LARGE:
            return (
                <>
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
                            width: `calc(100% - ${LEADERBOARD_COLUMN_WIDTH} - ${theme.spacing(3)})`,
                            marginLeft: 3,
                        }}
                    >
                        {quizSection}
                    </Box>
                    <Box
                        // Position on the rhs
                        position="absolute"
                        top="0"
                        right="0"
                        bottom="0"
                        width={LEADERBOARD_COLUMN_WIDTH}
                        sx={{
                            overflowY: "auto",
                            ...scrollbarMixin,
                        }}
                    >
                        <Box
                            sx={{
                                margin: 3,
                                marginTop: COLUMN_MARGIN_TOP,
                                padding: 0,
                            }}
                        >
                            {leaderboardSection}
                        </Box>
                    </Box>
                </>
            )
    }
}

interface IQuizProps {
}

function Quiz(props: IQuizProps) {

    const pageVariant = usePageVariant()

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

        const questionCardVariant = {
            [PageVariant.SMALL]: QuestionCardVariant.COLUMN,
            [PageVariant.MEDIUM]: QuestionCardVariant.BOX,
            [PageVariant.LARGE]: QuestionCardVariant.ROW,
        }[pageVariant]

        content = (
            <QuizSection
                questionNumber={currentQuestion.questionIndex + 1}
                totalQuestions={numberOfQuestions}
                secondsRemaining={timeRemaining}
                totalSeconds={questionDuration}
                questionText={currentQuestion.question}
                numCorrectOptions={currentQuestion.numberOfOptionsToSelect}
                options={options}
                questionCardVariant={questionCardVariant}
                onOptionClicked={clickOption}
                submitDisabled={submitDisabled}
                onSubmit={onSubmit}
            />
        )
    }

    const leaderboardSection = <LeaderBoard items={leaderboard} selectedUserId={userId} />

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
            <QuizPageContainer
                variant={pageVariant}
                quizSection={content}
                leaderboardSection={leaderboardSection}
            />
        </Box>
        
    )
}

export default Quiz;
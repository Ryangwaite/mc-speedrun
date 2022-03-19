import MenuIcon from '@mui/icons-material/Menu';
import { Badge, Box, Button, CircularProgress, Drawer, IconButton, Stack } from "@mui/material";
import _ from "lodash";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LeaderBoard, LEADERBOARD_COLUMN_WIDTH } from '../components/common/leaderboard/Leaderboard';
import { LeaderBoardItem } from '../components/common/leaderboard/LeaderboardItem';
import { OptionMode } from '../components/common/question/Option';
import QuestionCard, { QuestionCardVariant } from '../components/common/question/QuestionCard';
import CountdownCard from '../components/participant/CountdownCard';
import QuestionNumberCard from '../components/participant/QuestionNumberCard';
import { usePageVariant, useAppSelector, useAppDispatch } from '../hooks';
import { selectLeaderboard } from '../slices/common';
import { selectUserId, selectQuestionDuration, selectNumberOfQuestions, selectRequestQuestion, selectCurrentQuestion, setQuestionAnswerTimeout, setQuestionAnswer, setRequestQuestion } from '../slices/participant';
import theme, { COLUMN_MARGIN_TOP, scrollbarMixin } from '../themes/theme';
import { PageVariant, ILeaderboardItem } from '../types';

const COLUMN_WIDTH = "340px"

interface IQuizSectionProps {
    variant: PageVariant,
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
        variant, questionNumber, totalQuestions, secondsRemaining,
        totalSeconds, questionText, numCorrectOptions, 
        options, submitDisabled,
    } = props

    const questionCardVariant = {
        [PageVariant.SMALL]: QuestionCardVariant.COLUMN,
        [PageVariant.MEDIUM]: QuestionCardVariant.BOX,
        [PageVariant.LARGE]: QuestionCardVariant.ROW,
    }[variant]

    const questionNumberCard = <QuestionNumberCard questionNumber={questionNumber} totalQuestions={totalQuestions} />
    const countdownCard = <CountdownCard secondsRemaining={secondsRemaining} totalSeconds={totalSeconds} />
    const questionCard = (
        <QuestionCard
            variant={questionCardVariant}
            question={questionText}
            numCorrectOptions={numCorrectOptions}
            options={options}
            onOptionClicked={props.onOptionClicked}
        />
    )
    const submitButton = (
        <Button
            variant="contained"
            disabled={submitDisabled}
            onClick={props.onSubmit}
        >Submit</Button>
    )

    switch (variant) {
        case PageVariant.SMALL:
            return (
                <Stack
                    display={"flex"}
                    flexDirection={"column"}
                    alignItems={"center"}
                >
                    <Box
                        marginBottom={3}
                        width={"100%"}
                        height={theme.spacing(7)}
                    >
                        {questionNumberCard}
                    </Box>
                    <Box
                        marginBottom={3}
                        width={"100%"}
                        height={theme.spacing(10)}
                    >
                        {countdownCard}
                    </Box>
                    <Box
                        marginBottom={3}
                    >
                        {questionCard}
                    </Box>
                    {submitButton}
                </Stack>
            )
        case PageVariant.MEDIUM:
        case PageVariant.LARGE:
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
                        {questionNumberCard}
                    </Box>
                    <Box sx={{gridArea: "countdown"}}>
                        {countdownCard}
                    </Box>
                    <Box sx={{gridArea: "question"}}>
                        {questionCard}
                    </Box>
                    <Box sx={{gridArea: "button", justifySelf: "center",}}>
                        {submitButton}
                    </Box>
                </Box>
            )
    }
}

interface ILeaderboardSectionProps {
    variant: PageVariant,
    items: ILeaderboardItem[],
    selectedUserId: string,
}

function LeaderboardSection(props: ILeaderboardSectionProps) {
    // This is just for the small view
    const [leaderboardDrawerOpen, setLeaderboardDrawerOpen] = useState(false)

    const {variant, items, selectedUserId} = props

    switch (variant) {
        case PageVariant.SMALL:
            const sortedItems = _.sortBy(items, x => x.score).reverse()
            let userPosition: number
            let selectedUser: ILeaderboardItem
            for (let i = 0; i < sortedItems.length; i++) {
                if (sortedItems[i].userId === selectedUserId) {
                    userPosition = i + 1
                    selectedUser = sortedItems[i]
                }
            }
            
            return (
                <>
                    <Stack direction={"row"}>
                        <Box
                            flexGrow={1}
                            marginRight={1.5}
                        >
                            <LeaderBoardItem key={0} position={userPosition!} selected={true} item={selectedUser!} />
                        </Box>
                        <IconButton
                            aria-label="menu"
                            onClick={() => setLeaderboardDrawerOpen(true)}
                            sx={{alignSelf: "center"}}
                        >
                            <Badge badgeContent={items.length} color="primary">
                                <MenuIcon />
                            </Badge>
                        </IconButton>
                    </Stack>
                    <Drawer
                        anchor="right"
                        open={leaderboardDrawerOpen}
                        onClose={() => setLeaderboardDrawerOpen(false)}
                        PaperProps={{
                            sx: {
                                backgroundColor: theme.palette.grey[100],
                            }
                        }}
                    >
                        <Box
                            padding={3}
                            width={COLUMN_WIDTH}
                        >
                            <LeaderBoard items={items} selectedUserId={selectedUserId} />
                        </Box>
                    </Drawer>
                </>
            )
        case PageVariant.MEDIUM:
        case PageVariant.LARGE:
            return <LeaderBoard items={items} selectedUserId={selectedUserId} />
    }
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
            return (
                <>
                    <Box
                        marginTop={COLUMN_MARGIN_TOP}
                        marginLeft={3}
                        marginRight={3}
                        marginBottom={2}
                    >
                        {leaderboardSection}
                    </Box>
                    <Box
                        marginLeft={3}
                        marginRight={3}
                    >
                        {quizSection}
                    </Box>
                </>
            )
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
        const timeout = setTimeout(() => {
            setTimeRemaining(timeRemaining - 1)
            if (timeRemaining === 0) {
                dispatch(setQuestionAnswerTimeout({questionIndex: currentQuestion.questionIndex}))
                transitionToNextQuestion()
            } // else continue counting down
        }, 1000)
        return function cleanup() {
            clearTimeout(timeout)
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
            <QuizSection
                variant={pageVariant}
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

    const leaderboardSection = <LeaderboardSection variant={pageVariant} selectedUserId={userId} items={leaderboard} />

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
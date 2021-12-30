import { Box, Button, Card, Checkbox, CircularProgress, Collapse, Container, FormControlLabel, FormGroup, TextField, Typography } from "@mui/material";
import React, { useState } from "react";
import { uploadQuiz } from "../../api/quizUpload";
import { IQuestionAndAnswers } from "../../types";
import { useAppDispatch, useAppSelector } from "../../hooks";
import { selectLeaderboard, selectQuizId } from "../../slices/common";
import { selectHostQuestions, selectSetRequestQuestions, setHostConfig, setRequestQuestions } from "../../slices/host";
import { ILeaderboardItem } from "../../types";
import { LEADERBOARD_COLUMN_WIDTH } from "../common/Leaderboard";
import ParticipantList from "../common/ParticipantList";
import { OptionMode, QuestionCard } from "../common/Question";
import _ from "lodash";
import UploadModal from "./UploadModal";
import QuizNameBlock from "./QuizNameBlock";
import QuizAccessCode from "./QuizAccessCode";
import CategoriesBlock from "./CategoriesBlock";
import QuestionDurationBlock from "./QuestionDurationBlock";

const COLUMN_WIDTH = "340px"
interface IConfigColumnProps {
    accessCode: string,
    onUploadQuizClicked: () => void,
    onQuestionDurationChange: (duration: number) => void,
    onQuizNameChange: (name: string) => void,
    categories?: string[],
    selectedCategories?: string[],
    categoriesCheckListener: (category: string, checked: boolean) => void
}

// Wrapper for consistent gaps between config elements in the config column
// NOTE: Defined here as opposed to inside the ConfigColumn function body
//       to maintain focus on input elemenst across re-renders.
const ConfigColumnElementWrapper = (props: { children: React.ReactNode, marginTop?: number }) => (
    <Box
        sx={{
            margin: 3,
            marginTop: props.marginTop,
        }}
    >
        {props.children}
    </Box>
)

function ConfigColumn(props: IConfigColumnProps) {

    const { onQuestionDurationChange, onQuizNameChange, categories, selectedCategories, categoriesCheckListener } = props

    // Only show these elements when the quiz has been uploaded to the backend, which is signalled
    // by the categories being present
    let categoryBlock = categories
        ? (<CategoriesBlock categories={categories} selectedCategories={selectedCategories!} checkListener={categoriesCheckListener} />)
        : undefined
    let questionDurationBlock = categories ? <QuestionDurationBlock onDurationChanged={onQuestionDurationChange} /> : undefined

    return (
        <Box
            // Position
            position="absolute"
            top="0"
            left="0"
            bottom="0"
            // Content
            display="flex"
            flexDirection="column"
            maxWidth={COLUMN_WIDTH}
            sx={{
                overflowY: "auto",
            }}
        >
            <Card
                sx={{
                    margin: 3
                }}
            >
                <ConfigColumnElementWrapper>
                    <QuizAccessCode accessCode={props.accessCode} />
                </ConfigColumnElementWrapper>
                <ConfigColumnElementWrapper>
                    <QuizNameBlock onQuizNameChange={onQuizNameChange} />
                </ConfigColumnElementWrapper>
                <ConfigColumnElementWrapper>
                    <Button
                        variant="contained"
                        component="label"
                        onClick={props.onUploadQuizClicked}
                    >
                        Upload Quiz
                    </Button>
                </ConfigColumnElementWrapper>
                {/* Uncollapse these ui elements */}
                <Collapse
                    orientation="vertical"
                    in={categoryBlock !== undefined && questionDurationBlock !== undefined}
                >
                    <ConfigColumnElementWrapper marginTop={0}>
                        {categoryBlock}
                    </ConfigColumnElementWrapper>
                    <ConfigColumnElementWrapper>
                        {questionDurationBlock}
                    </ConfigColumnElementWrapper>
                </Collapse>
            </Card>
        </Box>
    )
}

interface IQuestionColumnProps {
    questionsAndAnswers: IQuestionAndAnswers[],
    loading: boolean,
}

function QuestionColumn(props: IQuestionColumnProps) {


    let content = undefined

    if (props.loading) {
        content = <CircularProgress />
    } else if (props.questionsAndAnswers) {
        let renderedQuestions: React.ReactNode[] = []
        for (const questionAndAnswer of props.questionsAndAnswers) {
            const { question, options, answers } = questionAndAnswer;

            const optionsAndMode = options.map((value, index) => ({
                text: value,
                mode: answers.includes(index) ? OptionMode.SELECTED_AND_MARKED_CORRECT : OptionMode.PLAIN,
            }))

            renderedQuestions.push(
                <QuestionCard
                    question={question}
                    numCorrectOptions={answers.length}
                    options={optionsAndMode}
                />
            )
        }
        content = renderedQuestions
    }

    return (
        <Box
            // Position
            position="absolute"
            top="0"
            bottom="0"
            left="50%" // NOTE: the translateX(-50%) to position in centre
            sx={{
                overflowY: "auto",
                transform: "translateX(-50%)" // There's no direct prop for this, hence its here
            }}
        >
            {content}
        </Box>
    )
}

interface IParticipantColumnProps {
    participants: ILeaderboardItem[],
    onStartClicked: () => void,
    startDisabled: boolean,
}

function ParticipantColumn(props: IParticipantColumnProps) {

    const { participants, onStartClicked, startDisabled } = props

    return (
        <Box
            // Position on the rhs
            position="absolute"
            top="0"
            right="0"
            bottom="0"
            width={LEADERBOARD_COLUMN_WIDTH}
            marginRight="12px"
            sx={{
                overflowY: "auto",
            }}
        >
            <Typography variant="h4">Participants</Typography>
            <ParticipantList
                thisParticipant={null}
                otherParticipants={participants}
            />
            <Button disabled={startDisabled} variant="contained" onClick={() => onStartClicked()}>Start</Button>
        </Box>
    )
}

interface IConfigProps {
}

function Config(props: IConfigProps) {

    // Local state
    const [quizName, setQuizName] = useState("")
    const [questionDuration, setQuestionDuration] = useState(120)
    const [uploadErrMsg, setUploadErrMsg] = useState<string>()
    const [modalOpen, setModalOpen] = useState(false)
    const [selectedCategories, setSelectedCategories] = useState<string[]>()

    // App State
    const quizId = useAppSelector(state => selectQuizId(state))
    const leaderboard = useAppSelector(state => selectLeaderboard(state))
    const fetchingQuestions = useAppSelector(state => selectSetRequestQuestions(state))
    const questionsAndAnswers = useAppSelector(state => selectHostQuestions(state))

    const dispatch = useAppDispatch()

    // Extract categories
    let categories = questionsAndAnswers
        ? _.uniq(questionsAndAnswers.map(x => x.category))
        : undefined

    if (categories && !selectedCategories) {
        // The quiz has just been loaded for the first time and the categories
        // have been extracted. Initialize the selected categories to all of them
        setSelectedCategories(categories)
    }

    let filteredQuestionsAndAnswers: IQuestionAndAnswers[] = []
    let selectedQuestionIndexes: number[] = []
    if (questionsAndAnswers && selectedCategories) {
        filteredQuestionsAndAnswers = questionsAndAnswers.filter((qAndA, index) => {
            if (selectedCategories.includes(qAndA.category)) {
                selectedQuestionIndexes.push(index)
                return qAndA
            }
        })
    }

    function onQuizNameChange(name: string) {
        console.debug(`Quiz name change to: ${name}`)
        setQuizName(name)
    }

    function onUploadQuizClicked() {
        setModalOpen(true)
    }

    async function onModalUploadClicked(file: File) {
        try {
            await uploadQuiz(file, "REPLACE WITH TOKEN")
            // If everything was a succcess
            setUploadErrMsg(undefined)
            setModalOpen(false)

            // Request the questions from the server to display on the page
            dispatch(setRequestQuestions(true))
        } catch (e) {
            console.log("Caught error")
            setUploadErrMsg((e as Error).message)
        }
    }

    function categoriesCheckListener(category: string, checked: boolean) {

        if (!selectedCategories) {
            console.warn("Categories check listener fired without being initialized")
            return
        }

        let newSelectedCategories = [...selectedCategories]
        if (checked) {
            newSelectedCategories.push(category)
        } else {
            _.remove(newSelectedCategories, x => x === category)
        }
        console.log("newSelectedCategories = ", newSelectedCategories)
        setSelectedCategories(newSelectedCategories)
    }

    function onQuestionDurationChange(duration: number) {
        console.debug(`Question duration changed to: ${duration}`)
        setQuestionDuration(duration)
    }

    function onStartClicked() {
        dispatch(setHostConfig(
            {
                categories: selectedCategories!,
                duration: questionDuration,
                quizName: quizName,
                selectedQuestionIndexes: selectedQuestionIndexes,
            }
        ))
    }

    const startButtonEnabled = quizName &&
        selectedCategories && selectedCategories!.length > 0 &&
        questionDuration > 0 &&
        questionsAndAnswers && selectedQuestionIndexes.length > 0 &&
        leaderboard.length > 0

    return (
        <Box
            sx={{
                flexGrow: 1,
                // Position the container so the columns can be positioned relative to it
                position: "relative",
                minWidth: "100%",
            }}
        >
            <UploadModal
                open={modalOpen}
                onUpload={onModalUploadClicked}
                uploadErrMsg={uploadErrMsg}
            />
            <ConfigColumn
                accessCode={quizId!}
                onQuizNameChange={onQuizNameChange}
                onUploadQuizClicked={onUploadQuizClicked}
                onQuestionDurationChange={onQuestionDurationChange}
                categories={categories}
                selectedCategories={selectedCategories}
                categoriesCheckListener={categoriesCheckListener}
            />

            <QuestionColumn
                loading={fetchingQuestions}
                questionsAndAnswers={filteredQuestionsAndAnswers}
            />

            <ParticipantColumn
                participants={leaderboard}
                onStartClicked={onStartClicked}
                startDisabled={!startButtonEnabled}
            />
        </Box>
    )
}

export default Config;
import { Box, Button, Card, CircularProgress, Collapse, Fab, Fade, FormGroup, TextField, Typography } from "@mui/material";
import React, { useState } from "react";
import { uploadQuiz } from "../../api/quizUpload";
import { IQuestionAndAnswers } from "../../types";
import { useAppDispatch, useAppSelector } from "../../hooks";
import { selectLeaderboard, selectQuizId } from "../../slices/common";
import { selectHostQuestions, selectSetRequestQuestions, setHostConfig, setRequestQuestions } from "../../slices/host";
import { ILeaderboardItem } from "../../types";
import ParticipantList from "../common/participantList/ParticipantList";
import _ from "lodash";
import UploadModal from "./UploadModal";
import QuizNameBlock from "./QuizNameBlock";
import QuizAccessCode from "./QuizAccessCode";
import CategoriesBlock from "./CategoriesBlock";
import QuestionDurationBlock from "./QuestionDurationBlock";
import { OptionMode } from "../common/question/Option";
import QuestionCard from "../common/question/QuestionCard";
import theme, { scrollbarMixin } from "../../themes/theme";

const COLUMN_WIDTH = "340px"
interface IConfigColumnProps {
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
const ColumnElementWrapper = (props: { children: React.ReactNode, marginTop?: number }) => (
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
                <ColumnElementWrapper>
                    <QuizNameBlock onQuizNameChange={onQuizNameChange} />
                </ColumnElementWrapper>
                <ColumnElementWrapper>
                    <Button
                        variant="contained"
                        component="label"
                        onClick={props.onUploadQuizClicked}
                    >
                        Upload Quiz
                    </Button>
                </ColumnElementWrapper>
                {/* Uncollapse these ui elements */}
                <Collapse
                    orientation="vertical"
                    in={categoryBlock !== undefined && questionDurationBlock !== undefined}
                >
                    <ColumnElementWrapper marginTop={0}>
                        {categoryBlock}
                    </ColumnElementWrapper>
                    <ColumnElementWrapper>
                        {questionDurationBlock}
                    </ColumnElementWrapper>
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
                <Box
                    marginTop={3}
                    marginBottom={3}
                >
                    <QuestionCard
                        question={question}
                        numCorrectOptions={answers.length}
                        options={optionsAndMode}
                    />
                </Box>
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
            maxWidth={theme.spacing(100)}
            width={`calc(100% - ${COLUMN_WIDTH} - ${COLUMN_WIDTH})`}
            sx={{
                transform: "translateX(-50%)",
                overflowY: "auto",
                ...scrollbarMixin
            }}
        >
            {content}
        </Box>
    )
}

interface IParticipantColumnProps {
    accessCode: string,
    participants: ILeaderboardItem[],
}

function ParticipantColumn(props: IParticipantColumnProps) {

    const { participants } = props

    return (
        <Box
            // Position on the rhs
            position="absolute"
            top="0"
            right="0"
            bottom="0"
            width={COLUMN_WIDTH}
            sx={{
                overflowY: "auto",
                ...scrollbarMixin,
            }}
        >
            <Card
                sx={{
                    margin: 3
                }}
            >
                <ColumnElementWrapper>
                    <QuizAccessCode accessCode={props.accessCode} />
                </ColumnElementWrapper>
            </Card>
            <ParticipantList
                otherParticipants={participants}
                sx={{
                    marginLeft: 3,
                    marginRight: 3,
                }}
            />
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

    const startButtonEnabled = (quizName &&
        selectedCategories && selectedCategories!.length > 0 &&
        questionDuration > 0 &&
        questionsAndAnswers && selectedQuestionIndexes.length > 0 &&
        leaderboard.length > 0) || false

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
                accessCode={quizId!}
                participants={leaderboard}
            />
            <Fade in={startButtonEnabled}>
                <Fab
                    variant="extended"
                    color="primary"
                    disabled={!startButtonEnabled}
                    onClick={onStartClicked}
                    sx={{
                        width: theme.spacing(16),
                        borderRadius: 4,
                        // Centre in the middle of the participants column
                        position: "absolute",
                        bottom: theme.spacing(5),
                        right: `calc(170px - ${theme.spacing(8)})`, // = half column width - half button width,
                        display: startButtonEnabled ? "inherit" : "none" // hide the button when not enabled
                    }}
                >
                    Start
                </Fab>
            </Fade>
        </Box>
    )
}

export default Config;
import { LoadingButton } from "@mui/lab";
import { Box, Button, Checkbox, CircularProgress, Container, FormControlLabel, FormGroup, Input, Link, Modal, Stack, TextField, Typography } from "@mui/material";
import React, { useRef, useState } from "react";
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
import { useNavigate } from "react-router-dom";


const COLUMN_WIDTH = "320px"

interface IUploadModalProps {
    open: boolean,
    onUpload: (file: File) => Promise<void>,
    // Show an error on the dialog. This will only arise if validation of the previously
    // uploaded file failed.
    uploadErrMsg?: string,
}

function UploadModal(props: IUploadModalProps): JSX.Element {

    const fileInput = useRef<HTMLInputElement>(null)
    const [fileSelected, setFileSelected] = useState(false)
    const [isUploading, setIsUploading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsUploading(true)
        if (fileInput.current != null) {
            const files = fileInput.current.files!
            await props.onUpload(files[0])
            setFileSelected(false)
            if (fileInput.current) {
                // clear the form element. This is needed in case of errors uploading which gets displayed
                // via the uploadErrMsg prop
                fileInput.current.value = ""
            }
        }
        setIsUploading(false)
    }

    const handleFileSelected = () => {
        setFileSelected(true)
    }

    const uploadErrMsgComponent = !fileSelected && props.uploadErrMsg
        ? <Typography color="red" variant="caption">{props.uploadErrMsg}</Typography>
        : undefined

    return (
        <Modal
            open={props.open}
        >
            <Box
                sx={{
                    // Position in the centre of the window
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: 'translate(-50%, -50%)',
                    width: "500px",
                    backgroundColor: "whitesmoke",
                    border: "1px solid black",
                    borderRadius: "12px",
                    padding: "24px"
                }}
            >
                <Typography
                    variant="h4"
                    textAlign="center"
                    marginBottom="24px"
                >Upload Quiz</Typography>
                <form onSubmit={handleSubmit}>
                    <Stack
                        justifyContent="center"
                        alignItems="center"
                    >
                        <Input
                            required
                            disableUnderline
                            type="file"
                            inputRef={fileInput}
                            margin="none"
                            onInput={handleFileSelected}
                        />
                        {uploadErrMsgComponent}
                        <LoadingButton
                            type="submit"
                            disabled={!fileSelected}
                            loading={isUploading}
                        >Upload</LoadingButton>
                    </Stack>
                </form>
            </Box>
        </Modal>
    )
}

interface IQuizNameBlockProps {
    onQuizNameChange: (name: string) => void
}

function QuizNameBlock(props: IQuizNameBlockProps): JSX.Element {
    return (
        <Box>
            <Typography variant="h4">Quiz Name</Typography>
            <TextField
                id="outlined-number"
                label="Name"
                type="text"
                InputLabelProps={{
                    shrink: true,
                }}
                onChange={(event) => props.onQuizNameChange(event.target.value)}
            />
        </Box>
    )
}

interface ICategoriesBlockProps {
    categories: string[],
    selectedCategories: string[],
    checkListener: (category: string, checked: boolean) => void
}

function CategoriesBlock(props: ICategoriesBlockProps): JSX.Element {

    const { categories, selectedCategories, checkListener } = props

    const handleCheckChange = (event: React.ChangeEvent<HTMLInputElement>, category: string) => {
        const newCheckState = event.target.checked
        console.log("Categories block handleCheckChange new check state:", newCheckState)
        checkListener(category, newCheckState)
    }

    const items = categories.map(category => {
        const isChecked = selectedCategories.includes(category)
        return (
            <FormControlLabel
                key={category}
                label={category}
                checked={isChecked}
                control={
                    <Checkbox
                        onChange={e => handleCheckChange(e, category)}
                    />
                }
                sx={{
                    // Dont highlight the text
                    userSelect: "none"
                }}
            />
        )
    })

    return (
        <Box>
            <Typography variant="h4">Categories</Typography>
            <FormGroup>
                {items}
            </FormGroup>
        </Box>
    )
}

interface IQuestionDurationBlockProps {
    onDurationChanged: (duration: number) => void
}

function QuestionDurationBlock(props: IQuestionDurationBlockProps) {

    return (
        <Box>
            <Typography variant="h4">Question Duration</Typography>
            <TextField
                id="outlined-number"
                label="Number"
                type="number"
                helperText="seconds"
                InputLabelProps={{
                    shrink: true,
                }}
                onChange={(event) => props.onDurationChanged(parseInt(event.target.value))}
            />
        </Box>
    )
}

interface IConfigColumnProps {
    inviteUrl?: string,
    onUploadQuizClicked: () => void,
    onQuestionDurationChange: (duration: number) => void,
    onQuizNameChange: (name: string) => void,
    categories?: string[],
    selectedCategories?: string[],
    categoriesCheckListener: (category: string, checked: boolean) => void
}

function ConfigColumn(props: IConfigColumnProps) {

    const {onQuestionDurationChange, onQuizNameChange, categories, selectedCategories, categoriesCheckListener} = props

    // TODO: make it so the link can be copied but not followed 
    const inviteLinkComponent = props.inviteUrl ? <Typography variant={"body1"}>
        Invite participants with this link: <Link>{props.inviteUrl}</Link>
    </Typography> : null;

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
            {inviteLinkComponent}
            <QuizNameBlock onQuizNameChange={onQuizNameChange} />
            <Button
                variant="contained"
                component="label"
                onClick={props.onUploadQuizClicked}
            >
                Upload Quiz
            </Button>
            {categoryBlock}
            {questionDurationBlock}
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
                overflowY: "scroll",
                transform: "translateX(-50%)" // There's no direct prop for this, hence its here
            }}
        >
            {content}
        </Box>
    )
}

interface IParticipantColumnProps {
    participants: ILeaderboardItem[],
    onStartClicked: () => void
}

function ParticipantColumn(props: IParticipantColumnProps) {

    const { participants, onStartClicked } = props

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
            <Button variant="contained" onClick={() => onStartClicked()}>Start</Button>
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
    let navigate = useNavigate();

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
        } catch(e) {
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

    return (
        <Container
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
                inviteUrl={`${window.location.origin}/join/${quizId}`}
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
            />
        </Container>
    )
}

export default Config;
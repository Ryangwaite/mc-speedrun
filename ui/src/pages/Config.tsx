import { Box, Button, Card, CircularProgress, Collapse, Drawer, SxProps, Theme, } from "@mui/material";
import React,{ useState } from "react";
import { uploadQuiz } from "../api/quizUpload";
import { IQuestionAndAnswers, PageVariant } from "../types";
import { useAppDispatch, useAppSelector, usePageVariant } from "../hooks";
import { selectLeaderboard, selectQuizId } from "../slices/common";
import { selectHostQuestions, selectSetRequestQuestions, setHostConfig, setRequestQuestions } from "../slices/host";
import { ILeaderboardItem } from "../types";
import ParticipantList from "../components/common/participantList/ParticipantList";
import _ from "lodash";
import UploadModal from "../components/host/UploadModal";
import QuizNameBlock from "../components/host/QuizNameBlock";
import QuizAccessCode from "../components/host/QuizAccessCode";
import CategoriesBlock from "../components/host/CategoriesBlock";
import QuestionDurationBlock from "../components/host/QuestionDurationBlock";
import { OptionMode } from "../components/common/question/Option";
import QuestionCard, { QuestionCardVariant } from "../components/common/question/QuestionCard";
import theme, { COLUMN_MARGIN_TOP, scrollbarMixin } from "../themes/theme";
import StartFab from "../components/host/StartFab";

const COLUMN_WIDTH = "340px"

interface IConfigSectionProps {
    variant: PageVariant,
    onUploadQuizClicked: () => void,
    questionDuration: number,
    onQuestionDurationChange: (duration: number) => void,
    quizName: string,
    onQuizNameChange: (name: string) => void,
    categories?: string[],
    selectedCategories?: string[],
    categoriesCheckListener: (category: string, checked: boolean) => void
}

// Wrapper for consistent gaps between config elements in the config column
// NOTE: Defined here as opposed to inside the ConfigColumn function body
//       to maintain focus on input elemenst across re-renders.
const SectionElementWrapper = (props: { children: React.ReactNode, sx?: SxProps<Theme> }) => (
    <Box
        sx={{
            margin: 3,
            ...props.sx,
        }}
    >
        {props.children}
    </Box>
)

function ConfigSection(props: IConfigSectionProps) {

    const {
        variant,
        questionDuration, onQuestionDurationChange,
        quizName, onQuizNameChange,
        categories, selectedCategories, categoriesCheckListener
    } = props

    // Only show these elements when the quiz has been uploaded to the backend, which is signalled
    // by the categories being present
    const categoryBlock = categories
        ? (<CategoriesBlock categories={categories} selectedCategories={selectedCategories!} checkListener={categoriesCheckListener} />)
        : undefined
    const questionDurationBlock = categories ? <QuestionDurationBlock questionDuration={questionDuration} onDurationChanged={onQuestionDurationChange} /> : undefined
    const quizNameBlock = <QuizNameBlock quizName={quizName} onQuizNameChange={onQuizNameChange} />
    const uploadButton = <Button variant="contained" component="label" onClick={props.onUploadQuizClicked}>Upload Quiz</Button>

    // Flag for animating in
    const collapseIn = categoryBlock !== undefined && questionDurationBlock !== undefined

    switch (variant) {
        case PageVariant.SMALL:
            return (
                <Card
                    sx={{
                        display: "flex",
                        flexDirection: "column",
                    }}
                >
                    <SectionElementWrapper sx={{gridArea: "question-name"}}>
                        {quizNameBlock}
                    </SectionElementWrapper>
                    <SectionElementWrapper
                        sx={{
                            marginTop: 0,
                        }}
                    >
                        {uploadButton}
                    </SectionElementWrapper>
                    <Collapse
                        orientation="vertical"
                        in={collapseIn}
                    >
                        <SectionElementWrapper
                            sx={{
                                marginTop: 0,
                            }}
                        >
                            {categoryBlock}
                        </SectionElementWrapper>
                    </Collapse>
                    <Collapse
                        orientation="vertical"
                        in={collapseIn}
                    >
                        <SectionElementWrapper
                            sx={{
                                marginTop: 0,
                            }}
                        >
                            {questionDurationBlock}
                        </SectionElementWrapper>
                    </Collapse>
                </Card>
            )
        case PageVariant.MEDIUM:
        return (
                <Card
                    sx={{
                        display: "grid",
                        gridTemplateColumns: `${theme.spacing(30)} ${theme.spacing(40)}`,
                        gridTemplateRows: "auto auto",
                        gridTemplateAreas: `'question-name      upload-btn'
                                            'categories         question-duration'`,
                    }}
                >
                    <SectionElementWrapper sx={{gridArea: "question-name"}}>
                        {quizNameBlock}
                    </SectionElementWrapper>
                    <SectionElementWrapper
                        sx={{
                            gridArea: "upload-btn",
                            justifySelf: "start",
                            alignSelf: "end",
                            marginBottom: 4.5, // horizontally align with the center of quiz name box
                        }}
                    >
                        {uploadButton}
                    </SectionElementWrapper>
                    <Collapse
                        orientation="vertical"
                        in={collapseIn}
                    >
                        <SectionElementWrapper sx={{gridArea: "categories", marginTop: 0,}}>
                            {categoryBlock}
                        </SectionElementWrapper>
                    </Collapse>
                    <Collapse
                        orientation="vertical"
                        in={collapseIn}
                    >
                        <SectionElementWrapper sx={{gridArea: "question-duration", marginTop: 0,}}>
                            {questionDurationBlock}
                        </SectionElementWrapper>
                    </Collapse>
                </Card>
            )
        case PageVariant.LARGE:
            return (
                <Card>
                    <SectionElementWrapper>
                        {quizNameBlock}
                    </SectionElementWrapper>
                    <SectionElementWrapper>
                        {uploadButton}
                    </SectionElementWrapper>
                    {/* Uncollapse these ui elements */}
                    <Collapse
                        orientation="vertical"
                        in={collapseIn}
                    >
                        <SectionElementWrapper sx={{marginTop: 0}}>
                            {categoryBlock}
                        </SectionElementWrapper>
                        <SectionElementWrapper>
                            {questionDurationBlock}
                        </SectionElementWrapper>
                    </Collapse>
                </Card>
            )
    }
}

interface IQuestionColumnProps {
    variant: PageVariant,
    questionsAndAnswers: IQuestionAndAnswers[],
    loading: boolean,
}

function QuestionColumn(props: IQuestionColumnProps) {

    const { variant, questionsAndAnswers, loading } = props

    let content: React.ReactNode[] | React.ReactNode

    if (loading) {
        content = <CircularProgress />
    } else if (props.questionsAndAnswers) {
        let renderedQuestions: React.ReactNode[] = []
        for (const questionAndAnswer of questionsAndAnswers) {
            const { question, options, answers } = questionAndAnswer;

            const optionsAndMode = options.map((value, index) => ({
                text: value,
                mode: answers.includes(index) ? OptionMode.SELECTED_AND_MARKED_CORRECT : OptionMode.PLAIN,
            }))

            let questionCardVariant = {
                [PageVariant.SMALL]: QuestionCardVariant.COLUMN,
                [PageVariant.MEDIUM]: QuestionCardVariant.BOX,
                [PageVariant.LARGE]: QuestionCardVariant.ROW,
            }[variant]

            renderedQuestions.push(
                <Box
                    marginTop={COLUMN_MARGIN_TOP}
                    marginBottom={3}
                >
                    <QuestionCard
                        variant={questionCardVariant}
                        question={question}
                        numCorrectOptions={answers.length}
                        options={optionsAndMode}
                    />
                </Box>
            )
        }
        content = renderedQuestions
    } else {
        content = null
    }

    switch (variant) {
        case PageVariant.SMALL:
        case PageVariant.MEDIUM:
        case PageVariant.LARGE:
            return (
                <>
                    {content}
                </>
            )
    }
}

interface IParticipantSectionProps {
    variant: PageVariant,
    accessCode: string,
    participants: ILeaderboardItem[],
}

function ParticipantSection(props: IParticipantSectionProps) {

    // This is just for the small view
    const [participantDrawerOpen, setParticipantDrawerOpen] = useState(false)

    const { variant, accessCode, participants } = props

    switch (variant) {
        case PageVariant.SMALL:
            return (
                <>
                    <Card
                        sx={{
                            marginTop: COLUMN_MARGIN_TOP,
                        }}
                    >
                        <SectionElementWrapper>
                            <QuizAccessCode
                                accessCode={accessCode}
                                showMenu={true}
                                menuBadge={participants.length.toString()}
                                menuClicked={() => setParticipantDrawerOpen(true)}
                            />
                        </SectionElementWrapper>
                    </Card>
                    <Drawer
                        anchor="right"
                        open={participantDrawerOpen}
                        onClose={() => setParticipantDrawerOpen(false)}
                        PaperProps={{
                            sx: {
                                backgroundColor: theme.palette.grey[100],
                            }
                        }}
                    >
                        <ParticipantList
                            otherParticipants={participants}
                            sx={{
                                padding: 3,
                                width: COLUMN_WIDTH,
                            }}
                        />
                    </Drawer>
                    
                </>
            )
        case PageVariant.MEDIUM:
        case PageVariant.LARGE:
            return (
                <>
                    <Card
                        sx={{
                            marginTop: COLUMN_MARGIN_TOP,
                        }}
                    >
                        <SectionElementWrapper>
                            <QuizAccessCode
                                accessCode={accessCode}
                                showMenu={false}
                                menuBadge=""
                                menuClicked={() => null}
                            />
                        </SectionElementWrapper>
                    </Card>
                    <ParticipantList
                        otherParticipants={participants}
                        sx={{
                            marginTop: 3,
                        }}
                    />
                </>
            )
    }
}

interface IConfigPageContainerProps {
    variant: PageVariant,
    configSection: React.ReactNode | React.ReactNode[],
    questionSection: React.ReactNode | React.ReactNode[],
    participantSection: React.ReactNode | React.ReactNode[],
    startFab: React.ReactNode | React.ReactNode[],
}

function ConfigPageContainer(props: IConfigPageContainerProps) {
    const { variant, configSection, questionSection, participantSection, startFab } = props

    switch (variant) {
        case PageVariant.SMALL:
            return (
                <>
                    <Box
                        sx={{
                            position: "absolute",
                            top: 0,
                            bottom: 0,
                            left: 0,
                            right: 0,
                            overflowY: "auto",
                            ...scrollbarMixin,
                        }}
                    >
                        <Box
                            marginLeft={3}
                            marginRight={3}
                        >
                            {participantSection}
                        </Box>
                        <Box
                            margin={3}
                        >
                            {configSection}
                        </Box>
                        <Box
                            marginLeft={3}
                            marginRight={3}
                        >
                            {questionSection}
                        </Box>
                        <Box
                            height={100}
                        >
                            {/* Spacer so the start button doesn't overlap any content at the bottom of the screen */}
                        </Box>
                    </Box>
                    <Box
                        sx={{
                            // Centre in the middle of the participants column
                            position: "fixed",
                            bottom: theme.spacing(5),
                            left: "50%", // NOTE: the translateX(-50%) to position in centre
                            transform: "translateX(-50%)",
                        }}
                    >
                        {startFab}
                    </Box>
                </>
            )
        case PageVariant.MEDIUM:
            return (
                <>
                    <Box
                        sx={{
                            position: "absolute",
                            top: 0,
                            bottom: 0,
                            left: 0,
                            right: 0,
                            overflowY: "auto",
                            ...scrollbarMixin,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                        }}
                    >
                        <Box
                            margin={3}
                            marginTop={COLUMN_MARGIN_TOP}
                        >
                            {configSection}
                        </Box>
                        <Box
                            display={"flex"}
                            flexDirection={"row"}
                            sx={{
                                alignItems: "stretch",
                                justifyContent: "stretch",
                            }}
                        >
                            <Box
                                sx={{
                                    marginLeft: 3,
                                    marginRight: 1.5,
                                }}
                            >
                                {questionSection}
                            </Box>
                            <Box
                                sx={{
                                    marginLeft: 1.5,
                                    marginRight: 3,
                                }}
                            >
                                {participantSection}
                            </Box>
                        </Box>
                    </Box>
                    <Box
                        sx={{
                            // Centre in the middle of the participants column
                            position: "fixed",
                            bottom: theme.spacing(5),
                            right: `calc(170px - ${theme.spacing(8)})`, // = half column width - half button width,
                        }}
                    >
                        {startFab}
                    </Box>
                </>
            )
        case PageVariant.LARGE:
            return (
                <>
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
                        margin={3}
                        marginTop={COLUMN_MARGIN_TOP}
                        sx={{
                            overflowY: "auto",
                        }}
                    >
                        {configSection}
                    </Box>
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
                        {questionSection}
                    </Box>
                    <Box
                        // Position on the rhs
                        position="absolute"
                        top="0"
                        right="0"
                        bottom="0"
                        width={COLUMN_WIDTH}
                        sx={{
                            paddingRight: 3,
                            paddingLeft: 3,
                            overflowY: "auto",
                            ...scrollbarMixin,
                        }}
                    >
                        {participantSection}
                    </Box>
                    <Box
                        sx={{
                            // Centre in the middle of the participants column
                            position: "fixed",
                            bottom: theme.spacing(5),
                            right: `calc(170px - ${theme.spacing(8)})`, // = half column width - half button width,
                        }}
                    >
                        {startFab}
                    </Box>
                </>
            )
    }
}


interface IConfigProps {
}

function Config(props: IConfigProps) {

    const pageVariant = usePageVariant()

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
                // Position the container so the content can be positioned relative to it
                position: "relative",
                minWidth: "100%",
            }}
        >
            <UploadModal
                open={modalOpen}
                onUpload={onModalUploadClicked}
                uploadErrMsg={uploadErrMsg}
            />
            <ConfigPageContainer
                variant={pageVariant}
                configSection={
                    <ConfigSection
                        variant={pageVariant}
                        quizName={quizName}
                        onQuizNameChange={onQuizNameChange}
                        onUploadQuizClicked={onUploadQuizClicked}
                        questionDuration={questionDuration}
                        onQuestionDurationChange={onQuestionDurationChange}
                        categories={categories}
                        selectedCategories={selectedCategories}
                        categoriesCheckListener={categoriesCheckListener}
                    />
                }
                questionSection={
                    <QuestionColumn
                        variant={pageVariant}
                        loading={fetchingQuestions}
                        questionsAndAnswers={filteredQuestionsAndAnswers}
                    />
                }
                participantSection={
                    <ParticipantSection
                        variant={pageVariant}
                        accessCode={quizId!}
                        participants={leaderboard}
                    />
                }
                startFab={
                    <StartFab
                        enabled={startButtonEnabled}
                        onStartClicked={onStartClicked}
                    />
                }
            />
        </Box>
    )
}

export default Config;
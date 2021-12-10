import React, { useState } from "react";
import { Button, Typography, Box, Link, FormGroup, FormControlLabel, Checkbox, TextField, Container} from "@mui/material";
import { IQuestionAndAnswers, SAMPLE_QUESTIONS_AND_ANSWERS } from "../../const";
import { OptionMode, QuestionCard } from "../common/Question";
import { LEADERBOARD_COLUMN_WIDTH } from "../common/Leaderboard";
import ParticipantList from "../common/ParticipantList";
import { ILeaderboardItem } from "../../types";
import { useAppSelector } from "../../hooks";
import { selectLeaderboard, selectQuizId } from "../../slices/common";


const COLUMN_WIDTH = "320px"

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
    categories: string[]
}

function CategoriesBlock(props: ICategoriesBlockProps): JSX.Element {

    const { categories } = props

    return (
        <Box>
            <Typography variant="h4">Categories</Typography>
            <FormGroup>
                {categories.map(category => <FormControlLabel key={category} control={<Checkbox />} label={category} />)}
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
    onQuestionDurationChange: (duration: number) => void,
    onQuizNameChange: (name: string) => void,
}

function ConfigColumn(props: IConfigColumnProps) {

    const { onQuestionDurationChange, onQuizNameChange } = props

    // TODO: make it so the link can be copied but not followed 
    const inviteLinkComponent = props.inviteUrl ? <Typography variant={"body1"}>
        Invite participants with this link: <Link>{props.inviteUrl}</Link>
    </Typography> : null;

    const categories = ["category1", "category2", "category3", "category4"]

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
            <CategoriesBlock categories={categories} />
            <QuestionDurationBlock onDurationChanged={onQuestionDurationChange}/>
        </Box>
    )
}

interface IQuestionColumnProps {
    questionsAndAnswers: IQuestionAndAnswers[]
}

function QuestionColumn(props: IQuestionColumnProps) {

    let renderedQuestions: React.ReactNode[] = []
    for (const questionAndAnswer of props.questionsAndAnswers) {
        const {question, options, answers} = questionAndAnswer;

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
            {renderedQuestions}
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

    const [quizName, setQuizName] = useState("")
    const [questionDuration, setQuestionDuration] = useState(120)

    const quizId = useAppSelector(state => selectQuizId(state))
    const leaderboard = useAppSelector(state => selectLeaderboard(state))

    function onQuizNameChange(name: string) {
        console.debug(`Quiz name change to: ${name}`)
        setQuizName(name)
    }

    function onQuestionDurationChange(duration: number) {
        console.debug(`Question duration changed to: ${duration}`)
        setQuestionDuration(duration)
    }

    function onStartClicked() {
        alert("Start clicked")
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
            
            <ConfigColumn
                inviteUrl={`${window.location.origin}/join/${quizId}`}
                onQuizNameChange={onQuizNameChange}
                onQuestionDurationChange={onQuestionDurationChange}
            />
        
            <QuestionColumn questionsAndAnswers={SAMPLE_QUESTIONS_AND_ANSWERS} />
        
            <ParticipantColumn
                participants={leaderboard}
                onStartClicked={onStartClicked}
            />
        </Container>
    )
}

export default Config;
import React, { ReactElement } from "react";
import { Button, Grid, Typography, Box, Link, FormGroup, FormControlLabel, Checkbox, TextField, Container} from "@mui/material";
import { IQuestionAndAnswers, SAMPLE_QUESTIONS_AND_ANSWERS } from "../const";
import { QuestionCard } from "../common/Question";
import { LeaderBoard, LEADERBOARD_COLUMN_WIDTH } from "../common/Leaderboard";


const COLUMN_WIDTH = "320px"

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
    onQuestionDurationChange: (duration: number) => void
}

interface IConfigColumnState { }

class ConfigColumn extends React.Component<IConfigColumnProps, IConfigColumnState> {
    constructor(props: IConfigColumnProps) {
        super(props);
        this.state = {}
    }

    render() {

        const { onQuestionDurationChange } = this.props

        // TODO: make it so the link can be copied but not followed 
        const inviteLinkComponent = this.props.inviteUrl ? <Typography variant={"body1"}>
            Invite participants with this link: <Link>{this.props.inviteUrl}</Link>
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
                <CategoriesBlock categories={categories} />
                <QuestionDurationBlock onDurationChanged={onQuestionDurationChange}/>
            </Box>
        )
    }
}

interface IQuestionColumnProps {
    questionsAndAnswers: IQuestionAndAnswers[]
}

function QuestionColumn(props: IQuestionColumnProps) {

    let renderedQuestions: React.ReactNode[] = []
    for (const questionAndAnswer of props.questionsAndAnswers) {
        const {question, options, answers} = questionAndAnswer;
        renderedQuestions.push(
            <QuestionCard
                question={question}
                options={options}
                correctAnswers={answers}
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
    onStartClicked: () => void
}

function ParticipantColumn(props: IParticipantColumnProps) {

    const participants: Set<string> = new Set(Array.from(Array(10).keys()).map(x => `participant ${x}`));

    const { onStartClicked } = props

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
            <LeaderBoard />
            <Button variant="contained" onClick={() => onStartClicked()}>Start</Button>
        </Box>
    )
}

interface IConfigProps {
}

interface IConfigState {
    questionDuration: number // seconds
}

class Config extends React.Component<IConfigProps, IConfigState> {
    constructor(props: IConfigProps) {
        super(props)
        this.state = {
            questionDuration: 120
        }

        this.onQuestionDurationChange = this.onQuestionDurationChange.bind(this)
        this.onStartClicked = this.onStartClicked.bind(this)
    }

    onQuestionDurationChange(duration: number) {
        console.log(`Question duration changed to: ${duration}`)
        this.setState({
            questionDuration: duration
        })
    }

    onStartClicked() {
        alert("Start clicked")
    }

    render() {

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
                    inviteUrl={"https://localhost/join/kjb34kj5h"}
                    onQuestionDurationChange={this.onQuestionDurationChange}
                />
            
                <QuestionColumn questionsAndAnswers={SAMPLE_QUESTIONS_AND_ANSWERS} />
            
                <ParticipantColumn onStartClicked={this.onStartClicked} />
            </Container>
        )
    }
}

export default Config;
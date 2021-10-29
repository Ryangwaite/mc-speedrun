import React, { ReactElement } from "react";
import { Button, Grid, Typography, Box, Link, FormGroup, FormControlLabel, Checkbox, TextField} from "@mui/material";
import ParticipantList from "../common/ParticipantList";
import { APP_BAR_HEIGHT } from "../common/AppBar";
import { IQuestionAndAnswers, SAMPLE_QUESTIONS_AND_ANSWERS } from "../const";
import { QuestionCard } from "../common/Question";


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
                display="flex"
                flexDirection="column"
                sx={{
                    overflowY: "auto",
                    height: `calc(100vh - ${APP_BAR_HEIGHT})`
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
                answers={answers}
            />
        )
    }

    return (
        <Box
            sx={{
                overflow: "scroll"
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
            sx={{
                overflowY: "auto",
                height: `calc(100vh - ${APP_BAR_HEIGHT})`
            }}
        >
            <Typography variant="h4">Participants</Typography>
            <ParticipantList otherParticipants={participants} thisParticipant={null} />
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
            <Grid
                container
                sx={{
                    // height: "90vh"
                }}
            >
                <Grid
                    item
                    xs={2}
                    sx={{
                        border: "1px solid red"
                    }}
                >
                    <ConfigColumn
                        inviteUrl={"https://localhost/join/kjb34kj5h"}
                        onQuestionDurationChange={this.onQuestionDurationChange}
                    />
                </Grid>
                <Grid
                    item
                    xs={8}
                    sx={{
                        border: "1px solid green"
                    }}
                >
                    <QuestionColumn questionsAndAnswers={SAMPLE_QUESTIONS_AND_ANSWERS} />
                </Grid>
                <Grid
                    item
                    xs={2}
                    sx={{
                        border: "1px solid blue",
                        minHeight: `calc(100% - ${APP_BAR_HEIGHT})`
                    }}
                >
                    <ParticipantColumn onStartClicked={this.onStartClicked} />
                </Grid>
            </Grid>
        )
    }
}

export default Config;
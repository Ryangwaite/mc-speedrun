import { Box, Typography, Card, LinearProgress, Button, } from "@mui/material";
import _ from "lodash";
import React from "react";
import { LeaderboardColumn } from "./Leaderboard";
import { QuestionCardWithStats } from "./Question";
import { IQuestionAndAnswers, IQuestionAnswerStats, SAMPLE_QUESTIONS_AND_ANSWERS, SAMPLE_QUESTION_STATS } from "../const";

interface IProgressSectionProps {
    progressCurrent: number,        // i.e. how many participants have finished
    progressTotal: number,          // i.e. how many total participants
}

function ProgressSection(props: IProgressSectionProps) {
    const {progressCurrent, progressTotal} = props
    
    if (progressCurrent == progressTotal) {
        // All Participants have finished
        return (
            <Box
                margin="16px"
            >
                <Typography
                    variant="h4"
                    fontWeight="bold"
                    color="green"
                >Complete!</Typography>
                <Button
                    variant="outlined"
                    color="error"       // Not actually an error but its an easy way to make it red
                    sx={{
                        margin: "4px"
                    }}
                >RETURN TO HOME</Button>
            </Box>
        )
    } else {
        // Some participants are still going
        const progress = (progressCurrent / progressTotal) * 100
        return (
            <Box
                margin="16px"
            >
                <Typography variant="h4">In progress...</Typography>
                <Typography variant="subtitle1">{progressCurrent}/{progressTotal} finished</Typography>
                <LinearProgress value={progress} variant="determinate"/>
            </Box>
        )
    }
}

interface IStatCardProps {
    value: string,
    label: string,
}

function StatCard(props: IStatCardProps) {

    const {label, value} = props

    return (
        <Card
            sx={{
                // Position this so the label can be positioned relative to it
                position: "relative",
                width: "256px",
                height: "164px",
                margin: "16px",
                // Centre the value in the middle
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
            }}
        >
            <Typography variant="h2">{value}</Typography>
            <Typography
                variant="h6"
                color="gray"
                position="absolute"
                right="0"
                bottom="0"
                marginRight="8px"
                marginBottom="8px"
            >{label}</Typography>
        </Card>
    )
}

interface ISummaryColumnProps {}

interface ISummaryColumnState { }

class SummaryColumn extends React.Component<ISummaryColumnProps, ISummaryColumnState> {
    constructor(props: ISummaryColumnProps) {
        super(props);
        this.state = {}
    }

    render() {

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
                maxWidth="320px" // TODO: Pull out to a const
                sx={{
                    overflowY: "auto",
                }}
            >
                <ProgressSection progressCurrent={15} progressTotal={15} />
                <StatCard value="5:21" label="Time elapsed" />
                <StatCard value="20s" label="Avg. answer time" />
            </Box>
        )
    }
}

interface IQuestionSectionProps {
    questionAndAnswersWithStats: {
        questions: IQuestionAndAnswers,
        stats: IQuestionAnswerStats,
    }[]
}

function QuestionSection(props: IQuestionSectionProps) {
    let renderedQuestions: React.ReactNode[] = []
    for (const {questions, stats} of props.questionAndAnswersWithStats) {
        renderedQuestions.push(
            <QuestionCardWithStats
                {...questions}
                correctAnswers={questions.answers}
                answerStats={stats}
                participantAnswers={[]} // So that none of them are marked
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

interface ISummaryProps {}

interface ISummaryState {}

class Summary extends React.Component<ISummaryProps, ISummaryState> {
    constructor(props: ISummaryProps) {
        super(props)
        this.state = {}
    }

    render() {

        const questionAndAnswers = SAMPLE_QUESTIONS_AND_ANSWERS.map(qAndA => ({...qAndA}))
        const questionStats = SAMPLE_QUESTION_STATS.map(stats => ({...stats}))
        const qAndAWithStats: {
            questions: IQuestionAndAnswers,
            stats: IQuestionAnswerStats,
        }[] = _.zipWith(questionAndAnswers, questionStats, (qAndA, stats) => {
            return {
                questions: qAndA,
                stats: stats,
            }
        })

        return (
            <Box
                // Position the container so the LeaderBoard and QuizSection can be positioned relative to it
                position="relative"
                sx={{
                    flexGrow: 1,
                    minWidth: "100%",
                    height: "100%",
                }}
            >
                <SummaryColumn />
                <QuestionSection questionAndAnswersWithStats={qAndAWithStats}/>
                <LeaderboardColumn />
            </Box>
        )
    }
}

export default Summary;
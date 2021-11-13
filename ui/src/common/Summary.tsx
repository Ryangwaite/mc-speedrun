import { Box, Typography, Card, LinearProgress, Button, } from "@mui/material";
import _ from "lodash";
import React from "react";
import { LeaderboardColumn } from "./Leaderboard";
import { OptionMode, QuestionCardWithStats } from "./Question";
import { IQuestionAndAnswers, IQuestionAnswerStats, SAMPLE_PARTICIPANTS, SAMPLE_QUESTIONS_AND_ANSWERS, SAMPLE_QUESTION_STATS } from "../const";

interface IProgressSectionProps {
    progressCurrent: number,        // i.e. how many participants have finished
    progressTotal: number,          // i.e. how many total participants
}

function ProgressSection(props: IProgressSectionProps) {
    const {progressCurrent, progressTotal} = props
    
    if (progressCurrent === progressTotal) {
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

function SummaryColumn(props: ISummaryColumnProps) {
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

interface IQuestionSectionProps {
    questionAndAnswersWithStats: {
        question: IQuestionAndAnswers,
        stats: IQuestionAnswerStats,
    }[]
}

function QuestionSection(props: IQuestionSectionProps) {
    let renderedQuestions: React.ReactNode[] = []
    for (const {question, stats} of props.questionAndAnswersWithStats) {

        const optionsAndMode = question.options.map((value, index) => ({
            text: value,
            mode: question.answers.includes(index) ? OptionMode.SELECTED_AND_MARKED_CORRECT : OptionMode.PLAIN,
        }))

        renderedQuestions.push(
            <QuestionCardWithStats
                question={question.question}
                numCorrectOptions={question.answers.length}
                options={optionsAndMode}
                answerStats={stats}
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

function Summary(props: ISummaryProps) {
    // Get some participants.
    // NOTE: if this isn't deep cloned, weird rendering things happen with multiple list items shown as selected
    const participants = SAMPLE_PARTICIPANTS.map(participant => ({...participant}))
    participants[10].selected = true // Make a "random" participant highlighted.

    const questionAndAnswers = SAMPLE_QUESTIONS_AND_ANSWERS.map(qAndA => ({...qAndA}))
    const questionStats = SAMPLE_QUESTION_STATS.map(stats => ({...stats}))
    const qAndAWithStats: {
        question: IQuestionAndAnswers,
        stats: IQuestionAnswerStats,
    }[] = _.zipWith(questionAndAnswers, questionStats, (qAndA, stats) => {
        return {
            question: qAndA,
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
            <LeaderboardColumn participants={participants} />
        </Box>
    )
}

export default Summary;
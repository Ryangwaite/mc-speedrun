import { Box, Typography } from "@mui/material";
import _ from "lodash";
import React from "react";
import { LeaderboardColumn } from "../common/Leaderboard";
import { QuestionCardWithStats } from "../common/Question";
import { IQuestionAndAnswers, IQuestionAnswerStats, SAMPLE_QUESTIONS_AND_ANSWERS, SAMPLE_QUESTION_STATS } from "../const";



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

interface IObserveProps {
}

interface IObserveState {
    
}

class Observe extends React.Component<IObserveProps, IObserveState> {
    constructor(props: IObserveProps) {
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
                <QuestionSection questionAndAnswersWithStats={qAndAWithStats}/>
                <LeaderboardColumn />
            </Box>
        )
    }
}

export default Observe;
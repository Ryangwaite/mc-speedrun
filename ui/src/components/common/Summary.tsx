import { Box, Typography, Card, LinearProgress, Button, Container, Stack, CircularProgress, } from "@mui/material";
import _ from "lodash";
import React, { useEffect, useState } from "react";
import { LeaderboardColumn } from "./Leaderboard";
import { OptionMode, QuestionCardWithStats } from "./Question";
import { ClientType, IHostQuestionSummary, IParticipantQuestionSummary,} from "../../types";
import { useAppDispatch, useAppSelector } from "../../hooks";
import { resetParticipantState, selectParticipantAvgAnswerTime, selectParticipantQuizSummary, selectParticipantTotalTimeElapsed, selectUserId } from "../../slices/participant";
import { resetCommonState, selectClientType, selectLeaderboard, selectTotalFinishedParticipants } from "../../slices/common";
import { resetHostState, selectHostAvgAnswerTime, selectHostQuizSummary, selectHostTotalTimeElapsed } from "../../slices/host";
import { useNavigate } from "react-router-dom";

interface IProgressSectionProps {
    progressCurrent: number,        // i.e. how many participants have finished
    progressTotal: number,          // i.e. how many total participants
    onReturnToHomeClicked: () => void
}

function ProgressSection(props: IProgressSectionProps) {
    const {progressCurrent, progressTotal, onReturnToHomeClicked} = props
    
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
                    onClick={onReturnToHomeClicked}
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

interface ISummaryColumnProps {
    numberParticipantsComplete: number,
    totalParticipants: number,
    onReturnToHomeClicked: () => void
    totalTimeElapsed: string,
    avgAnswerTime: string,
}

function SummaryColumn(props: ISummaryColumnProps) {
    const {numberParticipantsComplete, totalParticipants, onReturnToHomeClicked} = props
    const {totalTimeElapsed, avgAnswerTime} = props
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
            <ProgressSection progressCurrent={numberParticipantsComplete} progressTotal={totalParticipants} onReturnToHomeClicked={onReturnToHomeClicked} />
            <StatCard value={totalTimeElapsed} label="Time elapsed" />
            <StatCard value={avgAnswerTime} label="Avg. answer time" />
        </Box>
    )
}

interface IQuestionSectionProps {
    questionSummary: IHostQuestionSummary[] | IParticipantQuestionSummary[],
    loadingMessage: string,
}

function QuestionSection({questionSummary, loadingMessage}: IQuestionSectionProps) {

    if (questionSummary.length === 0) {
        return (
            <Stack
                alignContent="center"
                justifyContent="center"
                // Position
                position="absolute"
                top="0"
                bottom="0"
                left="50%" // NOTE: the translateX(-50%) to position in centre
                sx={{
                    transform: "translateX(-50%)" // There's no direct prop for this, hence its here
                }}
            >
                <CircularProgress
                    sx={{
                        marginLeft: "auto",
                        marginRight: "auto",
                        marginBottom: "4px"
                    }}
                />
                <Typography>{loadingMessage}</Typography>
            </Stack>
        )
    }

    let renderedQuestions: React.ReactNode[] = []
    for (const qs of questionSummary) {

        let optionsAndMode
        if ("participantOptions" in qs) {
            // PartipantQuestionSummary
            const participantOptions = qs.participantOptions
            const correctOptions = qs.correctOptions
            optionsAndMode = qs.options.map((value, index) => {
                let mode
                if (participantOptions.includes(index) && correctOptions.includes(index)) {
                    mode = OptionMode.SELECTED_AND_MARKED_CORRECT
                } else if (participantOptions.includes(index) && !correctOptions.includes(index)) {
                    mode = OptionMode.SELECTED_AND_MARKED_INCORRECT
                } else if (!participantOptions.includes(index) && !correctOptions.includes(index)) {
                    mode = OptionMode.PLAIN
                } else if (!participantOptions.includes(index) && correctOptions.includes(index)) {
                    mode = OptionMode.UNSELECTED_AND_MARKED_CORRECT
                } else {
                    throw Error("Unexpected OptionMode state")
                }
                return {text: value, mode}
            })
        } else {
            // HostQuestionSummary
            optionsAndMode = qs.options.map((value, index) => ({
                text: value,
                mode: qs.correctOptions.includes(index) ? OptionMode.SELECTED_AND_MARKED_CORRECT : OptionMode.PLAIN,
            }))
        }

        renderedQuestions.push(
            <QuestionCardWithStats
                question={qs.question}
                numCorrectOptions={qs.correctOptions.length}
                options={optionsAndMode}
                answerStats={{
                    correctAnswerers: qs.correctAnswerers.map(x => x.name),
                    incorrectAnswerers: qs.incorrectAnswerers.map(x => x.name),
                    timeExpiredAnswerers: qs.timeExpiredAnswerers.map(x => x.name),
                }}
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
                overflowY: "auto",
                transform: "translateX(-50%)" // There's no direct prop for this, hence its here
            }}
        >
            {renderedQuestions}
        </Box>
    )
}

interface ISummaryProps {}

function Summary(props: ISummaryProps) {

    let navigate = useNavigate();
    const dispatch = useAppDispatch()
    
    // App State
    const userId = useAppSelector(state => selectUserId(state))!
    const leaderboard = useAppSelector(state => selectLeaderboard(state))
    const totalFinishedParticipants = useAppSelector(state => selectTotalFinishedParticipants(state))
    const clientType = useAppSelector(state => selectClientType(state))
    // Note: the following are undefined before the first quizSummary has been received when arriving on this page
    const hostQuizSummary = useAppSelector(state => selectHostQuizSummary(state))
    const hostAvgAnswerTime = useAppSelector(state => selectHostAvgAnswerTime(state))
    const serverHostTotalTimeElapsed = useAppSelector(state => selectHostTotalTimeElapsed(state))
    const participantQuizSummary = useAppSelector(state => selectParticipantQuizSummary(state))
    const participantAvgAnswerTime = useAppSelector(state => selectParticipantAvgAnswerTime(state))
    const participantTotalTimeElapsed = useAppSelector(state => selectParticipantTotalTimeElapsed(state))
    
    // Local state
    const [hostTotalTimeElapsed, setHostTotalTimeElapsed] = useState(0)
    const [lastServerHostTotalTimeElapsed, setLastHostTotalTimeElaped] = useState(0)

    // Resync logic for local timer
    useEffect(() => {
        console.debug("Checking server total time elapsed")
        if (serverHostTotalTimeElapsed && serverHostTotalTimeElapsed > lastServerHostTotalTimeElapsed) {
            console.debug("Resyncing the local total time elapsed to that received from the server")
            setHostTotalTimeElapsed(serverHostTotalTimeElapsed)
            setLastHostTotalTimeElaped(serverHostTotalTimeElapsed)
        }
    }, [serverHostTotalTimeElapsed, lastServerHostTotalTimeElapsed])

    // Local timer
    useEffect(() => {
        if (totalFinishedParticipants === leaderboard.length) {
            // Gameover - stop incrementing timer
            return
        }

        const timeout = setTimeout(() => {
            console.debug("Timeout fired")
            setHostTotalTimeElapsed(hostTotalTimeElapsed + 1)
        }, 1000) // in 1 second
        return function cleanup() {
            clearTimeout(timeout)
            console.debug("Cleaned up timeout")
        }
    }, [hostTotalTimeElapsed, totalFinishedParticipants, leaderboard])

    let questionSummary: IParticipantQuestionSummary[] | IHostQuestionSummary[]
    let avgAnswerTime: string
    let totalTimeElapsed: string
    let loadingMessage: string
    if (clientType === ClientType.HOST) {
        questionSummary = hostQuizSummary || []
        avgAnswerTime = hostAvgAnswerTime ? `${hostAvgAnswerTime / 1000}s` : ""
        totalTimeElapsed = hostTotalTimeElapsed ? `${hostTotalTimeElapsed}s` : ""
        loadingMessage = "Awaiting participant answers..."
    } else if (clientType === ClientType.PARTICIPANT) {
        questionSummary = participantQuizSummary || []
        avgAnswerTime = participantAvgAnswerTime ? `${participantAvgAnswerTime / 1000}s` : ""
        totalTimeElapsed = participantTotalTimeElapsed ? `${participantTotalTimeElapsed}s` : ""
        loadingMessage = "Waiting for other participants to finish..."
    } else {
        throw Error(`Unexpected clientType '${clientType}'`)
    }

    function onReturnToHomeClicked() {
        navigate("/")
        dispatch(resetCommonState())
        dispatch(resetHostState())
        dispatch(resetParticipantState())
    }

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
            <SummaryColumn
                numberParticipantsComplete={totalFinishedParticipants}
                totalParticipants={leaderboard.length}
                onReturnToHomeClicked={onReturnToHomeClicked}
                totalTimeElapsed={totalTimeElapsed}
                avgAnswerTime={avgAnswerTime}
                
            />
            <QuestionSection
                questionSummary={questionSummary}
                loadingMessage={loadingMessage}
            />
            <LeaderboardColumn items={leaderboard} selectedUserId={userId} />
        </Box>
    )
}

export default Summary;
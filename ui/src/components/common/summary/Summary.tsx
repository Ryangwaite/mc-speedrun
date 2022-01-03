import { Box, Typography, Stack, CircularProgress, Collapse, } from "@mui/material";
import _ from "lodash";
import React, { useEffect, useState } from "react";
import { PositionedLeaderboard } from "../leaderboard/Leaderboard";
import QuestionCardWithStats from "../question/QuestionCardWithStats";
import { ClientType, IHostQuestionSummary, IParticipantQuestionSummary, } from "../../../types";
import { useAppDispatch, useAppSelector } from "../../../hooks";
import { resetParticipantState, selectParticipantAvgAnswerTime, selectParticipantQuizSummary, selectParticipantTotalTimeElapsed, selectUserId } from "../../../slices/participant";
import { resetCommonState, selectClientType, selectLeaderboard, selectTotalFinishedParticipants } from "../../../slices/common";
import { resetHostState, selectHostAvgAnswerTime, selectHostQuizSummary, selectHostTotalTimeElapsed } from "../../../slices/host";
import { useNavigate } from "react-router-dom";
import { OptionMode } from "../question/Option";
import ProgressBlock from "./ProgressBlock";
import StatCard from "./StatCard";
import theme, { COLUMN_MARGIN_TOP, scrollbarMixin } from "../../../themes/theme";

const COLUMN_WIDTH = "340px"

// Wrapper for consistent gaps between elements in the summary column
const ColumnElementWrapper = (props: { children: React.ReactNode, marginTop?: number }) => (
    <Box
        sx={{
            margin: 3,
            marginTop: props.marginTop,
        }}
        component="div"
    >
        {props.children}
    </Box>
)

interface ISummaryColumnProps {
    numberParticipantsComplete: number,
    totalParticipants: number,
    onReturnToHomeClicked: () => void
    totalTimeElapsed: string,
    avgAnswerTime: string,
}

function SummaryColumn(props: ISummaryColumnProps) {
    const { numberParticipantsComplete, totalParticipants, onReturnToHomeClicked } = props
    const { totalTimeElapsed, avgAnswerTime } = props
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
            width={COLUMN_WIDTH}
            sx={{
                overflowY: "auto",
            }}
        >
            <ColumnElementWrapper marginTop={COLUMN_MARGIN_TOP}>
                <ProgressBlock progressCurrent={numberParticipantsComplete} progressTotal={totalParticipants} onReturnToHomeClicked={onReturnToHomeClicked} />
            </ColumnElementWrapper>
            <Collapse
                in={totalTimeElapsed.length > 0}
                orientation="vertical"
            >
                <ColumnElementWrapper marginTop={0}>
                    <StatCard label="Time elapsed" value={totalTimeElapsed} unit="seconds" />
                </ColumnElementWrapper>
            </Collapse>
            <Collapse
                in={avgAnswerTime.length > 0}
                orientation="vertical"
            >
                <ColumnElementWrapper marginTop={0}>
                    <StatCard label="Average answer time" value={avgAnswerTime} unit="seconds" />
                </ColumnElementWrapper>
            </Collapse>
        </Box >
    )
}

interface IQuestionSectionProps {
    questionSummary: IHostQuestionSummary[] | IParticipantQuestionSummary[],
    loadingMessage: string,
}

function QuestionSection({ questionSummary, loadingMessage }: IQuestionSectionProps) {

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
                        marginBottom: theme.spacing(3),
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
                return { text: value, mode }
            })
        } else {
            // HostQuestionSummary
            optionsAndMode = qs.options.map((value, index) => ({
                text: value,
                mode: qs.correctOptions.includes(index) ? OptionMode.SELECTED_AND_MARKED_CORRECT : OptionMode.PLAIN,
            }))
        }

        renderedQuestions.push(
            <Box
                marginTop={COLUMN_MARGIN_TOP}
                marginBottom={3}
            >
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
            </Box>
        )
    }

    return (
        <Box
            // Position
            position="absolute"
            top="0"
            bottom="0"
            left="50%" // NOTE: the translateX(-50%) to position in centre
            maxWidth={theme.spacing(100)}
            sx={{
                transform: "translateX(-50%)", // There's no direct prop for this, hence its here
                width: `calc(100% - ${COLUMN_WIDTH} - ${COLUMN_WIDTH})`, // = fillwidth - SummaryColumnWidth - leaderboardColumnWidth
                overflowY: "auto",
                ...scrollbarMixin,
            }}
        >
            {renderedQuestions}
        </Box>
    )
}

interface ISummaryProps { }

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
        avgAnswerTime = hostAvgAnswerTime ? `${hostAvgAnswerTime / 1000}` : ""
        totalTimeElapsed = hostTotalTimeElapsed ? `${hostTotalTimeElapsed}` : ""
        loadingMessage = "Awaiting participant answers..."
    } else if (clientType === ClientType.PARTICIPANT) {
        questionSummary = participantQuizSummary || []
        avgAnswerTime = participantAvgAnswerTime ? `${participantAvgAnswerTime / 1000}` : ""
        totalTimeElapsed = participantTotalTimeElapsed ? `${participantTotalTimeElapsed}` : ""
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
            <PositionedLeaderboard items={leaderboard} selectedUserId={userId} />
        </Box>
    )
}

export default Summary;
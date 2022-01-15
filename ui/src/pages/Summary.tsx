import { Box, Typography, Stack, CircularProgress, Collapse, SxProps, Theme, IconButton, Badge, Drawer, } from "@mui/material";
import _ from "lodash";
import React, { useEffect, useState } from "react";
import { LeaderBoard, LEADERBOARD_COLUMN_WIDTH } from "../components/common/leaderboard/Leaderboard";
import QuestionCardWithStats from "../components/common/question/QuestionCardWithStats";
import { ClientType, IHostQuestionSummary, ILeaderboardItem, IParticipantQuestionSummary, PageVariant, } from "../types";
import { useAppDispatch, useAppSelector, usePageVariant } from "../hooks";
import { resetParticipantState, selectParticipantAvgAnswerTime, selectParticipantQuizSummary, selectParticipantTotalTimeElapsed, selectUserId } from "../slices/participant";
import { resetCommonState, selectClientType, selectLeaderboard, selectTotalFinishedParticipants } from "../slices/common";
import { resetHostState, selectHostAvgAnswerTime, selectHostQuizSummary, selectHostTotalTimeElapsed } from "../slices/host";
import { useNavigate } from "react-router-dom";
import { OptionMode } from "../components/common/question/Option";
import ProgressBlock from "../components/common/summary/ProgressBlock";
import StatCard, { StatCardSize } from "../components/common/summary/StatCard";
import theme, { COLUMN_MARGIN_TOP, scrollbarMixin } from "../themes/theme";
import { QuestionCardVariant } from "../components/common/question/QuestionCard";
import LeaderBoardItem from "../components/common/leaderboard/LeaderboardItem";
import MenuIcon from '@mui/icons-material/Menu';

const COLUMN_WIDTH = "340px"

// Wrapper for consistent gaps between elements in the summary column
const ColumnElementWrapper = (props: { children: React.ReactNode, sx?: SxProps<Theme> }) => (
    <Box
        sx={{
            margin: 3,
            ...props.sx,
        }}
        component="div"
    >
        {props.children}
    </Box>
)

interface ISummaryColumnProps {
    variant: PageVariant,
    numberParticipantsComplete: number,
    totalParticipants: number,
    onReturnToHomeClicked: () => void
    totalTimeElapsed: string,
    avgAnswerTime: string,
}

function SummarySection(props: ISummaryColumnProps) {
    const { variant, numberParticipantsComplete, totalParticipants, onReturnToHomeClicked } = props
    const { totalTimeElapsed, avgAnswerTime } = props

    const progressBlock = <ProgressBlock progressCurrent={numberParticipantsComplete} progressTotal={totalParticipants} onReturnToHomeClicked={onReturnToHomeClicked} />
    const timeElapsedStatCard = (
        <StatCard
            size={variant === PageVariant.LARGE ? StatCardSize.LARGE : StatCardSize.SMALL}
            label="Time elapsed"
            value={totalTimeElapsed}
            unit="seconds"
        />
    )
    const avgAnswerTimeLabel = variant === PageVariant.LARGE ? "Average answer time" : "Avg. answer time"
    const avgAnswerTimeStatCard = (
        <StatCard
            size={variant === PageVariant.LARGE ? StatCardSize.LARGE : StatCardSize.SMALL}
            label={avgAnswerTimeLabel}
            value={avgAnswerTime}
            unit="seconds"
        />
    )

    switch (variant) {
        case PageVariant.SMALL:
            return (
                <Box
                    display={"flex"}
                    flexDirection={"column"}
                >
                    {progressBlock}
                    <Box
                        display={"flex"}
                        flexDirection={"row"}
                        columnGap={3}
                        marginTop={3}
                    >
                        {timeElapsedStatCard}
                        {avgAnswerTimeStatCard}
                    </Box>
                </Box>
            )
        case PageVariant.MEDIUM:
            return (
                <Box
                    sx={{
                        display: "grid",
                        gridTemplateAreas: `'progress           time-elapsed'
                                            'avg-answer-time    time-elapsed'`,
                        gridTemplateRows: "auto auto",
                        gridTemplateColumns: "auto auto",
                        columnGap: 3,
                        rowGap: 3,
                    }}
                >
                    <ColumnElementWrapper
                        sx={{
                            margin: 0,
                            gridArea: "progress",
                        }}
                    >
                        {progressBlock}
                    </ColumnElementWrapper>
                    <Collapse
                        in={totalTimeElapsed.length > 0}
                        orientation="horizontal"
                        sx={{
                            gridArea: "time-elapsed",
                            alignSelf: "center",
                        }}
                    >
                        <ColumnElementWrapper
                            sx={{
                                margin: 0,
                            }}
                        >
                            {timeElapsedStatCard}
                        </ColumnElementWrapper>
                    </Collapse>
                    <Collapse
                        in={avgAnswerTime.length > 0}
                        orientation="vertical"
                        sx={{
                            gridArea: "avg-answer-time",
                        }}
                    >
                        <ColumnElementWrapper
                            sx={{
                                margin: 0,
                            }}
                        >
                            {avgAnswerTimeStatCard}
                        </ColumnElementWrapper>
                    </Collapse>
                </Box>
            )
        case PageVariant.LARGE:
            return (
                <>
                    <ColumnElementWrapper sx={{marginTop: COLUMN_MARGIN_TOP}}>
                        {progressBlock}
                    </ColumnElementWrapper>
                    <Collapse
                        in={totalTimeElapsed.length > 0}
                        orientation="vertical"
                    >
                        <ColumnElementWrapper sx={{marginTop: 0}}>
                            {timeElapsedStatCard}
                        </ColumnElementWrapper>
                    </Collapse>
                    <Collapse
                        in={avgAnswerTime.length > 0}
                        orientation="vertical"
                    >
                        <ColumnElementWrapper sx={{marginTop: 0}}>
                            {avgAnswerTimeStatCard}
                        </ColumnElementWrapper>
                    </Collapse>
                </>
            )
    }
}

interface IQuestionSectionProps {
    variant: PageVariant,
    questionSummary: IHostQuestionSummary[] | IParticipantQuestionSummary[],
    loadingMessage: string,
}

function QuestionSection({ variant, questionSummary, loadingMessage }: IQuestionSectionProps) {

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
                <Typography
                    textAlign={"center"}
                >{loadingMessage}</Typography>
            </Stack>
        )
    }

    let questionCardVariant = {
        [PageVariant.SMALL]: QuestionCardVariant.COLUMN,
        [PageVariant.MEDIUM]: QuestionCardVariant.BOX,
        [PageVariant.LARGE]: QuestionCardVariant.ROW,
    }[variant]

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
                key={qs.question}
            >
                <QuestionCardWithStats
                    variant={questionCardVariant}
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
        <>
            {renderedQuestions}
        </>
    )
}

interface ILeaderboardSectionProps {
    variant: PageVariant,
    clientType: ClientType,
    items: ILeaderboardItem[],
    selectedUserId: string,
}

function LeaderboardSection(props: ILeaderboardSectionProps) {
    // This is just for the small view
    const [leaderboardDrawerOpen, setLeaderboardDrawerOpen] = useState(false)

    const {variant, clientType, items, selectedUserId} = props

    switch (variant) {
        case PageVariant.SMALL:
            const sortedItems = _.sortBy(items, x => x.score).reverse()
            let userPosition: number
            let selectedUser: ILeaderboardItem
            if (clientType === ClientType.PARTICIPANT) {
                for (let i = 0; i < sortedItems.length; i++) {
                    if (sortedItems[i].userId === selectedUserId) {
                        userPosition = i + 1
                        selectedUser = sortedItems[i]
                    }
                }
            } else {
                // Just show the 1st place user
                userPosition = 1
                selectedUser = sortedItems[0]
            }

            return (
                <>
                    <Stack direction={"row"}>
                        <Box
                            flexGrow={1}
                            marginRight={1.5}
                        >
                            <LeaderBoardItem key={0} position={userPosition!} selected={clientType === ClientType.PARTICIPANT} item={selectedUser!} />
                        </Box>
                        <IconButton
                            aria-label="menu"
                            onClick={() => setLeaderboardDrawerOpen(true)}
                            sx={{alignSelf: "center"}}
                        >
                            <Badge badgeContent={items.length} color="primary">
                                <MenuIcon />
                            </Badge>
                        </IconButton>
                    </Stack>
                    <Drawer
                        anchor="right"
                        open={leaderboardDrawerOpen}
                        onClose={() => setLeaderboardDrawerOpen(false)}
                        PaperProps={{
                            sx: {
                                backgroundColor: theme.palette.grey[100],
                            }
                        }}
                    >
                        <Box
                            padding={3}
                            width={COLUMN_WIDTH}
                        >
                            <LeaderBoard items={items} selectedUserId={selectedUserId} />
                        </Box>
                    </Drawer>
                </>
            )
        case PageVariant.MEDIUM:
        case PageVariant.LARGE:
            return <LeaderBoard items={items} selectedUserId={selectedUserId} />
    }
}

interface ISummaryPageContainerProps {
    variant: PageVariant,
    summarySection: React.ReactNode | React.ReactNode[],
    questionSection: React.ReactNode | React.ReactNode[],
    leaderboardSection: React.ReactNode | React.ReactNode[],
}

function SummaryPageContainer(props: ISummaryPageContainerProps) {
    const {variant, summarySection, questionSection, leaderboardSection} = props

    switch (variant) {
        case PageVariant.SMALL:
            return (
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
                        marginTop={COLUMN_MARGIN_TOP}
                        marginLeft={3}
                        marginRight={3}
                    >
                        {summarySection}
                    </Box>
                    <Box
                        marginTop={3}
                        marginLeft={3}
                        marginRight={3}
                    >
                        {leaderboardSection}
                    </Box>
                    <Box
                        margin={3}
                        marginTop={2}
                    >
                        {questionSection}
                    </Box>
                </Box>
            )
        case PageVariant.MEDIUM:
            return (
                <>
                    <Box
                        position="absolute"
                        top="0"
                        left="0"
                        bottom="0"
                        width={`calc(100% - ${LEADERBOARD_COLUMN_WIDTH})`}
                        display={"flex"}
                        flexDirection={"column"}
                        alignItems={"center"}
                    >
                        <Box
                            display={"flex"}
                            alignItems={"center"}
                            justifyContent={"center"}
                            marginLeft={3}
                            marginRight={3}
                            marginBottom={3}
                        >
                            {summarySection}
                        </Box>
                        <Box
                            sx={{
                                flexGrow: 1,
                                paddingLeft: 3,
                                width: "100%",
                                maxWidth: theme.spacing(70),
                                overflowY: "auto",
                                ...scrollbarMixin,
                            }}
                        >
                            {questionSection}
                        </Box>
                    </Box>
                    <Box
                        // Position on the rhs
                        position="absolute"
                        top="0"
                        right="0"
                        bottom="0"
                        width={LEADERBOARD_COLUMN_WIDTH}
                        sx={{
                            overflowY: "auto",
                            ...scrollbarMixin,
                        }}
                    >
                        <Box
                            sx={{
                                margin: 3,
                                marginTop: COLUMN_MARGIN_TOP,
                                padding: 0,
                            }}
                        >
                            {leaderboardSection}
                        </Box>
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
                        width={COLUMN_WIDTH}
                        sx={{
                            overflowY: "auto",
                        }}
                    >
                        {summarySection}
                    </Box>
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
                        {questionSection}
                    </Box>
                    <Box
                        // Position on the rhs
                        position="absolute"
                        top="0"
                        right="0"
                        bottom="0"
                        width={LEADERBOARD_COLUMN_WIDTH}
                        sx={{
                            overflowY: "auto",
                            ...scrollbarMixin,
                        }}
                    >
                        <Box
                            sx={{
                                margin: 3,
                                marginTop: COLUMN_MARGIN_TOP,
                                padding: 0,
                            }}
                        >
                            {leaderboardSection}
                        </Box>
                    </Box>
                </>
            )
    }
}

interface ISummaryProps { }

function Summary(props: ISummaryProps) {

    const pageVariant = usePageVariant()

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
            setHostTotalTimeElapsed(hostTotalTimeElapsed + 1)
        }, 1000) // in 1 second
        return function cleanup() {
            clearTimeout(timeout)
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
            <SummaryPageContainer
                variant={pageVariant}
                summarySection={
                    <SummarySection
                        variant={pageVariant}
                        numberParticipantsComplete={totalFinishedParticipants}
                        totalParticipants={leaderboard.length}
                        onReturnToHomeClicked={onReturnToHomeClicked}
                        totalTimeElapsed={totalTimeElapsed}
                        avgAnswerTime={avgAnswerTime}
                    />
                }
                questionSection={
                    <QuestionSection
                        variant={pageVariant}
                        questionSummary={questionSummary}
                        loadingMessage={loadingMessage}
                    />
                }
                leaderboardSection={
                    <LeaderboardSection
                        variant={pageVariant}
                        clientType={clientType}
                        items={leaderboard}
                        selectedUserId={userId}
                    />
                }
            />
        </Box>
    )
}

export default Summary;
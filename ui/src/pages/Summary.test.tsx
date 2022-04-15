import '@testing-library/jest-dom'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HOST_TOKEN, PARTICIPANT_TOKEN, QUIZ_ID, render, RootStatePartial } from '../../test/test-utils'
import { WebsocketConnectionStateType } from '../api/websocket'
import App from '../App'
import { websocketConnect } from '../middleware/websocket'
import { wsServer } from '../setupTests'
import { ClientType } from '../types'

const leaderboard = [
    { userId: '88168bd8', name: 'user1', score: 93 },
    { userId: 'ced010a5', name: 'user2', score: 96 }
]

const questions = [
    {
        question: 'What does \'www\' stand for in a web browser?',
        category: 'technology',
        options: ['world wide web', 'worlds widest website', 'who what when', 'i dont know'],
        answers: [0]
    },
    {
        question: 'Which of these databases are relational?',
        category: 'technology',
        options: ['DynamoDB', 'Athena', 'Redshift', 'Redis'],
        answers: [2]
    },
]

const hostInitialState: RootStatePartial = {
    common: {
        clientType: ClientType.HOST,
        connection: WebsocketConnectionStateType.CONNECTED,
        leaderboard: leaderboard,
        totalFinishedParticipants: leaderboard.length,
        quizId: QUIZ_ID,
        token: HOST_TOKEN.token,
        startTime: 1649935399
    },
    participant: {
        requestQuestion: false
    },
    host: {
        requestQuestions: false,
        questions: questions,
        quizSummary: [
            {
                question: 'What does \'www\' stand for in a web browser?',
                options: ['world wide web', 'worlds widest website', 'who what when', 'i dont know'],
                correctOptions: [0],
                correctAnswerers: [
                    { userId: 'ced010a5', name: 'ryan' },
                    { userId: '88168bd8', name: 'adam' }
                ],
                incorrectAnswerers: [],
                timeExpiredAnswerers: []
            },
            {
                question: 'Which of these databases are relational?',
                options: ['DynamoDB', 'Athena', 'Redshift', 'Redis'],
                correctOptions: [2],
                correctAnswerers: [],
                incorrectAnswerers: [
                    { userId: 'ced010a5', name: 'ryan' },
                    { userId: '88168bd8', name: 'adam' },
                ],
                timeExpiredAnswerers: []
            },
        ],
        avgAnswerTime: 2833,
        totalTimeElapsed: 17
    }
}

const participantInitialState: RootStatePartial = {
    common: {
        clientType: ClientType.PARTICIPANT,
        connection: WebsocketConnectionStateType.CONNECTED,
        leaderboard: leaderboard,
        totalFinishedParticipants: leaderboard.length,
        quizId: QUIZ_ID,
        token: PARTICIPANT_TOKEN.token,
        startTime: 1649935399
    },
    participant: {
        requestQuestion: false,
        userId: leaderboard[0].userId,
        username: leaderboard[0].name,
        questionDuration: 120,
        numberOfQuestions: questions.length,
        currentQuestion: {
            questionIndex: questions.length - 1,
            question: questions.at(-1)?.question!,
            options: questions.at(-1)?.options!,
            numberOfOptionsToSelect: questions.at(-1)?.options.length!,
        },
        quizSummary: [
            {
                question: 'What does \'www\' stand for in a web browser?',
                options: ['world wide web', 'worlds widest website', 'who what when', 'i dont know'],
                correctOptions: [0],
                participantOptions: [0],
                correctAnswerers: [
                    { userId: '88168bd8', name: 'user1' },
                    { userId: 'ced010a5', name: 'user2' }
                ],
                incorrectAnswerers: [],
                timeExpiredAnswerers: []
            },
            {
                question: 'Which of these databases are relational?',
                options: ['DynamoDB', 'Athena', 'Redshift', 'Redis'],
                correctOptions: [2],
                participantOptions: [0],
                correctAnswerers: [],
                incorrectAnswerers: [
                    { userId: '88168bd8', name: 'user1' },
                    { userId: 'ced010a5', name: 'user2' }
                ],
                timeExpiredAnswerers: []
            },
        ],
        avgAnswerTime: 2667,
        totalTimeElapsed: 40,
    },
    host: {
        requestQuestions: false,
    }
}

it("displays all info for host", async () => {
    const { store } = render(<App />, hostInitialState, "/summary")
    // Connect the websocket. NOTE: That this is normally done when transitioning from Home
    store.dispatch(websocketConnect(HOST_TOKEN.token))
    await wsServer.connected

    // All questions
    questions.forEach(x => {
        expect(screen.getByText(x.question)).toBeInTheDocument()
    })

    // All participants
    leaderboard.forEach(x => {
        expect(screen.getByText(x.name)).toBeInTheDocument()
        expect(screen.getByText(x.score)).toBeInTheDocument()
    })

    // Time elapsed
    expect(screen.getByText(hostInitialState.host?.totalTimeElapsed!)).toBeInTheDocument()

    // Avg. answer time
    const avgAnswerTimeSecs = hostInitialState.host?.avgAnswerTime! / 1000
    expect(screen.getByText(avgAnswerTimeSecs)).toBeInTheDocument()
})

it("displays all info for participant", async () => {
    const { store } = render(<App />, participantInitialState, "/summary")
    // Connect the websocket. NOTE: That this is normally done when transitioning from Home
    store.dispatch(websocketConnect(PARTICIPANT_TOKEN.token))
    await wsServer.connected

    // All questions
    questions.forEach(x => {
        expect(screen.getByText(x.question)).toBeInTheDocument()
    })

    // All participants
    leaderboard.forEach(x => {
        expect(screen.getByText(x.name)).toBeInTheDocument()
        expect(screen.getByText(x.score)).toBeInTheDocument()
    })

    // Time elapsed
    expect(screen.getByText(participantInitialState.participant!.totalTimeElapsed!)).toBeInTheDocument()

    // Avg. answer time
    const avgAnswerTimeSecs = participantInitialState.participant?.avgAnswerTime! / 1000
    expect(screen.getByText(avgAnswerTimeSecs)).toBeInTheDocument()
})

it.each([
    [participantInitialState, PARTICIPANT_TOKEN.token],
    [hostInitialState, HOST_TOKEN.token]
])("returns to home when button is pressed", async (initialState: RootStatePartial, token: string) => {
    const { store } = render(<App />, initialState, "/summary")
    // Connect the websocket. NOTE: That this is normally done when transitioning from Home
    store.dispatch(websocketConnect(token))
    await wsServer.connected

    const returnToHomeBtn = screen.getByRole("button", {name: /return to home/i})
    userEvent.click(returnToHomeBtn)

    // Confirm that it navigated to home
    expect(window.location.pathname).toEqual('/')
})

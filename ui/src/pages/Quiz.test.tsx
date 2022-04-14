import '@testing-library/jest-dom'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import _ from 'lodash'
import { PARTICIPANT_TOKEN, QUIZ_ID, render, RootStatePartial } from '../../test/test-utils'
import { LEADERBOARD, LeaderboardMsgType, ParticipantAnswerMsgType, PARTICIPANT_ANSWER, RequestParticipantQuestionMsgType, REQUEST_PARTICIPANT_QUESTION, ResponseParticipantQuestionMsgType, RESPONSE_PARTICIPANT_QUESTION } from '../api/protocol/messages'
import Packet from '../api/protocol/packet'
import { WebsocketConnectionStateType } from '../api/websocket'
import App from '../App'
import { websocketConnect } from '../middleware/websocket'
import { wsServer } from '../setupTests'
import { ClientType } from '../types'

const commonInitialState: RootStatePartial = {
    common: {
        clientType: ClientType.PARTICIPANT,
        connection: WebsocketConnectionStateType.CONNECTED,
        leaderboard: [
            {
                userId: '879ad637',
                name: 'user1',
                score: 0,
            },
            {
                userId: '879b6541',
                name: 'user2',
                score: 59,
            }
        ],
        totalFinishedParticipants: 0,
        quizId: QUIZ_ID,
        startTime: Math.floor(Date.now() / 1000),
    },
    participant: {
        requestQuestion: false,
        userId: '879ad637',
        username: 'user1',
        questionDuration: 120,
        numberOfQuestions: 10,
        currentQuestion: {
            questionIndex: 0,
            question: 'What does \'www\' stand for in a web browser?',
            options: [
                'world wide web',
                'worlds widest website',
                'who what when',
                'i dont know'
            ],
            numberOfOptionsToSelect: 1
        }
    },
}

it("submits question and transitions to the next with updated score", async () => {
    const {store} = render(<App />, commonInitialState, "/quiz")
    // Connect the websocket. NOTE: That this is normally done when transitioning from Home
    store.dispatch(websocketConnect(PARTICIPANT_TOKEN.token))
    await wsServer.connected

    // NOTE: Unfortunately cannot use jest.useFakeTimers because mock-socket has to work around timing issues
    // so that answered in time is 0 seconds

    // Answer question correctly
    const answerItem = screen.getByText(new RegExp(commonInitialState.participant?.currentQuestion?.options[0]!, "i"))
    userEvent.click(answerItem)
    userEvent.click(screen.getByRole("button", {name: /submit/i}))

    const answerMsg = await wsServer.nextMessage
    expect(answerMsg).toEqual({type: PARTICIPANT_ANSWER, payload: {
        answerDuration: 0,
        questionIndex: 0,
        selectedOptionIndexes: [0],
    }} as Packet<ParticipantAnswerMsgType>)

    const updatedScore = 99
    wsServer.send({type: LEADERBOARD, payload: {
        leaderboard: [
            {
                userId: '879ad637',
                name: 'user1',
                score: updatedScore,
            },
            {
                userId: '879b6541',
                name: 'user2',
                score: 59,
            }
        ]
    }} as Packet <LeaderboardMsgType>)

    // The updated score should be displayed
    await waitFor(() => expect(screen.getByText(updatedScore)).toBeInTheDocument())

    // Receive the next question...
    const nextQuestionRequest = await wsServer.nextMessage
    expect(nextQuestionRequest).toEqual({
        type: REQUEST_PARTICIPANT_QUESTION,
        payload: {
            questionIndex: 1,
        }
    } as Packet<RequestParticipantQuestionMsgType>)

    // ...and send next question which should be rendered
    const nextQuestionText = "Which of these databases are relational?"
    wsServer.send({
        type: RESPONSE_PARTICIPANT_QUESTION,
        payload: {
            question: nextQuestionText,
            numberOfOptionsToSelect: 2,
            options: [
                "DynamoDB",
                "Athena",
                "Redshift",
                "Redis"
            ],
            questionIndex: 1,
        }
    } as Packet<ResponseParticipantQuestionMsgType>)
    await waitFor(() => expect(screen.getByText(nextQuestionText)).toBeInTheDocument())
})

it("shows other participants score updates", async () => {
    const leaderboard = [
        {userId: '879ad637', name: 'user1', score: 13,}, // this user
        {userId: '879b6541', name: 'user2', score: 59,},
        {userId: '879b6523', name: 'user3', score: 111,},
    ]
    const initialState = _.cloneDeep(commonInitialState)
    initialState.common!.leaderboard = leaderboard;
    const {store} = render(<App />, initialState, "/quiz")
    // Connect the websocket. NOTE: That this is normally done when transitioning from Home
    store.dispatch(websocketConnect(PARTICIPANT_TOKEN.token))
    await wsServer.connected

    // Check that the initial users and scores were rendered
    leaderboard.forEach((x) => {
        expect(screen.getByText(x.name)).toBeInTheDocument()
        expect(screen.getByText(x.score)).toBeInTheDocument()
    })

    // Update score for each user
    leaderboard.forEach((x, i) => x.score *= (i+2))
    wsServer.send({
        type: LEADERBOARD,
        payload: {
            leaderboard: leaderboard,
        }
    } as Packet<LeaderboardMsgType>)

    // Check that the scores were updated
    leaderboard.forEach((x) => {
        expect(screen.getByText(x.name)).toBeInTheDocument()
        expect(screen.getByText(x.score)).toBeInTheDocument()
    })
})

it("transitions to summary page after answering final question", async () => {
    const initialState = _.cloneDeep(commonInitialState)
    initialState.participant!.currentQuestion!.questionIndex = 
        initialState.participant?.numberOfQuestions! - 1
    
    const {store} = render(<App />, initialState, "/quiz")
    // Connect the websocket. NOTE: That this is normally done when transitioning from Home
    store.dispatch(websocketConnect(PARTICIPANT_TOKEN.token))
    await wsServer.connected

    // Answer question correctly
    const answerItem = screen.getByText(new RegExp(commonInitialState.participant?.currentQuestion?.options[0]!, "i"))
    userEvent.click(answerItem)
    userEvent.click(screen.getByRole("button", {name: /submit/i}))

    // Confirm that it navigated to /summary
    expect(window.location.pathname).toEqual('/summary')
})

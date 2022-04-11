import '@testing-library/jest-dom'
import { screen, waitFor, waitForElementToBeRemoved } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../App'
import { HOST_TOKEN, QUIZ_ID, render, RootStatePartial } from '../../test/test-utils'
import { ClientType } from '../types'
import { WebsocketConnectionStateType } from '../api/websocket'
import { Action } from 'history'
import { websocketConnect } from '../middleware/websocket'
import { QUIZ1 } from '../../test/sample-quiz'
import Packet from '../api/protocol/packet'
import { BroadcastStartMsgType, BROADCAST_START, HOST_CONFIG, LEADERBOARD, LeaderboardMsgType, ResponseHostQuestionsMsgType, RESPONSE_HOST_QUESTIONS } from '../api/protocol/messages'
import _ from 'lodash'
import { wsServer } from '../setupTests'

const initialState: RootStatePartial = {
    common: {
        clientType: ClientType.HOST,
        connection: WebsocketConnectionStateType.CONNECTED,
        quizId: QUIZ_ID,
        token: HOST_TOKEN.token,
    },
    router: {
        location: {
            pathname: "/config",
            search: "",
            hash: "",
            state: null,
            key: "rw2as2gd",
        },
        action: Action.Push,
    },
}

it("doesn't show categories or question duration until quiz is uploaded", async () => {
    const {store} = render(<App />, initialState, "/config")
    // Connect the websocket. NOTE: That this is normally done when transitioning from Home
    store.dispatch(websocketConnect(HOST_TOKEN.token))
    await wsServer.connected
    
    const nameInput = screen.getByLabelText(/name/i)
    expect(nameInput).toBeVisible()
    expect(screen.queryByLabelText(/categories/i)).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/duration/i)).not.toBeInTheDocument()

    // Upload the quiz
    const uploadQuizBtn = screen.getByText(/upload quiz/i)
    userEvent.click(uploadQuizBtn) // pop up the modal...
    const filePicker = screen.getByTestId("upload-quiz-input")
    userEvent.upload(filePicker, new File([JSON.stringify(QUIZ1)], "quiz1.json"))
    userEvent.click(screen.getByText("Upload"))
    await waitForElementToBeRemoved(() => screen.queryByText("Upload")) // wait for modal to close

    // Should have received request for questions. Send them back in a response
    await expect(wsServer).toReceiveMessage(Packet.RequestHostQuestions())
    wsServer.send({type: RESPONSE_HOST_QUESTIONS, payload: {
        questions: QUIZ1,
    }} as Packet<ResponseHostQuestionsMsgType>)

    // Check that all questions are rendered
    QUIZ1.forEach(x => expect(screen.getByText(x.question)).toBeInTheDocument())
})

it("shows filtered questions when categories are unchecked", async () => {
    const startingState = _.merge({}, initialState, {
        host: {
            questions: QUIZ1,
        }
    } as RootStatePartial)
    const {store} = render(<App />, startingState, "/config")
    // Connect the websocket. NOTE: That this is normally done when transitioning from Home
    store.dispatch(websocketConnect(HOST_TOKEN.token))
    await wsServer.connected

    const allCategories = _.uniq(QUIZ1.map(x => x.category))

    // Check that questions for all categories were rendered since all are checked
    QUIZ1.forEach(q => expect(screen.getByText(q.question)).toBeInTheDocument())

    // Uncheck two categories and make sure corresponding questions disappear
    const uncheckedCategories = [allCategories[0], allCategories[1]]
    uncheckedCategories.forEach(c => userEvent.click(screen.getByLabelText(c)))
    const [expectedVisibleQuestions, expectedAbsentQuestions] = _.partition(QUIZ1, (x) => !uncheckedCategories.includes(x.category))
    expectedVisibleQuestions.forEach(q => expect(screen.getByText(q.question)).toBeInTheDocument())
    expectedAbsentQuestions.forEach(q => expect(screen.queryByText(q.question)).not.toBeInTheDocument())

    // Uncheck the remaining checked categories and make sure no questions are rendered
    const remainingCheckedCategories = allCategories.slice(2)
    remainingCheckedCategories.forEach(c => userEvent.click(screen.getByLabelText(c)))
    QUIZ1.forEach(q => expect(screen.queryByText(q.question)).not.toBeInTheDocument())

    // Recheck all categories and all questions will appear
    allCategories.forEach(c => userEvent.click(screen.getByLabelText(c)))
    QUIZ1.forEach(q => expect(screen.queryByText(q.question)).toBeInTheDocument())
})

it("shows start quiz when >1 participant and questions have been uploaded and navigates to /summary page on click", async () => {
    const startingState = _.merge({}, initialState, {
        host: {
            questions: QUIZ1, // start with uploaded questions
        }
    } as RootStatePartial)
    const {store} = render(<App />, startingState, "/config")
    // Connect the websocket. NOTE: That this is normally done when transitioning from Home
    store.dispatch(websocketConnect(HOST_TOKEN.token))
    await wsServer.connected

    // No users or quiz name yet so start button shouldn't be visible
    expect(screen.queryByRole("button", {name: /start/i})).not.toBeInTheDocument()

    // Send UI 3 users from the server
    const users = ["user1", "user2", "user3"]
    wsServer.send({type: LEADERBOARD, payload: {
        leaderboard: users.map(x => ({
            name: x,
            userId: x,
            score: 0,
        }))
    } as LeaderboardMsgType})
    // Check that all users were rendered
    users.map(async u => await waitFor(() => expect(screen.getByText(u)).toBeInTheDocument()))

    // Should still not be a start button since quiz name isn't set
    expect(screen.queryByRole("button", {name: /start/i})).not.toBeInTheDocument()

    // Set name which makes the "start" button appear
    const nameElement = screen.getByLabelText(/name/i)
    const quizName = "quiz name"
    userEvent.type(nameElement, quizName)

    const startButton = screen.getByRole("button", {name: /start/i})
    expect(startButton).toBeInTheDocument()
    userEvent.click(startButton)

    const hostConfigMsg = await wsServer.nextMessage
    expect(hostConfigMsg).toEqual({
        type: HOST_CONFIG,
        payload: {
          categories: _.uniq(QUIZ1.map(x => x.category)),
          duration: 120,
          quizName: quizName,
          selectedQuestionIndexes: _.range(0, QUIZ1.length),
        }
      })

      // Send a start message
      wsServer.send({type: BROADCAST_START, payload: {} as BroadcastStartMsgType})

      // Confirm that it navigated to /summary
      expect(window.location.pathname).toEqual('/summary')
})
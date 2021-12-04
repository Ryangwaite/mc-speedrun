# Messages

These are the messages sent between clients (host and participants) speed-run servers and redis pub/sub.

## HOST-CONFIG
This is sent from the host client as the first message after the ws connection is established.
It configures the parameters of the quiz session. `PARTICIPANT-CONFIG` can be sent to the server before this, since Redis will already have a reference to this quiz session id from the moment the hosts websocket connection is established.

Payload:
```json
{
  quizName: string,
  categories: string[],
  duration: number
}
```

## PARTICIPANT-CONFIG
This is sent when the client has pressed the "join" button on the "/lobby" page.
Note that as soon as the participants websocket connection has been established the userId is created in Redis so this just configures the name associated with the userID.

Payload:
```json
{
  name: string
}
```
## BROADCAST-PARTICIPANT-CONFIG
This is sent to the host and all participants.

Payload:
```json
{
  userId: string,
  name: string
}
```

## HOST-START
This is sent when the "start" button is clicked on the "/config" page.

Payload:
```json
{}
```

## BROADCAST-START
Sent to all participants but not the host. Payload contains constants for all questions

Payload:
```json
{
  questionDuration: number,
  totalNumberOfQuestions: number,
}
```

## REQUEST-PARTICIPANT-QUESTION
Sent from a participant to the server.

Payload:
```json
{
  questionIndex: number
}
```

## RESPONSE-PARTICIPANT-QUESTION
In response to the `REQUEST-PARTICIPANT-QUESTION` the server sends this to only the participant that requested it.

Payload:
```json
{
  questionIndex: number,
  options: string[],
  numberOfOptionsToSelect: number
}
```

## PARTICIPANT-ANSWER
When the "submit" button is clicked on the "/quiz" page this is sent from the participant to the server.

Payload:
```json
{
  questionIndex: number,
  selectedOptionIndexes: number[],
  answeredInDuration: number // milliseconds to answer the question
}
```

## PARTICIPANT-ANSWER-TIMEOUT
When the user doesn't submit the question before the timeout on client side this is sent from the participant to the server.

Payload:
```json
{
  questionIndex: number
}
```

## NOTIFY-HOST-ANSWER
When a user submits a `PARTICIPANT-ANSWER` to the server this corresponding message is sent to the host to notify it.

Payload:
```json
{
  userId: string.
  questionIndex: number,
  answerResult: "CORRECT" | "INCORRECT" | "TIMEOUT"
}
```

## BROADCAST-LEADERBOARD
Everytime any participant submits a question their score changes, which causes the leaderboard to change. When this happens the newly updated leaderboard is broadcasted to all participants and the host.

Payload:
```json
{
    leaderboard: [
        {
            userId: string,
            name: string,
            score: number
        },
        ...
    ]
}
```

## REQUEST-PARTICIPANT-RESULTS
On the final `/summary` screen for the participant, this messsage is sent to the server which returns all the necessary info in a `RESPONSE_PARTICIPANT_RESULTS` message for rendering from the POV of the requesting participant

Payload:
```json
{
    userId: string
}
```

## RESPONSE-PARTICIPANT-RESULTS
Sent from the server in response to a `REQUEST-PARTICIPANT-RESULTS` message.

Payload:
```json
{
    userId: string,
    totalTimeElapsed: number, // milliseconds
    questions: [
        {
            question: string,
            options: string[],
            correctOptions: number[],
            participantOptions: number[],
            correctAnswerers: [
                {userId: string, name: string},
                ...
            ],
            incorrectAnswerers: [
                {userId: string, name: string},
                ...
            ],
            timeExpiredAnswerers: [
                {userId: string, name: string},
                ...
            ]
        },
        ...
    ]
}
```

## REQUEST-HOST-QUIZ-SUMMARY
Analogous to `REQUEST-PARTICIPANT-RESULTS` but for the host

Payload:
```json
{}
```

## RESPONSE-HOST-QUIZ-SUMMARY
Analogous to `RESPONSE-PARTICIPANT-RESULTS` but for the host

Payload:
```json
{
    totalTimeElapsed: number, // milliseconds
    questions: [
        {
            question: string,
            options: string[],
            correctOptions: number[],
            participantOptions: number[],
            correctAnswerers: [
                {userId: string, name: string},
                ...
            ],
            incorrectAnswerers: [
                {userId: string, name: string},
                ...
            ],
            timeExpiredAnswerers: [
                {userId: string, name: string},
                ...
            ]
        },
        ...
    ]
}
```
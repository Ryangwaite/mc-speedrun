package quiz

import "time"

type Answerer struct {
	UserId					string
	ParticipantOptions		[]int
	AnsweredInDuration		time.Duration
}

type QuestionSummary struct {
	Question				string
	Options[]				string
	CorrectOptions			[]int
	ParticipantAnswers		[]Answerer
}

type Participant struct {
	UserId			string
	Name			string
	Score			int
	StopTime		time.Time
}

type Quiz struct {
	Id						string				`dynamodbav:"id"`
	Name					string
	QuestionDuration		time.Duration
	StartTime				time.Time
	StopTime				time.Time
	Questions				[]QuestionSummary
	Participants			[]Participant
}
package subscribe

import (
	"context"
	"time"
)

type Subscriber interface {
	Start(ctx context.Context, quizCh QuizCh) error
	Close()
}

type QuizCh chan<- string

type QuizCompleteEvent struct {
	Type		string						`json:type`
	Source		string						`json:source`
	Id			string						`json:id`
	Time		time.Time					`json:time`
	Data		QuizCompleteEventDataV1		`json:data`
}

type QuizCompleteEventDataV1 struct {
	QuizId		string			`json:quizId`
}
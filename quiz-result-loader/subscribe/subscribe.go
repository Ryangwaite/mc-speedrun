package subscribe

import "context"

type Subscriber interface {
	Start(ctx context.Context, quizCh QuizCh) error
	Close()
}

type QuizCh chan<- string
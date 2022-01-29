package loader

import (
	"context"

	"github.com/Ryangwaite/mc-speedrun/quiz-result-loader/quiz"
)

type Extractor interface {
	Extract(ctx context.Context, quizId string) (quiz.Quiz, error)
}
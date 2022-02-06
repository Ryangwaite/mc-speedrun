package load

import (
	"context"

	"github.com/Ryangwaite/mc-speedrun/quiz-result-loader/quiz"
)

type Loader interface {
	Load(ctx context.Context, quiz quiz.Quiz) error
}
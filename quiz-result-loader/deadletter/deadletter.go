package deadletter

import (
	"context"
	log "github.com/sirupsen/logrus"
)

type DeadLetter struct {
	QuizId string
	ErrReason error
}

func DeadLetterLogReceiver(ctx context.Context, logger *log.Logger, deadLetters <-chan DeadLetter) {
	for {
		select {
		case <-ctx.Done():
			if ctx.Err() != nil {
				logger.Warn(ctx.Err().Error())
			}
			return
		case deadLetter := <- deadLetters:
			logger.Infof("Failed to process quiz '%s'. Reason: %s", deadLetter.QuizId, deadLetter.ErrReason.Error())
		}
	}
}
package deadletter

import (
	"context"
	log "github.com/sirupsen/logrus"
)

type DeadLetter struct {
	QuizId string
	ErrReason error
}

func DeadLetterLogReceiver(ctx context.Context, deadLetters <-chan DeadLetter) {
	for {
		select {
		case <-ctx.Done():
			if ctx.Err() != nil {
				log.Warn(ctx.Err().Error())
			}
			return
		case deadLetter := <- deadLetters:
			log.Infof("Failed to process quiz '%s'. Reason: %s", deadLetter.QuizId, deadLetter.ErrReason.Error())
		}
	}
}
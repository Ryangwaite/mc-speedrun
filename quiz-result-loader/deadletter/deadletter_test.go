package deadletter

import (
	"bytes"
	"context"
	"errors"
	"strings"
	"testing"

	"github.com/Ryangwaite/mc-speedrun/quiz-result-loader/internal/testutils"
)

// Tests logging dead letter received messages
func TestDeadLetterLogReceiver(t *testing.T) {
	// Init
	logBuffer := bytes.Buffer{}
	logger := testutils.BuildMemoryLogger(&logBuffer)

	ctx := context.Background()
	deadLetterCh := make(chan DeadLetter)
	
	go DeadLetterLogReceiver(ctx, logger, deadLetterCh)

	// Act
	deadLetters := []DeadLetter{
		{QuizId: "quiz1", ErrReason: errors.New("first quiz dead letter reason")},
		{QuizId: "quiz2", ErrReason: errors.New("2nd quiz dead letter reason")},
		{QuizId: "quiz3", ErrReason: errors.New("3rd quiz dead letter reason")},
	}
	for _, dl := range deadLetters {
		deadLetterCh<-dl
	}
	ctx.Done()

	// Assert
	logs := logBuffer.String()

	for _, dl := range deadLetters {
		errMsg := dl.ErrReason.Error()
		if !strings.Contains(logs, errMsg) {
			t.Errorf("Logs do not contain error msg '%s'", errMsg)
		}
	}
}

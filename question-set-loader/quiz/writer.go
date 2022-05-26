package quiz

import (
	"bytes"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
)

type QuizWriter interface {
	Write(quizId string, qAndA *QuestionAndAnswers) error
}

type QuizJsonFileWriter struct {
	SaveDirectory string // Location to write files to
}

func (qw QuizJsonFileWriter) Write(quizId string, qAndA *QuestionAndAnswers) error {
	writePath := filepath.Join(qw.SaveDirectory, quizId + ".json")
	// Create the parent directories if needed
	if err := os.MkdirAll(filepath.Dir(writePath), os.ModePerm); err != nil {
		return fmt.Errorf("failed to create quiz file parent directories. Error: %v", err)
	}

	data := bytes.Buffer{}
	enc := json.NewEncoder(&data)
	enc.SetEscapeHTML(false)
	enc.SetIndent("", "  ")
	if err := enc.Encode(&qAndA); err != nil {
		return err
	}

	// Write the file with only read permission for all users
	if err := os.WriteFile(writePath, data.Bytes(), os.FileMode(int(0444))); err != nil {
		return err
	}

	// Success
	return nil
}

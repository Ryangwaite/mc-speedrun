package quiz

import (
	"bytes"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
)

type QuestionAndAnswers []struct {
	Question	string		`json:"question"`
	Category	string		`json:"category"`
	Options		[]string	`json:"options"`
	Answers		[]int		`json:"answers"`
}

func QuizFileFromBytes(fileBytes *[]byte) (qAndA QuestionAndAnswers, err error) {

	if err := json.Unmarshal(*fileBytes, &qAndA); err != nil {
		return nil, fmt.Errorf("failed to deserialize quiz file: Error: %s", err.Error())
	}

	// Successfully deserialized the file - this means its valid
	return qAndA, nil
}

// Writes the quiz to the file provided by path creating parent directories as needed
func (qAndA *QuestionAndAnswers) WriteToDisk(path string) (err error) {
	// Create the parent directories if needed
	if err := os.MkdirAll(filepath.Dir(path), os.ModePerm); err != nil {
		return fmt.Errorf("failed to create quiz file parent directories. Error: " + err.Error())
	}

	data := bytes.Buffer{}
	enc := json.NewEncoder(&data)
	enc.SetEscapeHTML(false)
	enc.SetIndent("", "  ")
	if err = enc.Encode(&qAndA); err != nil {
		return err
	}

	// Write the file with only read permission for all users
	if err := os.WriteFile(path, data.Bytes(), os.FileMode(int(0444))); err != nil {
		return err
	}

	// Success
	return nil
}
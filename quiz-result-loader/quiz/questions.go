package quiz

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"os"
)

// TODO: Investigate consolidating these structs with those used in the question-set-loader

type QuestionAndAnswers []struct {
	Question	string		`json:"question"`
	Category	string		`json:"category"`
	Options		[]string	`json:"options"`
	Answers		[]int		`json:"answers"`
}

type IQuiz interface {
	QuizFileFromBytes(fileBytes *[]byte) (QuestionAndAnswers, error)
	LoadQuestionsFromFile(path string) (QuestionAndAnswers, error)
	DeleteQuestionsFile(path string) error
}

type QuizUtil struct {}

// Extracts a QuestionAndAnswers object from the fileBytes, returns non-nil error on failure
func (q *QuizUtil) QuizFileFromBytes(fileBytes *[]byte) (qAndA QuestionAndAnswers, err error) {

	if err := json.Unmarshal(*fileBytes, &qAndA); err != nil {
		return nil, fmt.Errorf("failed to deserialize quiz file: Error: %s", err.Error())
	}

	// Successfully deserialized the file - this means its valid
	return qAndA, nil
}

// Extracts a QuestionAndAnswers object from the file pointed to by path, returns non-nil error on failure
func (q *QuizUtil) LoadQuestionsFromFile(path string) (qAndA QuestionAndAnswers, err error) {
	bytes, err := ioutil.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("failed to read file. Error: %s", err.Error())
	}

	return q.QuizFileFromBytes(&bytes)
}

// Deletes the file designated by path
func (q *QuizUtil) DeleteQuestionsFile(path string) error {
	return os.Remove(path)
}

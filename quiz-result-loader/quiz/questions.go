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

func QuizFileFromBytes(fileBytes *[]byte) (qAndA QuestionAndAnswers, err error) {

	if err := json.Unmarshal(*fileBytes, &qAndA); err != nil {
		return nil, fmt.Errorf("failed to deserialize quiz file: Error: %s", err.Error())
	}

	// Successfully deserialized the file - this means its valid
	return qAndA, nil
}

func LoadQuestionsFromFile(path string) (qAndA QuestionAndAnswers, err error) {
	bytes, err := ioutil.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("failed to read file. Error: %s", err.Error())
	}

	return QuizFileFromBytes(&bytes)
}

// Deletes the file designated by path
func DeleteQuestionsFile(path string) error {
	return os.Remove(path)
}
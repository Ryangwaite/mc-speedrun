package quiz

import (
	"encoding/json"
	"fmt"
)

type QuestionAndAnswers struct {
	Question	string		`json:"question"`
	Category	string		`json:"category"`
	Options		[]string	`json:"options"`
	Answers		[]int		`json:"answers"`
}

func IsQuizFileValid(fileBytes *[]byte) (isValid bool, err error) {

	var questionsAndAnswers []QuestionAndAnswers
	if err := json.Unmarshal(*fileBytes, &questionsAndAnswers); err != nil {
		return false, fmt.Errorf("failed to deserialize quiz file: Error: %s", err.Error())
	}

	// Successfully deserialized the file so its valid
	return true, nil
}
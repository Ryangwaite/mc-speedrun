package quiz

import (
	"encoding/json"
	"fmt"
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

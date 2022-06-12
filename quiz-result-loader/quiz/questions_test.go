package quiz

import (
	"encoding/json"
	"testing"

	"github.com/google/go-cmp/cmp"
)

func TestQuizFileFromBytes(t *testing.T) {
	qAndA := QuestionAndAnswers{
		{
			Question: "question 1",
			Category: "food",
			Options: []string {"a", "b", "c", "d"},
			Answers: []int{1, 2},
		},
		{
			Question: "question 2",
			Category: "tech",
			Options: []string {"i", "ii", "iii", "iv"},
			Answers: []int{0, 2, 3},
		},
	}

	qAndABytes, err := json.Marshal(qAndA)
	if err != nil {
		t.Fatalf("Failed to serialize QuestionAndAnswer: %v", err)
	}

	quizUtil := QuizUtil{}
	deserializedQAndA, err := quizUtil.QuizFileFromBytes(&qAndABytes)
	if err != nil {
		t.Fatalf("Failed to deserialize QuestionAndAnswers bytes: %v", err)
	}

	if diff := cmp.Diff(qAndA, deserializedQAndA); diff != "" {
		t.Fatalf("Deserialized bytes don't match: %s", diff)
	}
}

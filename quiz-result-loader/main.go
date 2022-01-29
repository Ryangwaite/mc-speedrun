package main

import (
	"context"
	"fmt"

	extract "github.com/Ryangwaite/mc-speedrun/quiz-result-loader/extract"
)


func main() {
	var ctx = context.Background()

	extractor := extract.NewRedisExtractor(extract.RedisExtractorOptions{
		Addr: "localhost:6379",
		Password: "",
	})

	quizId := "sampledata1"

	// questionSetPath := "/tmp/question-sets/" + quizId + ".json"
	// questions, err := quiz.LoadQuestionsFromFile(questionSetPath)
	// if err != nil {
	// 	panic(err)
	// }

	quiz, err := extractor.Extract(ctx, quizId)
	if err != nil {
		panic("Failed to load: " + err.Error())
	}

	// TODO: Join questions into quiz

	fmt.Printf("Loaded quiz: %+v\n", quiz)
}
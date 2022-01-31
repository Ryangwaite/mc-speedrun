package main

import (
	"context"
	"errors"
	"fmt"
	"strconv"

	extract "github.com/Ryangwaite/mc-speedrun/quiz-result-loader/extract"
	"github.com/Ryangwaite/mc-speedrun/quiz-result-loader/quiz"
)

func combineExtractedQuizAndQuestions(extractedQuiz quiz.Quiz, questions quiz.QuestionAndAnswers) (quiz.Quiz, error) {
	for i, question := range extractedQuiz.Questions {
		// The loader didn't know the question text so just substituted the question index instead
		qIndex, err := strconv.Atoi(question.Question)
		if err != nil {
			return extractedQuiz, errors.New("expected question from extracted quiz to be an index")
		}
		// Copy the question fields into the quiz
		qAndA := questions[qIndex]
		extractedQuiz.Questions[i].Question = qAndA.Question
		extractedQuiz.Questions[i].Options = qAndA.Options
		extractedQuiz.Questions[i].CorrectOptions = qAndA.Answers
	}
	return extractedQuiz, nil
}

func main() {
	var ctx = context.Background()

	//// Extract ////

	extractor := extract.NewRedisExtractor(extract.RedisExtractorOptions{
		Addr: "localhost:6379",
		Password: "",
	})

	quizId := "sampledata1"

	questionSetPath := "/tmp/question-sets/" + quizId + ".json"
	questions, err := quiz.LoadQuestionsFromFile(questionSetPath)
	if err != nil {
		panic(err)
	}

	// NOTE: This extracted quiz doesn't have completed questions
	extractedQuiz, err := extractor.Extract(ctx, quizId)
	if err != nil {
		panic("Failed to load: " + err.Error())
	}

	completeQuiz, err := combineExtractedQuizAndQuestions(extractedQuiz, questions)
	if err != nil {
		panic(err)
	}
	fmt.Printf("Complete loaded quiz: %+v\n", completeQuiz)

	//// Load ////

}
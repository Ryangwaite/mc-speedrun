package worker

import (
	"context"
	"errors"
	"path"
	"strconv"
	log "github.com/sirupsen/logrus"
	extract "github.com/Ryangwaite/mc-speedrun/quiz-result-loader/extract"
	load "github.com/Ryangwaite/mc-speedrun/quiz-result-loader/load"
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

func worker(ctx context.Context, extractor extract.Extractor, loader load.Loader, questionSetBasePath string, job <-chan string, workerNum int) {
	for {
		var quizId string

		select {
		case <-ctx.Done():
			log.Infof("worker %d stopped", workerNum)
			return
		case quizId = <-job:
		}

		log.Debugf("Worker %d processing quiz '%s'", workerNum, quizId)

		//// Extract ////
		questionSetPath := path.Join(questionSetBasePath, quizId + ".json")
		questions, err := quiz.LoadQuestionsFromFile(questionSetPath)
		if err != nil {
			log.Warnf("Failed to load question from file for")
		}

		log.Debugf("Worker %d loaded questions from file for quiz '%s'", workerNum, quizId)

		// NOTE: This extracted quiz doesn't have completed questions at this stage
		extractedQuiz, err := extractor.Extract(ctx, quizId)
		if err != nil {
			log.Panic("Failed to extract: " + err.Error())
		}

		log.Debugf("Worker %d extracted data for quiz '%s'", workerNum, quizId)

		completeQuiz, err := combineExtractedQuizAndQuestions(extractedQuiz, questions)
		if err != nil {
			log.Panic(err)
		}
		log.Debugf("Complete loaded quiz: %+v\n", completeQuiz)

		//// Load ////
		if err := loader.Load(context.TODO(), completeQuiz); err != nil {
			log.Panic(err)
		}
	}
}

func WorkerPool(ctx context.Context, extractor extract.Extractor, loader load.Loader, questionSetBasePath string, job <-chan string, numWorkers int) {

	for i:=0; i < numWorkers; i++ {
		i := i
		go func() {
			worker(ctx, extractor, loader, questionSetBasePath, job, i)
		}()
	}

	// Run forever till the context completes
	<-ctx.Done()
	log.Info("worker pool stopped")
}
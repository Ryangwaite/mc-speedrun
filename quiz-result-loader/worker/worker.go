package worker

import (
	"context"
	"errors"
	"fmt"
	"path"
	"strconv"
	"sync"
	"time"
	"github.com/Ryangwaite/mc-speedrun/quiz-result-loader/deadletter"
	extract "github.com/Ryangwaite/mc-speedrun/quiz-result-loader/extract"
	load "github.com/Ryangwaite/mc-speedrun/quiz-result-loader/load"
	"github.com/Ryangwaite/mc-speedrun/quiz-result-loader/quiz"
	log "github.com/sirupsen/logrus"
)

func combineExtractedQuizAndQuestions(extractedQuiz quiz.Quiz, questions quiz.QuestionAndAnswers) (quiz.Quiz, error) {
	for i, question := range extractedQuiz.Questions {
		// The loader didn't know the question text so just substituted the question index instead
		qIndex, err := strconv.Atoi(question.Question)
		if err != nil {
			return extractedQuiz, errors.New("expected question from extracted quiz to be an index")
		}
		// TODO: Check for qIndex out-of-bounds error
		// Copy the question fields into the quiz
		qAndA := questions[qIndex]
		extractedQuiz.Questions[i].Question = qAndA.Question
		extractedQuiz.Questions[i].Options = qAndA.Options
		extractedQuiz.Questions[i].CorrectOptions = qAndA.Answers
	}
	return extractedQuiz, nil
}

func Worker(ctx context.Context, logger *log.Logger, quiz quiz.IQuiz, extractor extract.Extractor, loader load.Loader,
		questionSetBasePath string, job <-chan string, deadLetterCh chan<-deadletter.DeadLetter, workerNum int) {
	for {
		var quizId string

		select {
		case <-ctx.Done():
			logger.Infof("worker %d stopped", workerNum)
			return
		case quizId = <-job:
		}

		logger.Infof("Worker %d started processing quiz '%s'", workerNum, quizId)
		startTime := time.Now()

		//// Extract ////
		questionSetPath := path.Join(questionSetBasePath, quizId + ".json")
		questions, err := quiz.LoadQuestionsFromFile(questionSetPath)
		if err != nil {
			deadLetterCh<-deadletter.DeadLetter{
				QuizId: quizId,
				ErrReason: fmt.Errorf("failed to load questions from file. %w", err),
			}
			continue
		}

		logger.Debugf("Worker %d loaded questions from file for quiz '%s'", workerNum, quizId)

		// NOTE: This extracted quiz doesn't have completed questions at this stage
		extractedQuiz, err := extractor.Extract(ctx, quizId)
		if err != nil {
			deadLetterCh<-deadletter.DeadLetter{
				QuizId: quizId,
				ErrReason: fmt.Errorf("failed to extract. %w", err),
			}
			continue
		}

		logger.Debugf("Worker %d extracted data for quiz '%s'", workerNum, quizId)

		completeQuiz, err := combineExtractedQuizAndQuestions(extractedQuiz, questions)
		if err != nil {
			deadLetterCh<-deadletter.DeadLetter{
				QuizId: quizId,
				ErrReason: fmt.Errorf("failed to merge extracted quiz and questions. %w", err),
			}
			continue
		}
		logger.Debugf("Complete loaded quiz: %+v\n", completeQuiz)

		//// Load ////
		if err := loader.Load(ctx, completeQuiz); err != nil {
			deadLetterCh<-deadletter.DeadLetter{
				QuizId: quizId,
				ErrReason: fmt.Errorf("failed to load. %w", err),
			}
			continue
		}

		//// Delete ////
		if err := extractor.Delete(ctx, quizId); err != nil {
			logger.Warnf("Failed to delete extracted quiz for '%s'. %s", quizId, err.Error())
			continue
		}
		if err := quiz.DeleteQuestionsFile(questionSetPath); err != nil {
			logger.Warnf("Failed to delete questions file for quiz '%s'. %s", quizId, err.Error())
			continue
		}

		elapsedTime := time.Since(startTime)
		logger.Infof("Worker %d finished processing quiz '%s' in %dms", workerNum, quizId, elapsedTime.Milliseconds())
	}
}

func WorkerPool(ctx context.Context, logger *log.Logger, quiz quiz.IQuiz, extractor extract.Extractor, loader load.Loader,
		questionSetBasePath string, job <-chan string, deadLetterCh chan<-deadletter.DeadLetter, numWorkers int) {

	var wg sync.WaitGroup

	for i:=0; i < numWorkers; i++ {
		i := i
		wg.Add(1)
		go func() {
			Worker(ctx, logger, quiz, extractor, loader, questionSetBasePath, job, deadLetterCh, i)
			wg.Done()
		}()
	}

	// Run forever till the workers complete which is when the passed context is cancelled
	wg.Wait()
	logger.Info("worker pool stopped")
}

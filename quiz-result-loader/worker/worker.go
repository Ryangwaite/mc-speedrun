package worker

import (
	"context"
	"errors"
	"fmt"
	"path"
	"strconv"
	"sync"
	"time"
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

type CompleteJob struct {
	QuizId string
	// The identifier of the worker that processed this job
	WorkerNum int
	ProcessingTimeMillis int64
	Err error
}

// True if the completed job was successfully processed, else False
func (j *CompleteJob) Success() bool {
	return j.Err == nil
}

func Worker(ctx context.Context, logger *log.Logger, quiz quiz.IQuiz, extractor extract.Extractor, loader load.Loader,
		questionSetBasePath string, newJobCh <-chan string, completeJobCh chan<-CompleteJob, workerNum int) {
	for {
		var quizId string

		select {
		case <-ctx.Done():
			logger.Infof("worker %d stopped", workerNum)
			return
		case quizId = <-newJobCh:
		}

		logger.Infof("Worker %d started processing quiz '%s'", workerNum, quizId)
		startTime := time.Now()

		completeJob := CompleteJob{
			QuizId: quizId,
			WorkerNum: workerNum,
		}

		//// Extract ////
		questionSetPath := path.Join(questionSetBasePath, quizId + ".json")
		questions, err := quiz.LoadQuestionsFromFile(questionSetPath)
		if err != nil {
			completeJob.ProcessingTimeMillis = time.Since(startTime).Milliseconds()
			completeJob.Err = fmt.Errorf("failed to load questions from file. %w", err)
			completeJobCh<-completeJob
			continue
		}

		logger.Debugf("Worker %d loaded questions from file for quiz '%s'", workerNum, quizId)

		// NOTE: This extracted quiz doesn't have completed questions at this stage
		extractedQuiz, err := extractor.Extract(ctx, quizId)
		if err != nil {
			completeJob.ProcessingTimeMillis = time.Since(startTime).Milliseconds()
			completeJob.Err = fmt.Errorf("failed to extract. %w", err)
			completeJobCh<-completeJob
			continue
		}

		logger.Debugf("Worker %d extracted data for quiz '%s'", workerNum, quizId)

		completeQuiz, err := combineExtractedQuizAndQuestions(extractedQuiz, questions)
		if err != nil {
			completeJob.ProcessingTimeMillis = time.Since(startTime).Milliseconds()
			completeJob.Err = fmt.Errorf("failed to merge extracted quiz and questions. %w", err)
			completeJobCh<-completeJob
			continue
		}
		logger.Debugf("Worker %d complete loaded quiz: %+v\n", workerNum, completeQuiz)

		//// Load ////
		if err := loader.Load(ctx, completeQuiz); err != nil {
			completeJob.ProcessingTimeMillis = time.Since(startTime).Milliseconds()
			completeJob.Err = fmt.Errorf("failed to load. %w", err)
			completeJobCh<-completeJob
			continue
		}
		logger.Debugf("Worker %d loaded quiz '%s'", workerNum, quizId)

		//// Delete ////
		if err := extractor.Delete(ctx, quizId); err != nil {
			logger.Warnf("Failed to delete extracted quiz for '%s'. %s", quizId, err.Error())
			continue
		}
		logger.Debugf("Worker %d deleted quiz '%s'", workerNum, quizId)
		if err := quiz.DeleteQuestionsFile(questionSetPath); err != nil {
			logger.Warnf("Failed to delete questions file for quiz '%s'. %s", quizId, err.Error())
			continue
		}
		logger.Debugf("Worker %d deleted questions file for quiz '%s'", workerNum, quizId)

		// Success
		completeJob.ProcessingTimeMillis = time.Since(startTime).Milliseconds()
		completeJobCh<-completeJob
	}
}

func WorkerPool(ctx context.Context, logger *log.Logger, quiz quiz.IQuiz, extractor extract.Extractor, loader load.Loader,
		questionSetBasePath string, newJobCh <-chan string, completeJobCh chan<-CompleteJob, numWorkers int) {

	var wg sync.WaitGroup

	for i:=0; i < numWorkers; i++ {
		i := i
		wg.Add(1)
		go func() {
			Worker(ctx, logger, quiz, extractor, loader, questionSetBasePath, newJobCh, completeJobCh, i)
			wg.Done()
		}()
	}

	// Run forever till the workers complete which is when the passed context is cancelled
	wg.Wait()
	logger.Info("worker pool stopped")
}

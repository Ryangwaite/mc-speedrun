package worker

import (
	"bytes"
	"context"
	"fmt"
	"strings"
	"testing"
	"time"

	"github.com/Ryangwaite/mc-speedrun/quiz-result-loader/deadletter"
	"github.com/Ryangwaite/mc-speedrun/quiz-result-loader/extract"
	"github.com/Ryangwaite/mc-speedrun/quiz-result-loader/internal/testutils"
	"github.com/Ryangwaite/mc-speedrun/quiz-result-loader/load"
	"github.com/Ryangwaite/mc-speedrun/quiz-result-loader/quiz"
)

/////// GLOBAL VARIABLES ///////
const quizId = "workerquizid"
const quizName = "workerquizname"
const questionDuration = time.Duration(10) * time.Second
var startTime = time.Unix(1643273678, 0)
var stopTime = time.Unix(1643273706, 0)

const q1_text = "question 1"
const q1_category = "food"
var q1_options = []string {"a", "b", "c", "d"}
var q1_answers = []int{1, 2}
const q2_text = "question 2"
const q2_category = "tech"
var q2_options = []string {"i", "ii", "iii", "iv"}
var q2_answers = []int{0, 2, 3}
const q3_text = "question 3"
const q3_category = "tech"
var q3_options = []string {"iv", "iii", "ii", "i"}
var q3_answers = []int{0, 1, 3}

const u1_userId = "userId1"
const u1_name = "username1"
const u1_score = 35
var u1_stopTime = time.Unix(1643273706, 0)
var u1_a2_selectedOptions = []int {0, 3}
const u1_a2_answeredInDuration = time.Duration(8) * time.Second
var u1_a3_selectedOptions = []int {3}
const u1_a3_answeredInDuration = time.Duration(3) * time.Second

const u2_userId = "userId2"
const u2_name = "username2"
const u2_score = 80
var u2_stopTime = time.Unix(1643273702, 0)
var u2_a2_selectedOptions = []int {1, 3}
const u2_a2_answeredInDuration = time.Duration(4) * time.Second
var u2_a3_selectedOptions = []int {0}
const u2_a3_answeredInDuration = time.Duration(2) * time.Second

/////// MOCKS ///////

// --------- IQuiz --------- //
type mockQuizUtil struct {
	// NOTE: No implementation hook for QuizFileFromBytes since it not used in the worker implementation
	loadQuestionsFromFileImpl	func(path string) (quiz.QuestionAndAnswers, error)
	deleteQuestionsFileImpl		func(path string) error
}

func (m *mockQuizUtil) QuizFileFromBytes(fileBytes *[]byte) (quiz.QuestionAndAnswers, error) {
	return quiz.QuestionAndAnswers{}, fmt.Errorf("TODO: Implement this if used in implementation.")
}

func (m *mockQuizUtil) LoadQuestionsFromFile(path string) (quiz.QuestionAndAnswers, error) {
	return m.loadQuestionsFromFileImpl(path)
}

func (m *mockQuizUtil) DeleteQuestionsFile(path string) error {
	return m.deleteQuestionsFileImpl(path)
}

// Happy path implementation of LoadQuestionsFromFile
func LoadQuestionsFromFileOkImpl(path string) (quiz.QuestionAndAnswers, error) {
	return quiz.QuestionAndAnswers{
		{
			Question: q1_text,
			Category: q1_category,
			Options: q1_options,
			Answers: q1_answers,
		},
		{
			Question: q2_text,
			Category: q2_category,
			Options: q2_options,
			Answers: q2_answers,
		},
		{
			Question: q3_text,
			Category: q3_category,
			Options: q3_options,
			Answers: q3_answers,
		},
	}, nil
}

// Sad path implementation of LoadQuestionsFromFile
func LoadQuestionsFromFileErrorImpl(path string) (quiz.QuestionAndAnswers, error) {
	return quiz.QuestionAndAnswers{}, fmt.Errorf("Error loading questions from file")
}

// Happy path implementation of DeleteQuestionsFile
func DeleteQuestionsFileOkImpl(path string) error {
	return nil
}

// Sad path implementation of DeleteQuestionsFile
func DeleteQuestionsFileErrorImpl(path string) error {
	return fmt.Errorf("Failed to delete questions file")
}

// Returns a MockQuizUtil with happy path implementations of all methods
func NewMockQuizUtilOk() quiz.IQuiz {
	return &mockQuizUtil{
		loadQuestionsFromFileImpl: LoadQuestionsFromFileOkImpl,
		deleteQuestionsFileImpl: DeleteQuestionsFileOkImpl,
	}
}

// --------- Extractor --------- //
type mockExtractor struct {
	extractImpl func(ctx context.Context, quizId string) (quiz.Quiz, error)
	deleteImpl func(ctx context.Context, quizId string) error
}

func (m *mockExtractor) Extract(ctx context.Context, quizId string) (quiz.Quiz, error) {
	return m.extractImpl(ctx, quizId)
}

func (m *mockExtractor) Delete(ctx context.Context, quizId string) error {
	return m.deleteImpl(ctx, quizId)
}

// Happy path implementation of Extract
func ExtractOkImpl(ctx context.Context, quizId string) (quiz.Quiz, error) {
	return quiz.Quiz{
		Id: quizId,
		Name: quizName,
		QuestionDuration: questionDuration,
		StartTime: startTime,
		StopTime: stopTime,
		Questions: []quiz.QuestionSummary{
			{
				Question: "1", // this index 1, so question 2
				ParticipantAnswers: []quiz.Answerer{
					{
						UserId: u1_userId,
						ParticipantOptions: u1_a2_selectedOptions,
						AnsweredInDuration: u1_a2_answeredInDuration,
					},
					{
						UserId: u2_userId,
						ParticipantOptions: u2_a2_selectedOptions,
						AnsweredInDuration: u2_a2_answeredInDuration,
					},
				},
			},
			{
				Question: "2", // this index 2, so question 3
				ParticipantAnswers: []quiz.Answerer{
					{
						UserId: u1_userId,
						ParticipantOptions: u1_a3_selectedOptions,
						AnsweredInDuration: u1_a3_answeredInDuration,
					},
					{
						UserId: u2_userId,
						ParticipantOptions: u2_a3_selectedOptions,
						AnsweredInDuration: u2_a3_answeredInDuration,
					},
				},
			},
		},
		Participants: []quiz.Participant{
			{UserId: u1_userId, Name: u1_name, Score: u1_score, StopTime: u1_stopTime},
			{UserId: u2_userId, Name: u2_name, Score: u2_score, StopTime: u2_stopTime},
		},
	}, nil
}

// Sad path implementation of Extract
func ExtractErrorImpl(ctx context.Context, quizId string) (quiz.Quiz, error) {
	return quiz.Quiz{}, fmt.Errorf("Failed to extract")
}

// Happy path implementation of Delete
func DeleteOkImpl(ctx context.Context, quizId string) error {
	return nil
}

// Sad path implementation of Delete
func DeleteErrorImpl(ctx context.Context, quizId string) error {
	return fmt.Errorf("Failed to delete quiz '%s'", quizId)
}

// Returns a MockExtractor with happy path implementations of all methods
func NewMockExtractorOk() extract.Extractor {
	return &mockExtractor{
		extractImpl: ExtractOkImpl,
		deleteImpl: DeleteOkImpl,
	}
}

// --------- Loader --------- //
type mockLoader struct {
	loadImpl func(ctx context.Context, quiz quiz.Quiz) error
}

func (m *mockLoader) Load(ctx context.Context, quiz quiz.Quiz) error {
	return m.loadImpl(ctx, quiz)
}

// Happy path implementation of Load
func LoadOkImpl(ctx context.Context, quiz quiz.Quiz) error {
	return nil
}

// Sad path implementation of Load
func LoadErrorImpl(ctx context.Context, quiz quiz.Quiz) error {
	return fmt.Errorf("Failed to load quiz '%s'", quiz.Id)
}

// Returns a MockLoader with happy path implemetations of all methods
func NewMockLoaderOk() load.Loader {
	return &mockLoader{
		loadImpl: LoadOkImpl,
	}
}

/////// TESTS ///////


// When the worker processes the message without error
func TestWorker_ok(t *testing.T) {
	logCh := make(chan []byte)
	mockLogger := testutils.BuildChannelLogger(logCh)
	quizUtil := NewMockQuizUtilOk()
	extractor := NewMockExtractorOk()
	loader := NewMockLoaderOk()
	jobCh := make(chan string)
	deadLetterCh := make(chan deadletter.DeadLetter)
	workerNum := 3
	ctx, cancel := context.WithTimeout(context.Background(), 2 * time.Second)
	defer cancel() // Terminates the worker below on function exit

	// Start worker in the background
	go Worker(ctx, mockLogger, quizUtil, extractor, loader, "/question/set/base/path",
			jobCh, deadLetterCh, workerNum)

	// Process quiz
	jobCh<-quizId

	// Check that the log was received
	for {
		select {
		case logMsgBytes := <-logCh:
			logMsg := string(logMsgBytes)
			if !strings.Contains(logMsg, fmt.Sprintf("Worker %d finished processing quiz '%s'", workerNum, quizId)) {
				t.Logf("Received log '%s'. Not the one we're looking for, reading again...", logMsg)
				continue
			} else {
				// Received it - test pass
				return
			}
		case <-deadLetterCh:
			t.Fatalf("Received failed to process quiz deadLetter")
		case <-ctx.Done():
			t.Fatalf("Context cancelled. Error: %+v", ctx.Err())
		}
	}
}

// Enqueues a deadletter when it fails to load from file
func TestWorker_loadQuestionFromFile_error(t *testing.T) {
	mockLogger := testutils.BuildMemoryLogger(new(bytes.Buffer))
	quizUtil := &mockQuizUtil{
		loadQuestionsFromFileImpl: LoadQuestionsFromFileErrorImpl,
		deleteQuestionsFileImpl: DeleteQuestionsFileOkImpl,
	}
	extractor := NewMockExtractorOk()
	loader := NewMockLoaderOk()
	jobCh := make(chan string)
	deadLetterCh := make(chan deadletter.DeadLetter)
	workerNum := 3
	ctx, cancel := context.WithTimeout(context.Background(), 2 * time.Second)
	defer cancel() // Terminates the worker below on function exit

	// Start worker in the background
	go Worker(ctx, mockLogger, quizUtil, extractor, loader, "/question/set/base/path",
			jobCh, deadLetterCh, workerNum)

	// Process quiz
	jobCh<-quizId

	// Check that the log was received
	for {
		select {
		case deadLetter := <-deadLetterCh:
			wantedError := "failed to load questions from file"
			actualError := deadLetter.ErrReason.Error()
			if !strings.Contains(actualError, wantedError) {
				t.Fatalf("Unexpected error '%s' wanted '%s'", actualError, wantedError)
			}
			return // test pass
		case <-ctx.Done():
			t.Fatalf("Context cancelled. Error: %+v", ctx.Err())
		}
	}
}

// Enqueues a deadletter when it fails to extract
func TestWorker_extract_error(t *testing.T) {
	mockLogger := testutils.BuildMemoryLogger(new(bytes.Buffer))
	quizUtil := NewMockQuizUtilOk()
	extractor := &mockExtractor{
		extractImpl: ExtractErrorImpl,
		deleteImpl: DeleteOkImpl,
	}
	loader := NewMockLoaderOk()
	jobCh := make(chan string)
	deadLetterCh := make(chan deadletter.DeadLetter)
	workerNum := 3
	ctx, cancel := context.WithTimeout(context.Background(), 2 * time.Second)
	defer cancel() // Terminates the worker below on function exit

	// Start worker in the background
	go Worker(ctx, mockLogger, quizUtil, extractor, loader, "/question/set/base/path",
			jobCh, deadLetterCh, workerNum)

	// Process quiz
	jobCh<-quizId

	// Check that the log was received
	for {
		select {
		case deadLetter := <-deadLetterCh:
			wantedError := "failed to extract"
			actualError := deadLetter.ErrReason.Error()
			if !strings.Contains(actualError, wantedError) {
				t.Fatalf("Unexpected error '%s' wanted '%s'", actualError, wantedError)
			}
			return // test pass
		case <-ctx.Done():
			t.Fatalf("Context cancelled. Error: %+v", ctx.Err())
		}
	}
}

// Enqueues a deadletter when it fails to combine extracted and loaded questions
func TestWorker_combineExtractedQuizAndQuestions_error(t *testing.T) {
	mockLogger := testutils.BuildMemoryLogger(new(bytes.Buffer))
	quizUtil := NewMockQuizUtilOk()
	extractor := &mockExtractor{
		extractImpl: func(ctx context.Context, quizId string) (quiz.Quiz, error) {
			outQuiz, _ := ExtractOkImpl(ctx, quizId)
			// Set the question test to a non-question index
			outQuiz.Questions[0].Question = "notandindex"
			return outQuiz, nil
		},
		deleteImpl: DeleteOkImpl,
	}
	loader := NewMockLoaderOk()
	jobCh := make(chan string)
	deadLetterCh := make(chan deadletter.DeadLetter)
	workerNum := 3
	ctx, cancel := context.WithTimeout(context.Background(), 2 * time.Second)
	defer cancel() // Terminates the worker below on function exit

	// Start worker in the background
	go Worker(ctx, mockLogger, quizUtil, extractor, loader, "/question/set/base/path",
			jobCh, deadLetterCh, workerNum)

	// Process quiz
	jobCh<-quizId

	// Check that the log was received
	for {
		select {
		case deadLetter := <-deadLetterCh:
			wantedError := "failed to merge extracted quiz and questions"
			actualError := deadLetter.ErrReason.Error()
			if !strings.Contains(actualError, wantedError) {
				t.Fatalf("Unexpected error '%s' wanted '%s'", actualError, wantedError)
			}
			return // test pass
		case <-ctx.Done():
			t.Fatalf("Context cancelled. Error: %+v", ctx.Err())
		}
	}
}

// Enqueues a deadletter when it fails to load questions
func TestWorker_load_error(t *testing.T) {
	mockLogger := testutils.BuildMemoryLogger(new(bytes.Buffer))
	quizUtil := NewMockQuizUtilOk()
	extractor := NewMockExtractorOk()
	loader := &mockLoader{
		loadImpl: LoadErrorImpl,
	}
	jobCh := make(chan string)
	deadLetterCh := make(chan deadletter.DeadLetter)
	workerNum := 3
	ctx, cancel := context.WithTimeout(context.Background(), 2 * time.Second)
	defer cancel() // Terminates the worker below on function exit

	// Start worker in the background
	go Worker(ctx, mockLogger, quizUtil, extractor, loader, "/question/set/base/path",
			jobCh, deadLetterCh, workerNum)

	// Process quiz
	jobCh<-quizId

	// Check that the log was received
	for {
		select {
		case deadLetter := <-deadLetterCh:
			wantedError := "failed to load"
			actualError := deadLetter.ErrReason.Error()
			if !strings.Contains(actualError, wantedError) {
				t.Fatalf("Unexpected error '%s' wanted '%s'", actualError, wantedError)
			}
			return // test pass
		case <-ctx.Done():
			t.Fatalf("Context cancelled. Error: %+v", ctx.Err())
		}
	}
}

// Logs an error when extractor fails to delete from original source
func TestWorker_extractor_delete_error(t *testing.T) {
	logCh := make(chan []byte)
	mockLogger := testutils.BuildChannelLogger(logCh)
	quizUtil := NewMockQuizUtilOk()
	extractor := &mockExtractor{
		extractImpl: ExtractOkImpl,
		deleteImpl: DeleteErrorImpl,
	}
	loader := NewMockLoaderOk()
	jobCh := make(chan string)
	deadLetterCh := make(chan deadletter.DeadLetter)
	workerNum := 3
	ctx, cancel := context.WithTimeout(context.Background(), 2 * time.Second)
	defer cancel() // Terminates the worker below on function exit

	// Start worker in the background
	go Worker(ctx, mockLogger, quizUtil, extractor, loader, "/question/set/base/path",
			jobCh, deadLetterCh, workerNum)

	// Process quiz
	jobCh<-quizId

	// Check that the log was received
	for {
		select {
		case logMsgBytes := <-logCh:
			logMsg := string(logMsgBytes)
			if !strings.Contains(logMsg, fmt.Sprintf("Failed to delete extracted quiz for '%s'", quizId)) {
				t.Logf("Received log '%s'. Not the one we're looking for, reading again...", logMsg)
				continue
			} else {
				// Received it - test pass
				return
			}
		case deadLetter := <-deadLetterCh:
			t.Fatalf("Received deadLetter: %+v", deadLetter)
		case <-ctx.Done():
			t.Fatalf("Context cancelled. Error: %+v", ctx.Err())
		}
	}
}

// Logs an error when fails to delete questions file from original source
func TestWorker_deleteQuestionsFile_error(t *testing.T) {
	logCh := make(chan []byte)
	mockLogger := testutils.BuildChannelLogger(logCh)
	quizUtil := &mockQuizUtil{
		loadQuestionsFromFileImpl: LoadQuestionsFromFileOkImpl,
		deleteQuestionsFileImpl: DeleteQuestionsFileErrorImpl,
	}
	extractor := NewMockExtractorOk()
	loader := NewMockLoaderOk()
	jobCh := make(chan string)
	deadLetterCh := make(chan deadletter.DeadLetter)
	workerNum := 3
	ctx, cancel := context.WithTimeout(context.Background(), 2 * time.Second)
	defer cancel() // Terminates the worker below on function exit

	// Start worker in the background
	go Worker(ctx, mockLogger, quizUtil, extractor, loader, "/question/set/base/path",
			jobCh, deadLetterCh, workerNum)

	// Process quiz
	jobCh<-quizId

	// Check that the log was received
	for {
		select {
		case logMsgBytes := <-logCh:
			logMsg := string(logMsgBytes)
			if !strings.Contains(logMsg, fmt.Sprintf("Failed to delete questions file for quiz '%s'", quizId)) {
				t.Logf("Received log '%s'. Not the one we're looking for, reading again...", logMsg)
				continue
			} else {
				// Received it - test pass
				return
			}
		case deadLetter := <-deadLetterCh:
			t.Fatalf("Received deadLetter: %+v", deadLetter)
		case <-ctx.Done():
			t.Fatalf("Context cancelled. Error: %+v", ctx.Err())
		}
	}
}

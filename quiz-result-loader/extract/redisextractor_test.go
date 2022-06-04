package extract

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"testing"
	"time"

	"github.com/Ryangwaite/mc-speedrun/quiz-result-loader/quiz"
	"github.com/alicebob/miniredis/v2"
	"github.com/go-redis/redis/v8"
	"github.com/google/go-cmp/cmp"
	"github.com/google/go-cmp/cmp/cmpopts"
)

const (
	quizId = "quiz1"
	quizName = "example"
	questionDuration int64 = 10
	startTime int64 = 1643273678
	stopTime int64  = 1643273706
	user1_username = "user1"
	user1_stoptime = 1643273706
	user1_answer_3 = "{\"selectedOptionIndexes\":[1],\"answeredInDuration\":8}"
	user1_answer_4 = "{\"selectedOptionIndexes\":[],\"answeredInDuration\":11}"
	user1_answer_5 = "{\"selectedOptionIndexes\":[1],\"answeredInDuration\":2}"
	user2_username = "user2"
	user2_stoptime = 1643273701
	user2_answer_3 = "{\"selectedOptionIndexes\":[0],\"answeredInDuration\":2}"
	user2_answer_4 = "{\"selectedOptionIndexes\":[2,0],\"answeredInDuration\":3}"
	user2_answer_5 = "{\"selectedOptionIndexes\":[],\"answeredInDuration\":11}"
)

var (
	selectedQuestionIndexes = []string{"3", "4", "5"}
	selectedCategories = []string{"Food"}
	userIds = []string{"2c3ca3d2", "ee14ccb2"}
	leaderboard = map[string]float64{userIds[0]: 35.0, userIds[1]: 80.0,}
)

func populateRedis(r *miniredis.Miniredis, quizId string) error {
	user1Id := string(userIds[0])
	user2Id := string(userIds[1])
	// Set string fields
	strings := map[string]string{
		"quizName": quizName,
		"questionDuration": fmt.Sprint(questionDuration),
		"startTime": fmt.Sprint(startTime),
		"stopTime": fmt.Sprint(stopTime),
		// User 1
		user1Id + ":username": user1_username,
		user1Id + ":stopTime": fmt.Sprint(user1_stoptime),
		user1Id + ":answer:3": user1_answer_3,
		user1Id + ":answer:4": user1_answer_4,
		user1Id + ":answer:5": user1_answer_5,
		// User 2
		user2Id + ":username": user2_username,
		user2Id + ":stopTime": fmt.Sprint(user2_stoptime),
		user2Id + ":answer:3": user2_answer_3,
		user2Id + ":answer:4": user2_answer_4,
		user2Id + ":answer:5": user2_answer_5,
	}
	for k, v := range strings {
		fullKey := fmt.Sprintf("%s:%s", quizId, k)
		if err := r.Set(fullKey, v); err != nil {
			return fmt.Errorf("Failed to set field '%s':'%s'. Error: %w", fullKey, v, err)
		}
	}

	// Set list fields
	lists := map[string][]string{
		"selectedQuestionIndexes": selectedQuestionIndexes,
		"selectedCategories": selectedCategories,
		"userIds": userIds,
	}
	for k, lst := range lists {
		fullKey := fmt.Sprintf("%s:%s", quizId, k)
		if _, err := r.Push(fullKey, lst...); err != nil {
			return fmt.Errorf("Failed to set field '%s':'%v'. Error: %w", fullKey, lst, err)
		}
	}

	// Set leaderboard
	fullKey := fmt.Sprintf("%s:leaderboard", quizId)
	for member, score := range leaderboard {
		if _, err := r.ZAdd(fullKey, score, member); err != nil {
			return fmt.Errorf("Failed to add zscore '%s':'%f' to '%s'. Error: %w", member, score, fullKey, err)
		}
	}

	return nil // ok
}

// Decodes the json encoded blob of selectedOptionIndexes and AnsweredInDuration
// for a specific question answer and returns it on success, else error
func DecodeQuestionAnswerBlob(blob string) (questionAnswerBlob, error) {
	var parsedValue questionAnswerBlob
	if err := json.Unmarshal([]byte(blob), &parsedValue); err != nil {
		return questionAnswerBlob{}, fmt.Errorf("failed to parse '%s'. Error: %w", blob, err)
	}
	return parsedValue, nil
}

func NewRedisExtractorFromClient(rdb *redis.Client) redisExtractor {
	return redisExtractor{
		rdb: rdb,
	}
}

// Tests successfully extracting a quiz from redis
func TestExtract_ok(t *testing.T) {
	miniredis := miniredis.RunT(t)
	ctx := context.Background()
	if err := populateRedis(miniredis, quizId); err != nil {
		t.Fatalf("Failed to initialize redis before test: Error: %v", err)
	}

	extractor := NewRedisExtractorFromClient(redis.NewClient(&redis.Options{
		Addr: miniredis.Addr(),
	}))

	actualQuiz, err := extractor.Extract(ctx, quizId)
	if err != nil {
		t.Fatalf("Failed to extract quiz: Error: %v", err)
	}

	u1_a3_decoded, _ := DecodeQuestionAnswerBlob(user1_answer_3)
	u2_a3_decoded, _ := DecodeQuestionAnswerBlob(user2_answer_3)
	u1_a4_decoded, _ := DecodeQuestionAnswerBlob(user1_answer_4)
	u2_a4_decoded, _ := DecodeQuestionAnswerBlob(user2_answer_4)
	u1_a5_decoded, _ := DecodeQuestionAnswerBlob(user1_answer_5)
	u2_a5_decoded, err := DecodeQuestionAnswerBlob(user2_answer_5)
	if err != nil {  // Note: Should check err of every above decode
		t.Fatalf("Failed to decode QAndA blob: %v", err)
	}
	expectedQuiz := quiz.Quiz{
		Id: quizId,
		Name: quizName,
		QuestionDuration: time.Duration(questionDuration) * time.Second,
		StartTime: time.Unix(startTime, 0),
		StopTime: time.Unix(stopTime, 0),
		Questions: []quiz.QuestionSummary{
			{
				Question: "3",
				ParticipantAnswers: []quiz.Answerer{
					{
						UserId: userIds[0],
						ParticipantOptions: u1_a3_decoded.SelectedOptionIndexes,
						AnsweredInDuration: time.Duration(u1_a3_decoded.AnsweredInDuration) * time.Second,
					},
					{
						UserId: userIds[1],
						ParticipantOptions: u2_a3_decoded.SelectedOptionIndexes,
						AnsweredInDuration: time.Duration(u2_a3_decoded.AnsweredInDuration) * time.Second,
					},
				},
			},
			{
				Question: "4",
				ParticipantAnswers: []quiz.Answerer{
					{
						UserId: userIds[0],
						ParticipantOptions: u1_a4_decoded.SelectedOptionIndexes,
						AnsweredInDuration: time.Duration(u1_a4_decoded.AnsweredInDuration) * time.Second,
					},
					{
						UserId: userIds[1],
						ParticipantOptions: u2_a4_decoded.SelectedOptionIndexes,
						AnsweredInDuration: time.Duration(u2_a4_decoded.AnsweredInDuration) * time.Second,
					},
				},
			},
			{
				Question: "5",
				ParticipantAnswers: []quiz.Answerer{
					{
						UserId: userIds[0],
						ParticipantOptions: u1_a5_decoded.SelectedOptionIndexes,
						AnsweredInDuration: time.Duration(u1_a5_decoded.AnsweredInDuration) * time.Second,
					},
					{
						UserId: userIds[1],
						ParticipantOptions: u2_a5_decoded.SelectedOptionIndexes,
						AnsweredInDuration: time.Duration(u2_a5_decoded.AnsweredInDuration) * time.Second,
					},
				},
			},
		},
		Participants: []quiz.Participant{
			{UserId: userIds[0], Name: user1_username, Score: int(leaderboard[userIds[0]]), StopTime: time.Unix(int64(user1_stoptime), 0) },
			{UserId: userIds[1], Name: user2_username, Score: int(leaderboard[userIds[1]]), StopTime: time.Unix(int64(user2_stoptime), 0) },
		},
	}

	sortQuestion := func(a, b quiz.QuestionSummary) bool { return a.Question < b.Question }
	sortParticipant := func(a, b quiz.Participant) bool { return a.Name < b.Name }
	sortAnswerer := func(a, b quiz.Answerer) bool {return a.UserId < b.UserId }
	if diff := cmp.Diff(actualQuiz, expectedQuiz, cmpopts.SortSlices(sortQuestion),
			cmpopts.SortSlices(sortParticipant), cmpopts.SortSlices(sortAnswerer)); diff != "" {
		t.Fatalf("Loaded quiz does match expected: %s", diff)
	}
}

// Tests extracting quiz returns error where information is missing 
func TestExtract_missing_data(t *testing.T) {
	tests := []string{
		"quizName",
		"questionDuration",
		"startTime",
		"stopTime",
		// User 1
		userIds[0] + ":username",
		userIds[0] + ":stopTime",
		userIds[0] + ":answer:3",
		userIds[0] + ":answer:4",
		userIds[0] + ":answer:5",
		// User 2
		userIds[1] + ":username",
		userIds[1] + ":stopTime",
		userIds[1] + ":answer:3",
		userIds[1] + ":answer:4",
		userIds[1] + ":answer:5",
	}
	for _, tst := range tests{
		keyToDel := quizId + ":" + tst
		t.Run(fmt.Sprintf("Absent '%s'", keyToDel), func(t *testing.T) {
			miniredis := miniredis.RunT(t)
			ctx := context.Background()
			if err := populateRedis(miniredis, quizId); err != nil {
				t.Errorf("Failed to initialize redis before test: Error: %v", err)
			}
			
			if !miniredis.Del(keyToDel) {
				t.Errorf("Failed to prepare redis for test")
			}
	
			extractor := NewRedisExtractorFromClient(redis.NewClient(&redis.Options{
				Addr: miniredis.Addr(),
			}))
	
			_, err := extractor.Extract(ctx, quizId)
			if err == nil {
				t.Errorf("Failed to return error from Extract")
			}

			if !strings.Contains(err.Error(), keyToDel) {
				t.Errorf("Error message didn't contain '%s'", keyToDel)
			}
		})
	}
}

// When deleting a quiz from Redis it deletes just that quiz and leaves others untouched
func TestDelete_ok(t *testing.T) {
	miniredis := miniredis.RunT(t)
	ctx := context.Background()

	quizToKeep := "quiztokeep"
	if err := populateRedis(miniredis, quizToKeep); err != nil {
		t.Fatalf("Failed to initialize redis before test: Error: %v", err)
	}
	quizToKeepKeys := miniredis.Keys()

	quizToDelete := "quiztodelete"
	if err := populateRedis(miniredis, quizToDelete); err != nil {
		t.Fatalf("Failed to initialize redis before test: Error: %v", err)
	}

	extractor := NewRedisExtractorFromClient(redis.NewClient(&redis.Options{
		Addr: miniredis.Addr(),
	}))

	if err := extractor.Delete(ctx, quizToDelete); err != nil {
		t.Fatalf("Failed to delete quiz '%s' from redis: Error %+v", quizToDelete, err)
	}

	keysAfterDel := miniredis.Keys()

	if diff := cmp.Diff(quizToKeepKeys, keysAfterDel); diff != "" {
		t.Fatalf("Keys for quiz that weren't deleted were modified: %s", diff)
	}
}

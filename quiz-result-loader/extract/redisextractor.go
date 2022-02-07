package loader

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"strconv"
	"time"

	q "github.com/Ryangwaite/mc-speedrun/quiz-result-loader/quiz"
	"github.com/go-redis/redis/v8"
)

type RedisExtractorOptions struct {
	Addr string
	Password string
}

type redisExtractor struct {
	rdb *redis.Client
}

func NewRedisExtractor(o RedisExtractorOptions) Extractor {
	rdb := redis.NewClient(&redis.Options{
		Addr: o.Addr,
		Password: o.Password,
	})

	return redisExtractor {
		rdb: rdb,
	}
}

func (r redisExtractor) Extract(ctx context.Context, quizId string) (q.Quiz, error) {

	quiz := q.Quiz{
		Id: quizId,
	}

	quizName, err := r.getQuizName(ctx, quizId)
	if err != nil {
		return quiz, err
	}
	quiz.Name = quizName

	questionDuration, err := r.getQuestionDuration(ctx, quizId)
	if err != nil {
		return quiz, err
	}
	quiz.QuestionDuration = questionDuration

	startTime, stopTime, err := r.getQuizTimes(ctx, quizId)
	if err != nil {
		return quiz, err
	}
	quiz.StartTime = startTime
	quiz.StopTime = stopTime

	leaderboardMap, err := r.getLeaderboard(ctx, quizId)
	if err != nil {
		return quiz, err
	}
	var participants []q.Participant
	for userId, score := range leaderboardMap {
		name, err := r.getUsername(ctx, quizId, userId)
		if err != nil {
			return quiz, err
		}
		userStopTime, err := r.getUserStopTime(ctx, quizId, userId)
		if err != nil {
			return quiz, err
		}
		participants = append(participants, q.Participant{
			UserId: userId,
			Name: name,
			Score: score,
			StopTime: userStopTime,
		})
	}
	quiz.Participants = participants
	
	selectedQuestionIndexes, err := r.getSelectedQuestionIndexes(ctx, quizId)
	if err != nil {
		return quiz, err
	}
	var questions []q.QuestionSummary
	var userIds []string
	for userId := range leaderboardMap { userIds = append(userIds, userId) }
	for _, qIndex := range selectedQuestionIndexes {
		qSummary, err := r.getQuestion(ctx, quizId, userIds, qIndex)
		if err != nil {
			return quiz, err
		}
		questions = append(questions, qSummary)
	}
	quiz.Questions = questions

	return quiz, nil
}

type loadError struct {
	attribute	string
	key 		string
}

func (e loadError) Error() string {
	return fmt.Sprintf("failed to load %s from key '%s'", e.attribute, e.key)
}

//// Redis Utility functions ////

func (r redisExtractor) getString(ctx context.Context, key string, onErrorAttribute string) (string, error) {
	val, err := r.rdb.Get(ctx, key).Result()
	if err != nil {
		return "", loadError{attribute:onErrorAttribute, key: key}
	}
	return val, nil
}

func (r redisExtractor) getTime(ctx context.Context, key string, onErrorAttribute string) (time.Time, error) {
	val, err := r.rdb.Get(ctx, key).Result()
	if err != nil {
		return time.Time{}, errors.New("Couldn't get time for key " + key)
	}
	epochSecs, err := strconv.Atoi(val)
	if err != nil {
		return time.Time{}, errors.New("Couldn't parse time for key " + key)
	}
	return time.Unix(int64(epochSecs), 0), nil
}

func (r redisExtractor) getQuizName(ctx context.Context, quizId string) (string, error) {
	key := quizId + ":quizName"
	return r.getString(ctx, key, "quiz name")
}

func (r redisExtractor) getQuestionDuration(ctx context.Context, quizId string) (time.Duration, error) {
	key := quizId + ":questionDuration"
	val, err := r.rdb.Get(ctx, key).Result()
	if err != nil {
		return time.Duration(0), loadError{attribute: "question duration", key: key}
	}

	duration, err := strconv.Atoi(val)
	if err != nil {
		return time.Duration(0), fmt.Errorf("couldn't parse questionDuration. " + err.Error())
	}
		
	return time.Duration(duration) * time.Second, nil
}

func (r redisExtractor) getSelectedQuestionIndexes(ctx context.Context, quizId string) ([]int, error) {
	key := quizId + ":selectedQuestionIndexes"
	result, err := r.rdb.LRange(ctx, key, 0, -1).Result()
	if err != nil {
		return []int{}, loadError{
			attribute: "selected question indexes",
			key: key, 
		}
	}

	var indexes []int
	for _, strIndex := range result {
		index, err := strconv.Atoi(strIndex)
		if err != nil {
			return indexes, fmt.Errorf("couldn't parse selected question index. " + err.Error())
		}
		indexes = append(indexes, index)
	}
	return indexes, nil
}

func (r redisExtractor) getQuizTimes(ctx context.Context, quizId string) (time.Time, time.Time, error) {
	key := quizId + ":startTime"
	startTime, err := r.getTime(ctx, key, "quiz start time")
	if err != nil {
		return time.Time{}, time.Time{}, err
	}
	
	key = quizId + ":stopTime"
	stopTime, err := r.getTime(ctx, key, "quiz stop time")
	if err != nil {
		return time.Time{}, time.Time{}, err
	}

	return startTime, stopTime, nil
}

func (r redisExtractor) getLeaderboard(ctx context.Context, quizId string) (map[string]int, error) {
	key := quizId + ":leaderboard"
	val, err := r.rdb.ZRangeWithScores(ctx, key, 0, -1).Result()
	if err != nil {
		return map[string]int{}, loadError{attribute: "leaderboard", key: key}
	}

	leaderboard := make(map[string]int)
	for _, pair := range val {
		userId, ok := pair.Member.(string)
		if !ok {
			return leaderboard, fmt.Errorf("failed to parse userId '%+v'", pair.Member)
		}

		leaderboard[userId] = int(pair.Score)
	}

	return leaderboard, nil
}

func (r redisExtractor) getUsername(ctx context.Context, quizId string, userId string) (string, error) {
	key := fmt.Sprintf("%s:%s:username", quizId, userId)
	return r.getString(ctx, key, "username")
}

func (r redisExtractor) getUserStopTime(ctx context.Context, quizId string, userId string) (time.Time, error) {
	key := fmt.Sprintf("%s:%s:stopTime", quizId, userId)
	return r.getTime(ctx, key, "user stop time")
}

type questionAnswerBlob struct {
	SelectedOptionIndexes		[]int		`json:"selectedOptionIndexes"`
	AnsweredInDuration			int			`json:"answeredInDuration"`
}

func (r redisExtractor) getQuestion(ctx context.Context, quizId string, userIds []string, questionIndex int) (q.QuestionSummary, error) {
	var question q.QuestionSummary
	for _, userId := range userIds {
		key := fmt.Sprintf("%s:%s:answer:%d", quizId, userId, questionIndex)
		rawValue, err := r.rdb.Get(ctx, key).Result()
		if err != nil {
			return question, loadError{attribute: "question answer", key: key}
		}
		// The contents are a json blob e.g. '{"selectedOptionIndexes":[1],"answeredInDuration":8}'
		var parsedValue questionAnswerBlob
		if err := json.Unmarshal([]byte(rawValue), &parsedValue); err != nil {
			return question, fmt.Errorf("failed to parse value for '%s'", key)
		}
		question.ParticipantAnswers = append(question.ParticipantAnswers, q.Answerer{
			UserId: userId,
			ParticipantOptions: parsedValue.SelectedOptionIndexes,
			AnsweredInDuration: time.Duration(parsedValue.AnsweredInDuration * int(time.Second)),
		})
	}

	// The Question text, options and correct options aren't stored in redis - just set the question
	// text to its index for joining elsewhere
	question.Question = fmt.Sprint(questionIndex)
	return question, nil
}
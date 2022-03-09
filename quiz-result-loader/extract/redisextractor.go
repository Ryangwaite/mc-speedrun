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
	Addr     string
	Password string
}

type redisExtractor struct {
	rdb *redis.Client
}

func NewRedisExtractor(o RedisExtractorOptions) Extractor {
	rdb := redis.NewClient(&redis.Options{
		Addr:     o.Addr,
		Password: o.Password,
	})

	return redisExtractor{
		rdb: rdb,
	}
}

func (r redisExtractor) Extract(ctx context.Context, quizId string) (q.Quiz, error) {

	// Give the extract operation 1 second to complete
	ctx, cancel := context.WithTimeout(ctx, 1*time.Second)
	defer cancel()

	// Extract all the needed items in parallel - count the amount retrieved in parallel for the aggregation phase
	itemsFetched := 0

	quizNameCh := make(chan string) // closed by function below
	quizNameErrCh := make(chan error)
	go r.extractQuizName(ctx, quizId, quizNameCh, quizNameErrCh)
	itemsFetched++

	questionDurationCh := make(chan time.Duration) // closed by function below
	questionDurationErrCh := make(chan error)
	go r.extractQuestionDuration(ctx, quizId, questionDurationCh, questionDurationErrCh)
	itemsFetched++

	startTimeCh := make(chan time.Time)
	stopTimeCh := make(chan time.Time)
	quizTimesErrCh := make(chan error)
	go r.extractQuizTimes(ctx, quizId, startTimeCh, stopTimeCh, quizTimesErrCh)
	itemsFetched += 2

	leaderboardCh := make(chan map[string]int)
	leaderboardErrCh := make(chan error)
	go r.extractLeaderboard(ctx, quizId, leaderboardCh, leaderboardErrCh)

	// Wait for the leaderboard to be fetched before moving on
	leaderboard := <-leaderboardCh

	participantsCh := make(chan []q.Participant)
	participantsErrCh := make(chan error)
	go r.extractParticipants(ctx, quizId, leaderboard, participantsCh, participantsErrCh)
	itemsFetched++

	questionsCh := make(chan []q.QuestionSummary)
	questionsErrCh := make(chan error)
	go r.extractQuestions(ctx, quizId, leaderboard, questionsCh, questionsErrCh)
	itemsFetched++

	// Fan-in all the error channels to 1
	errorCh := make(chan error)
	go func() {
		defer close(errorCh)
		var err error
		var more bool
		for {
			select {
			case err, more = <-quizNameErrCh:
			case err, more = <-questionDurationErrCh:
			case err, more = <-quizTimesErrCh:
			case err, more = <-leaderboardErrCh:
			case err, more = <-participantsErrCh:
			case err, more = <-questionsErrCh:
			case <-ctx.Done():
				// Stop when the context is done i.e. because the quiz was extracted successfully.
				return
			}
			if more {
				errorCh <- err
				return
			}
		}
	}()

	// Aggregrate everything into one quiz
	quizCh := make(chan q.Quiz)
	go func() {
		defer close(quizCh)
		quiz := q.Quiz{
			Id:               quizId,
			Name:             <-quizNameCh,
			QuestionDuration: <-questionDurationCh,
			StartTime:        <-startTimeCh,
			StopTime:         <-stopTimeCh,
			Participants:     <-participantsCh,
			Questions:        <-questionsCh,
		}
		quizCh <- quiz
	}()

	select {
	case quiz := <-quizCh:
		return quiz, nil
	case err := <-errorCh:
		return q.Quiz{}, err
	}
}

// Delete the quiz from redis
func (r redisExtractor) Delete(ctx context.Context, quizId string) error {
	pattern := quizId + ":*"
	iter := r.rdb.Scan(ctx, 0, pattern, 0).Iterator()
	for iter.Next(ctx) {
		if err := r.rdb.Del(ctx, iter.Val()).Err(); err != nil {
			return err
		}
	}
	if err := iter.Err(); err != nil {
		return err
	}
	
	// Successfully deleted it all
	return nil
}

func (r redisExtractor) extractQuizName(ctx context.Context, quizId string, quizNameCh chan<- string, errorCh chan<- error) {
	defer close(quizNameCh)
	defer close(errorCh)
	quizName, err := r.getQuizName(ctx, quizId)
	if err != nil { // don't add the message to channel if the ctx was cancelled
		errorCh <- err
		return
	}
	quizNameCh <- quizName
}

func (r redisExtractor) extractQuestionDuration(ctx context.Context, quizId string, questionDurationCh chan<- time.Duration, errorCh chan<- error) {
	defer close(questionDurationCh)
	defer close(errorCh)
	duration, err := r.getQuestionDuration(ctx, quizId)
	if err != nil {
		errorCh <- err
		return
	}
	questionDurationCh <- duration
}

func (r redisExtractor) extractQuizTimes(ctx context.Context, quizId string, startTimeCh chan<- time.Time, stopTimeCh chan<- time.Time, errorCh chan<- error) {
	defer close(startTimeCh)
	defer close(stopTimeCh)
	defer close(errorCh)
	startTime, stopTime, err := r.getQuizTimes(ctx, quizId)
	if err != nil {
		errorCh <- err
		return
	}
	startTimeCh <- startTime
	stopTimeCh <- stopTime
}

func (r redisExtractor) extractLeaderboard(ctx context.Context, quizId string, leaderboardCh chan<- map[string]int, errorCh chan<- error) {
	defer close(leaderboardCh)
	defer close(errorCh)
	leaderboard, err := r.getLeaderboard(ctx, quizId)
	if err != nil {
		errorCh <- err
		return
	}
	leaderboardCh <- leaderboard
}

func (r redisExtractor) extractParticipants(ctx context.Context, quizId string, leaderboard map[string]int, participantsCh chan<- []q.Participant, errorCh chan<- error) {
	defer close(participantsCh)
	defer close(errorCh)

	participantCh := make(chan q.Participant, len(leaderboard))
	defer close(participantCh)

	for uId, s := range leaderboard {
		// Closure over these vars for each iteration
		userId := uId
		score := s
		// Fetch the users name in parallel...
		nameChan := make(chan struct {
			Name string
			err  error
		}, 1)
		go func() {
			defer close(nameChan)
			name, err := r.getUsername(ctx, quizId, userId)
			if err != nil {
				nameChan <- struct {
					Name string
					err  error
				}{"", err}
				return
			}
			nameChan <- struct {
				Name string
				err  error
			}{name, nil}
		}()
		// ... with users stop time...
		stopTimeChan := make(chan struct {
			stopTime time.Time
			err      error
		}, 1)
		go func() {
			defer close(stopTimeChan)
			stopTime, err := r.getUserStopTime(ctx, quizId, userId)
			if err != nil {
				stopTimeChan <- struct {
					stopTime time.Time
					err      error
				}{time.Time{}, err}
				return
			}
			stopTimeChan <- struct {
				stopTime time.Time
				err      error
			}{stopTime, nil}
		}()
		// ... and aggregate the results
		go func() {
			p := q.Participant{
				UserId: userId,
				Score:  score,
			}
			for i := 0; i < 2; i++ {
				select {
				case nameChanResult := <-nameChan:
					if nameChanResult.err != nil {
						errorCh <- nameChanResult.err
						return
					}
					p.Name = nameChanResult.Name
				case stopTimeChanResult := <-stopTimeChan:
					if stopTimeChanResult.err != nil {
						errorCh <- stopTimeChanResult.err
						return
					}
					p.StopTime = stopTimeChanResult.stopTime
				}
			}
			participantCh <- p
		}()
	}

	// Aggregate all of the pariticipants
	var participants []q.Participant
	for p := range participantCh {
		participants = append(participants, p)

		if len(participants) == len(leaderboard) {
			// Thats all of them received
			break
		}
	}

	participantsCh <- participants
}

func (r redisExtractor) extractQuestions(ctx context.Context, quizId string, leaderboard map[string]int, questionsCh chan<- []q.QuestionSummary, errorCh chan<- error) {
	defer close(questionsCh)
	defer close(errorCh)

	selectedQuestionIndexes, err := r.getSelectedQuestionIndexes(ctx, quizId)
	if err != nil {
		errorCh <- err
		return
	}

	type QuestionSummaryChMsg struct {
		summary q.QuestionSummary
		err     error
	}
	questionSummaryCh := make(chan QuestionSummaryChMsg)
	defer close(questionSummaryCh)

	// Pull out just the userIds
	var userIds []string
	for userId := range leaderboard {
		userIds = append(userIds, userId)
	}

	for _, qIndex := range selectedQuestionIndexes {
		i := qIndex // Closure remade each iteration
		go func() {
			qSummary, err := r.getQuestion(ctx, quizId, userIds, i)
			if err != nil {
				questionSummaryCh <- QuestionSummaryChMsg{q.QuestionSummary{}, err}
				return
			}
			questionSummaryCh <- QuestionSummaryChMsg{qSummary, nil}
		}()
	}

	// Aggregate all the questions
	var questionSummaries []q.QuestionSummary
	for qs := range questionSummaryCh {
		if qs.err != nil {
			errorCh <- qs.err
			return
		}
		questionSummaries = append(questionSummaries, qs.summary)

		if len(questionSummaries) == len(selectedQuestionIndexes) {
			// Thats all of them
			break
		}
	}
	// deliver the result
	questionsCh <- questionSummaries
}

type loadError struct {
	attribute string
	key       string
	reason    string
}

func (e loadError) Error() string {
	return fmt.Sprintf("failed to load %s from key '%s'. Reason: %s", e.attribute, e.key, e.reason)
}

//// Redis Utility functions ////

func (r redisExtractor) getString(ctx context.Context, key string, onErrorAttribute string) (string, error) {
	val, err := r.rdb.Get(ctx, key).Result()
	if err != nil {
		return "", loadError{attribute: onErrorAttribute, key: key, reason: err.Error()}
	}
	return val, nil
}

func (r redisExtractor) getTime(ctx context.Context, key string, onErrorAttribute string) (time.Time, error) {
	val, err := r.rdb.Get(ctx, key).Result()
	if err != nil {
		return time.Time{}, fmt.Errorf("couldn't get time for key '%s' Error: %s", key, err.Error())
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
		return time.Duration(0), loadError{attribute: "question duration", key: key, reason: err.Error()}
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
			key:       key,
			reason:    err.Error(),
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
		return map[string]int{}, loadError{attribute: "leaderboard", key: key, reason: err.Error()}
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
	SelectedOptionIndexes []int `json:"selectedOptionIndexes"`
	AnsweredInDuration    int   `json:"answeredInDuration"`
}

func (r redisExtractor) getQuestion(ctx context.Context, quizId string, userIds []string, questionIndex int) (q.QuestionSummary, error) {
	var question q.QuestionSummary
	for _, userId := range userIds {
		key := fmt.Sprintf("%s:%s:answer:%d", quizId, userId, questionIndex)
		rawValue, err := r.rdb.Get(ctx, key).Result()
		if err != nil {
			return question, loadError{attribute: "question answer", key: key, reason: err.Error()}
		}
		// The contents are a json blob e.g. '{"selectedOptionIndexes":[1],"answeredInDuration":8}'
		var parsedValue questionAnswerBlob
		if err := json.Unmarshal([]byte(rawValue), &parsedValue); err != nil {
			return question, fmt.Errorf("failed to parse value for '%s'", key)
		}
		question.ParticipantAnswers = append(question.ParticipantAnswers, q.Answerer{
			UserId:             userId,
			ParticipantOptions: parsedValue.SelectedOptionIndexes,
			AnsweredInDuration: time.Duration(parsedValue.AnsweredInDuration * int(time.Second)),
		})
	}

	// The Question text, options and correct options aren't stored in redis - just set the question
	// text to its index for joining elsewhere
	question.Question = fmt.Sprint(questionIndex)
	return question, nil
}

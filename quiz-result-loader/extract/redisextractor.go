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
	"golang.org/x/sync/errgroup"
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

	errs, ctx := errgroup.WithContext(ctx)

	// Extract all the needed items in parallel - count the amount retrieved in parallel for the aggregation phase
	itemsFetched := 0

	quizNameCh := make(chan string, 1)
	errs.Go(func() error {
		defer close(quizNameCh)
		quizName, err := r.getQuizName(ctx, quizId)
		if err != nil {
			return err
		}
		itemsFetched++
		quizNameCh <- quizName
		return nil
	})
	

	questionDurationCh := make(chan time.Duration, 1)
	errs.Go(func() error {
		defer close(questionDurationCh)
		duration, err := r.getQuestionDuration(ctx, quizId)
		if err != nil {
			return err
		}
		itemsFetched++
		questionDurationCh <- duration
		return nil
	})
	
	startTimeCh := make(chan time.Time, 1)
	stopTimeCh := make(chan time.Time, 1)
	errs.Go(func() error {
		defer close(startTimeCh)
		defer close(stopTimeCh)
		startTime, stopTime, err := r.getQuizTimes(ctx, quizId)
		if err != nil {
			return err
		}
		itemsFetched += 2
		startTimeCh <- startTime
		stopTimeCh <- stopTime
		return nil
	})

	leaderboardMapResultCh := make(chan map[string]int, 1)
	errs.Go(func() error {
		defer close(leaderboardMapResultCh)
		leaderboardMap, err := r.getLeaderboard(ctx, quizId)
		if err != nil {
			return err
		}
		leaderboardMapResultCh<-leaderboardMap
		return nil
	})

	// Wait for the leaderboard to be fetch before moving on
	leaderboardMap := <-leaderboardMapResultCh

	allParticipantsCh := make(chan []q.Participant, 1)
	errs.Go(func() error {
		defer close(allParticipantsCh)

		participantsCh := make(chan q.Participant, len(leaderboardMap))
		defer close(participantsCh)

		for uId, s := range leaderboardMap {
			// Closure over these vars for each iteration
			userId := uId
			score := s
			// Fetch the users name in parallel...
			nameChan := make(chan string, 1)
			errs.Go(func() error {
				defer close(nameChan)
				name, err := r.getUsername(ctx, quizId, userId)
				if err != nil {
					return err
				}
				nameChan<-name
				return nil
			})
			// ... with users stop time...
			stopTimeChan := make(chan time.Time, 1)
			errs.Go(func() error {
				stopTime, err := r.getUserStopTime(ctx, quizId, userId)
				if err != nil {
					return err
				}
				stopTimeChan<-stopTime
				return nil
			})
			// ... and aggregate the results
			go func() {
				p := q.Participant{
					UserId: userId,
					Score: score,
				}
				for i := 0; i < 2; i++ {
					select{
					case p.Name = <-nameChan: 
					case p.StopTime = <-stopTimeChan:
					}
				}
				participantsCh<-p
			}()
		}

		// Aggregate all of the pariticipants
		var participants []q.Participant
		for p := range participantsCh {
			participants = append(participants, p)

			if len(participants) == len(leaderboardMap) {
				// Thats all of them received
				break
			}
		}

		itemsFetched += 1
		allParticipantsCh<-participants

		return nil
	})
	
	allQuestionsCh := make(chan []q.QuestionSummary, 1)
	errs.Go(func() error {
		defer close(allQuestionsCh)
		selectedQuestionIndexes, err := r.getSelectedQuestionIndexes(ctx, quizId)
		if err != nil {
			return err
		}
		questionSummaryCh := make(chan q.QuestionSummary)
		defer close(questionSummaryCh)
		
		// Pull out just the userIds
		var userIds []string
		for userId := range leaderboardMap { userIds = append(userIds, userId) }

		for _, qIndex := range selectedQuestionIndexes {
			i := qIndex // Closure remade each iteration
			errs.Go(func() error {
				qSummary, err := r.getQuestion(ctx, quizId, userIds, i)
				if err != nil {
					return err
				}
				questionSummaryCh<-qSummary
				return nil
			})
		}

		// Aggregate all the questions
		var questionSummaries []q.QuestionSummary
		for qs := range questionSummaryCh {
			questionSummaries = append(questionSummaries, qs)

			if len(questionSummaries) == len(selectedQuestionIndexes) {
				// Thats all of them
				break
			}
		}
		// deliver the result
		itemsFetched += 1
		allQuestionsCh<-questionSummaries
		return nil
	})

	quiz := q.Quiz{
		Id: quizId,
	}

	// Wait for all the items above to be captured
	if err := errs.Wait(); err != nil {
		return quiz, err
	}

	// Store all the items
	for ;itemsFetched > 0; itemsFetched--{
		select {
		case quiz.Name = <-quizNameCh:
		case quiz.QuestionDuration = <- questionDurationCh:
		case quiz.StartTime = <-startTimeCh:
		case quiz.StopTime = <-stopTimeCh:
		case quiz.Participants = <-allParticipantsCh:
		case quiz.Questions = <-allQuestionsCh:
		}
	}

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
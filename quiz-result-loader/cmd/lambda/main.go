package main

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"strconv"
	"time"

	"github.com/Ryangwaite/mc-speedrun/quiz-result-loader/extract"
	"github.com/Ryangwaite/mc-speedrun/quiz-result-loader/load"
	"github.com/Ryangwaite/mc-speedrun/quiz-result-loader/logfmt"
	"github.com/Ryangwaite/mc-speedrun/quiz-result-loader/quiz"
	"github.com/Ryangwaite/mc-speedrun/quiz-result-loader/subscribe"
	"github.com/Ryangwaite/mc-speedrun/quiz-result-loader/worker"
	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	awsCfg "github.com/aws/aws-sdk-go-v2/config"
	log "github.com/sirupsen/logrus"
)

type lambdaConfig struct {
	redis struct {
		host string
		port int
	}
	questionSet struct {
		path string
	}
}

// Loads the lambda config from the environment variables
func loadLambdaConfig() (lambdaConfig, error) {
	config := lambdaConfig{}

	redisHostKey := "REDIS_HOST"
	if config.redis.host = os.Getenv(redisHostKey); config.redis.host == "" {
		return config, fmt.Errorf("required env var '%s' was missing", redisHostKey)
	}

	redisPortKey := "REDIS_PORT"
	rawRedisPort := os.Getenv(redisPortKey)
	var err error
	if config.redis.port, err = strconv.Atoi(rawRedisPort); err != nil {
		return config, fmt.Errorf("required env var '%s' was missing or invalid. Error: %w", redisHostKey, err)
	}

	questionSetPathKey := "QUESTION_SET_PATH"
	if config.questionSet.path = os.Getenv(questionSetPathKey); config.questionSet.path == "" {
		return config, fmt.Errorf("required env var '%s' was missing", questionSetPathKey)
	}

	return config, nil
}

// Receive up to 10 messages to be processed
// Requires the following permissions on the execution role:
// 	- sqs:ReceiveMessage
//	- sqs:DeleteMessage
//	- sqs:GetQueueAttributes
//	- dynamodb:BatchWriteItem
//	- dynamodb:DeleteItem
//	- dynamodb:DescribeTable
//	- dynamodb:PutItem
//	- dynamodb:UpdateItem
//	- dynamodb:listTables
func HandleRequest(ctx context.Context, event events.SQSEvent) ([]events.SQSBatchItemFailure, error) {

	logger := log.New()
	logger.SetLevel(log.DebugLevel)
	logger.SetOutput(os.Stdout)
	logger.SetFormatter(logfmt.NewUtcLogFormatter())

	deadline, _ := ctx.Deadline()
	currentTime := time.Now()
	timeFormat := "2006-01-02 15:04:05"
	logger.Debugf("Current time is '%s'. This lambda must finish by deadline '%s'",
			currentTime.Format(timeFormat), deadline.Format(timeFormat))

	logger.Infof("Received message: %+v", event)

	var failEvents []events.SQSBatchItemFailure
	
	config, err := loadLambdaConfig()
	if err != nil {
		err := fmt.Errorf("failed to load config. Reason: %w", err)
		logger.Error(err)
		return failEvents, err
	}

	logger.Infof("Loaded config: %+v", config)
	
	// Build redis extractor
	extractor := extract.NewRedisExtractor(extract.RedisExtractorOptions{
		Addr: fmt.Sprintf("%s:%d", config.redis.host, config.redis.port),
		Password: "", // TODO: Check if this is necessary
	})

	// Build DynamoDB loader
	awsConfig, err := awsCfg.LoadDefaultConfig(context.TODO())
	if err != nil {
		err := fmt.Errorf("failed to load build aws config. Reason: %w", err)
		logger.Error(err)
		return failEvents, err
	}
	loader, err := load.NewDynamodDbLoader(load.DynamoDbLoaderOptions{
		AwsConfig: awsConfig,
		Logger: logger,
	})
	if err != nil {
		err := fmt.Errorf("failed to initialize DynamoDB loader. Reason: %w", err)
		logger.Error(err)
		return failEvents, err
	}

	newJobCh := make(chan string, 10)
	quizIdMsgIdMapper := make(map[string]string)

	totalRecordsToProcess := len(event.Records)
	for _, msg := range event.Records {
		msgId := msg.MessageId

		var event subscribe.QuizCompleteEvent
		if err := json.Unmarshal([]byte(msg.Body), &event); err != nil {
			// Failed to parse msg Body
			failEvents = append(failEvents, events.SQSBatchItemFailure{ItemIdentifier: msgId})
		}

		// Enqueue job to be processed and store reference to it's msg ID in the case of a failure
		quizId := event.Data.QuizId
		quizIdMsgIdMapper[quizId] = msgId
		newJobCh<-quizId

		logger.Debugf("Enqueued job for quiz ID '%s'", quizId)
	}

	logger.Debugf("Finished enqueueing %d records", totalRecordsToProcess)

	workCompleteCtx, cancelWorkers := context.WithCancel(ctx)
	completeJobCh := make(chan worker.CompleteJob, 10)

	go func() {
		processedRecords := 0
		for {
			select {
			case <-ctx.Done():
				if ctx.Err() != nil {
					logger.Warnf("Context was cancelled unexpectedly. Reason: %s", ctx.Err().Error())
				}
				return
			case completeJob := <-completeJobCh:
				processedRecords++
				if completeJob.Success() {
					logger.Infof("Worker %d finished processing quiz '%s' in %dms",
							completeJob.WorkerNum, completeJob.QuizId, completeJob.ProcessingTimeMillis)
				} else {
					logger.Warnf("Worker %d failed to process quiz '%s' in %dms. Reason: %s",
							completeJob.WorkerNum, completeJob.QuizId, completeJob.ProcessingTimeMillis, completeJob.Err.Error())
					// Enqueue a fail event for this record
					failEvents = append(failEvents, events.SQSBatchItemFailure{
						ItemIdentifier: quizIdMsgIdMapper[completeJob.QuizId],
					})
					
				}
				if processedRecords == totalRecordsToProcess {
					// Thats all of them - cancel the worker pool to allow the lambda to complete
					logger.Info("Finished processing all jobs")
					cancelWorkers()
					// This coroutine is now finished too
					return
				}
			}
		}
	}()

	logger.Info("Starting workers...")

	// Start the workers and block waiting for them to finish (when the ctx is cancelled)
	numWorkers := totalRecordsToProcess
	worker.WorkerPool(workCompleteCtx, logger, &quiz.QuizUtil{}, extractor, loader, config.questionSet.path,
			newJobCh, completeJobCh, numWorkers)

	logger.Info("Workers exited")

	return failEvents, nil
}

func main() {
	lambda.Start(HandleRequest)
}

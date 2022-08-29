package main

import (
	"context"
	"fmt"
	"os"
	"os/signal"

	"github.com/Ryangwaite/mc-speedrun/quiz-result-loader/config"
	"github.com/Ryangwaite/mc-speedrun/quiz-result-loader/deadletter"
	extract "github.com/Ryangwaite/mc-speedrun/quiz-result-loader/extract"
	"github.com/Ryangwaite/mc-speedrun/quiz-result-loader/load"
	"github.com/Ryangwaite/mc-speedrun/quiz-result-loader/logfmt"
	"github.com/Ryangwaite/mc-speedrun/quiz-result-loader/quiz"
	"github.com/Ryangwaite/mc-speedrun/quiz-result-loader/subscribe"
	"github.com/Ryangwaite/mc-speedrun/quiz-result-loader/worker"
	"github.com/aws/aws-sdk-go-v2/aws"
	awsConfig "github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	log "github.com/sirupsen/logrus"
)

// Builds an AWS Config from the Application config
func buildAwsConfig(config config.Config) (aws.Config, error) {
	return awsConfig.LoadDefaultConfig(context.TODO(),
		awsConfig.WithRegion(config.DynamoDB.Region),
		// Use dynamodb-local
		awsConfig.WithEndpointResolverWithOptions(aws.EndpointResolverWithOptionsFunc(
			func(s, r string, o ...interface{}) (aws.Endpoint, error) {
				return aws.Endpoint{URL: config.DynamoDB.EndpointUrl}, nil
			},
		)),
		awsConfig.WithCredentialsProvider(credentials.StaticCredentialsProvider{
			Value: aws.Credentials{
				// These don't matter for dynmaodb-local
				AccessKeyID: config.DynamoDB.AccessKeyID,
				SecretAccessKey: config.DynamoDB.SecretAccessKey,
			},
		}),
	)
}

func main() {

	logger := log.New()
	logger.SetLevel(log.InfoLevel)
	logger.SetOutput(os.Stdout)
	logger.SetFormatter(logfmt.NewUtcLogFormatter())

	config, err := config.Load("./config.ini")
	if err != nil {
		logger.Panicf("Failed to load config: %s", err.Error())
	}

	logger.Infof("Loaded config: %+v\n", config)

	// Assemble the extractor and loader for the workers below
	extractor := extract.NewRedisExtractor(extract.RedisExtractorOptions{
		Addr: fmt.Sprintf("%s:%d", config.Redis.Host, config.Redis.Port),
		Password: "",
	})

	awsConfig, err := buildAwsConfig(config)
	if err != nil {
		logger.Panic("Failed to build AWS config. Error: " + err.Error())
	}

	loader, err := load.NewDynamodDbLoader(load.DynamoDbLoaderOptions{
		AwsConfig: awsConfig,
		Logger: logger,
	})
	if err != nil {
		logger.Panic("Failed to initialize DynamoDB loader. Error: " + err.Error())
	}

	// Stop the context (workers and everything) when ctrl-c is pressed
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt)
	defer stop()
	go func() {
		// Stops diverting signals to the context as soon as it completes
		<-ctx.Done()
		stop()
	}()

	subscriber, err := subscribe.NewRabbitMqReceiver(subscribe.RabbitMqReceiverOptions{
		Host: config.RabbitMQ.Host,
		Port: config.RabbitMQ.Port,
		Username: config.RabbitMQ.Username,
		Password: config.RabbitMQ.Password,
		QueueName: config.RabbitMQ.QueueName,
		Logger: logger,
	})
	if err != nil {
		logger.Panicf("Failed to initialize RabbitMQ receiver: %s", err.Error())
	}

	quizCh := make(chan string, 10)
	completeJobCh := make(chan worker.CompleteJob, 10)

	go func() {
		// Block forever waiting on subscription messages - enqueues work to do
		subscriber.Start(ctx, quizCh)
	}()

	deadLetterCh := make (chan deadletter.DeadLetter, 10)

	go func() {
		// Process all completed jobs
		for {
			select {
			case <-ctx.Done():
				if ctx.Err() != nil {
					logger.Warn(ctx.Err().Error())
				}
				return
			case completeJob := <-completeJobCh:
				if completeJob.Success() {
					logger.Infof("Worker %d finished processing quiz '%s' in %dms",
							completeJob.WorkerNum, completeJob.QuizId, completeJob.ProcessingTimeMillis)
				} else {
					// Send to deadletter receiver for processing
					deadLetterCh<-deadletter.DeadLetter{
						QuizId: completeJob.QuizId,
						ErrReason: completeJob.Err,
					}
				}
			}
		}
	}()

	go func() {
		// Process the dead letters
		deadletter.DeadLetterLogReceiver(ctx, logger, deadLetterCh)
	}()

	// Start the workers and block waiting for them to finish (when the ctx is cancelled)
	worker.WorkerPool(ctx, logger, &quiz.QuizUtil{}, extractor, loader, config.QuestionSet.Path, quizCh, completeJobCh, 10)

	fmt.Println("Done")
}
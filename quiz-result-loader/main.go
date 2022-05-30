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
	"github.com/Ryangwaite/mc-speedrun/quiz-result-loader/worker"

	"github.com/Ryangwaite/mc-speedrun/quiz-result-loader/logfmt"
	"github.com/Ryangwaite/mc-speedrun/quiz-result-loader/subscribe"
	log "github.com/sirupsen/logrus"
)

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
	loader, err := load.NewDynamodDbLoader(load.DynamoDbLoaderOptions{
		Region: config.DynamoDB.Region,
		EndpointUrl: config.DynamoDB.EndpointUrl,
		AccessKeyID: config.DynamoDB.AccessKeyID,
		SecretAccessKey: config.DynamoDB.SecretAccessKey,
		Logger: logger,
	})
	if err != nil {
		logger.Panic("Failed to load default AWS config. Error: " + err.Error())
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
	deadLetterCh := make (chan deadletter.DeadLetter, 10)

	go func() {
		// Block forever waiting on subscription messages
		subscriber.Start(ctx, quizCh)
	}()

	go func() {
		// Handle any messages that couldn't be processed
		deadletter.DeadLetterLogReceiver(ctx, logger, deadLetterCh)
	}()

	// Start the workers and block waiting for them to finish (when the ctx is cancelled)
	worker.WorkerPool(ctx, logger, extractor, loader, config.QuestionSet.Path, quizCh, deadLetterCh, 10)

	fmt.Println("Done")
}
package main

import (
	"context"
	"fmt"
	"os"

	"github.com/Ryangwaite/mc-speedrun/quiz-result-loader/config"
	extract "github.com/Ryangwaite/mc-speedrun/quiz-result-loader/extract"
	"github.com/Ryangwaite/mc-speedrun/quiz-result-loader/load"
	"github.com/Ryangwaite/mc-speedrun/quiz-result-loader/worker"

	// "github.com/Ryangwaite/mc-speedrun/quiz-result-loader/load"
	"github.com/Ryangwaite/mc-speedrun/quiz-result-loader/logfmt"
	"github.com/Ryangwaite/mc-speedrun/quiz-result-loader/subscribe"
	log "github.com/sirupsen/logrus"
)

func main() {

	log.SetLevel(log.DebugLevel)
	log.SetOutput(os.Stdout)
	log.SetFormatter(logfmt.NewUtcLogFormatter())

	config, err := config.Load("./config.ini")
	if err != nil {
		log.Panicf("Failed to load config: %s", err.Error())
	}

	log.Infof("Loaded config: %+v\n", config)

	// Assemble the extractor and loader for the workers below
	extractor := extract.NewRedisExtractor(extract.RedisExtractorOptions{
		Addr: fmt.Sprintf("%s:%d", config.Redis.Host, config.Redis.Port),
		Password: "",
	})
	loader := load.NewDynamodDbLoader(load.DynamoDbLoaderOptions{
		Region: config.DynamoDB.Region,
		EndpointUrl: config.DynamoDB.EndpointUrl,
		AccessKeyID: config.DynamoDB.AccessKeyID,
		SecretAccessKey: config.DynamoDB.SecretAccessKey,
	})

	var ctx = context.Background()

	// TODO: Move the hardcoded config here to Config
	subscriber, err := subscribe.NewRabbitMqReceiver(subscribe.RabbitMqReceiverOptions{
		Host: "localhost",
		Port: 5672,
		Username: "admin",
		Password: "passwd",
		QueueName: "quiz-complete",
	})
	if err != nil {
		log.Panicf("Failed to initialize RabbitMQ receiver: %s", err.Error())
	}

	quizCh := make(chan string, 10)

	go func() {
		worker.WorkerPool(ctx, extractor, loader, config.QuestionSet.Path, quizCh, 1)
	}()

	// Block forever waiting on subscription messages
	subscriber.Start(ctx, quizCh)

	fmt.Println("I shouldn't see this")
	
}
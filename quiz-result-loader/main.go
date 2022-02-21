package main

import (
	"context"
	"errors"
	"fmt"
	"os"
	"strconv"

	"github.com/Ryangwaite/mc-speedrun/quiz-result-loader/config"
	// extract "github.com/Ryangwaite/mc-speedrun/quiz-result-loader/extract"
	// "github.com/Ryangwaite/mc-speedrun/quiz-result-loader/load"
	"github.com/Ryangwaite/mc-speedrun/quiz-result-loader/logfmt"
	"github.com/Ryangwaite/mc-speedrun/quiz-result-loader/quiz"
	"github.com/Ryangwaite/mc-speedrun/quiz-result-loader/subscribe"
	log "github.com/sirupsen/logrus"
)

func combineExtractedQuizAndQuestions(extractedQuiz quiz.Quiz, questions quiz.QuestionAndAnswers) (quiz.Quiz, error) {
	for i, question := range extractedQuiz.Questions {
		// The loader didn't know the question text so just substituted the question index instead
		qIndex, err := strconv.Atoi(question.Question)
		if err != nil {
			return extractedQuiz, errors.New("expected question from extracted quiz to be an index")
		}
		// Copy the question fields into the quiz
		qAndA := questions[qIndex]
		extractedQuiz.Questions[i].Question = qAndA.Question
		extractedQuiz.Questions[i].Options = qAndA.Options
		extractedQuiz.Questions[i].CorrectOptions = qAndA.Answers
	}
	return extractedQuiz, nil
}

func main() {

	log.SetLevel(log.DebugLevel)
	log.SetOutput(os.Stdout)
	log.SetFormatter(logfmt.NewUtcLogFormatter())

	config, err := config.Load("./config.ini")
	if err != nil {
		log.Panicf("Failed to load config: %s", err.Error())
	}

	log.Infof("Loaded config: %+v\n", config)

	var ctx = context.Background()

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

	subscriber.Start(ctx, quizCh)

	fmt.Println("I shouldn't see this")
	
}







// TODO: Move all of the following into a worker, just here while the subscriber is being tested

// //// Extract ////

// extractor := extract.NewRedisExtractor(extract.RedisExtractorOptions{
// 	Addr: fmt.Sprintf("%s:%d", config.Redis.Host, config.Redis.Port),
// 	Password: "",
// })

// quizId := "sampledata1"

// questionSetPath := path.Join(config.QuestionSet.Path, quizId + ".json")
// questions, err := quiz.LoadQuestionsFromFile(questionSetPath)
// if err != nil {
// 	panic(err)
// }

// // NOTE: This extracted quiz doesn't have completed questions
// extractedQuiz, err := extractor.Extract(ctx, quizId)
// if err != nil {
// 	log.Panic("Failed to extract: " + err.Error())
// }

// completeQuiz, err := combineExtractedQuizAndQuestions(extractedQuiz, questions)
// if err != nil {
// 	log.Panic(err)
// }
// log.Debugf("Complete loaded quiz: %+v\n", completeQuiz)

// //// Load ////
// loader := load.NewDynamodDbLoader(load.DynamoDbLoaderOptions{
// 	Region: config.DynamoDB.Region,
// 	EndpointUrl: config.DynamoDB.EndpointUrl,
// 	AccessKeyID: config.DynamoDB.AccessKeyID,
// 	SecretAccessKey: config.DynamoDB.SecretAccessKey,
// })
// if err := loader.Load(context.TODO(), completeQuiz); err != nil {
// 	log.Panic(err)
// }
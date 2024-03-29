package load

import (
	"context"
	"fmt"

	"github.com/Ryangwaite/mc-speedrun/quiz-result-loader/quiz"
	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
	"github.com/aws/aws-sdk-go-v2/feature/dynamodb/attributevalue"
	log "github.com/sirupsen/logrus"
)

// The name of the quiz table to load quizzes into
const quizTableName string = "quiz"

type marshalledQuiz map[string]types.AttributeValue
type DynamoDbLoaderOptions struct {
	AwsConfig 			aws.Config
	Logger				*log.Logger
}

type dynamoDbLoader struct {
	client *dynamodb.Client
	logger *log.Logger
}

func NewDynamodDbLoader(options DynamoDbLoaderOptions) (Loader, error) {
	return dynamoDbLoader{
		client: dynamodb.NewFromConfig(options.AwsConfig),
		logger: options.Logger,
	}, nil
}

// Loads the quiz to the "quiz" table in dynamodb. If this table doesn't exist
// then it's created before loading
func (d dynamoDbLoader) Load(ctx context.Context, quiz quiz.Quiz) error {

	// Marshall asynchronously
	mQuizCh := make(chan struct{q marshalledQuiz; err error})
	go func() {
		defer close(mQuizCh)
		q, err := marshalQuiz(quiz)
		mQuizCh <- struct{q marshalledQuiz; err error}{q, err}
	}()

	if !d.quizTableExists(ctx) {
		d.logger.Info("Quiz table doesn't yet exist - creating it.")
		if err := d.createQuizTable(ctx); err != nil {
			return err
		}
	}

	mQuiz := <-mQuizCh
	if mQuiz.err != nil {
		return mQuiz.err
	}

	if err := d.putQuiz(ctx, mQuiz.q); err != nil {
		return err
	}

	return nil
}

func (d dynamoDbLoader) quizTableExists(ctx context.Context) bool {
	input := dynamodb.DescribeTableInput{
		TableName: aws.String(quizTableName),
	}
	output, err := d.client.DescribeTable(ctx, &input)
	if err != nil {
		d.logger.Debugf("DescribeTable result: %s", err.Error())
		return false
	}

	return *output.Table.TableName == quizTableName
}

func (d dynamoDbLoader) createQuizTable(ctx context.Context) error {
	input := dynamodb.CreateTableInput{
		TableName: aws.String(quizTableName),
		AttributeDefinitions: []types.AttributeDefinition{
			{
				AttributeName: aws.String("id"),
				AttributeType: types.ScalarAttributeTypeS,
			},
		},
		KeySchema: []types.KeySchemaElement{
			{
				AttributeName: aws.String("id"),
				KeyType: types.KeyTypeHash,
			},
		},
		ProvisionedThroughput: &types.ProvisionedThroughput{
			// NOTE: These dont matter when using dynamodb-local. See https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/DynamoDBLocal.UsageNotes.html#DynamoDBLocal.Differences
			ReadCapacityUnits: aws.Int64(1),
			WriteCapacityUnits: aws.Int64(1),
		},
	}
	_, err := d.client.CreateTable(ctx, &input)
	// TODO: Wait for table to be created before writing to it. It's ok
	// atm since the cdk stack creates it.
	return err
}

// Marshalls the provided quiz into the correct format for storing in
// a dynamodb table
func marshalQuiz(quiz quiz.Quiz) (marshalledQuiz, error) {
	return attributevalue.MarshalMap(quiz)
}

// Stores the marshalled quiz in the dynamodb table
func (d dynamoDbLoader) putQuiz(ctx context.Context, mQuiz marshalledQuiz) error {
	input := dynamodb.PutItemInput{
		TableName: aws.String(quizTableName),
		Item: mQuiz,
	}

	if _, err := d.client.PutItem(ctx, &input); err != nil {
		return fmt.Errorf("failed to put item: %v", err)
	}

	return nil
}
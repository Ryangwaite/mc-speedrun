package load

import (
	"context"
	"fmt"
	"log"

	"github.com/Ryangwaite/mc-speedrun/quiz-result-loader/quiz"
	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
	"github.com/aws/aws-sdk-go-v2/feature/dynamodb/attributevalue"
)

// The name of the quiz table to load quizzes into
var quizTableName string = "quiz"

type dynamoDbLoader struct {
	client *dynamodb.Client
}

func (d dynamoDbLoader) Load(ctx context.Context, quiz quiz.Quiz) error {
	fmt.Println("Load was called")

	if !d.quizTableExists(ctx) {
		fmt.Println("Quiz table doesn't yet exist - creating it.")
		if err := d.createQuizTable(ctx); err != nil {
			fmt.Println(err)
		}
	} else {
		fmt.Println("Quiz table already exists - not creating.")
	}

	if err := d.putQuiz(ctx, quiz); err != nil {
		return err
	}

	return nil
}

func NewDynamodDbLoader() Loader {
	cfg, err := config.LoadDefaultConfig(context.TODO(),
		config.WithRegion("us-east-2"),
		// Use dynamodb-local
		config.WithEndpointResolverWithOptions(aws.EndpointResolverWithOptionsFunc(
			func(service, region string, options ...interface{}) (aws.Endpoint, error) {
				return aws.Endpoint{URL: "http://localhost:8000"}, nil
			},
		)),
		config.WithCredentialsProvider(credentials.StaticCredentialsProvider{
			Value: aws.Credentials{
				// These don't matter for dynmaodb-local
				AccessKeyID: "dynamodblocalkeyid",
				SecretAccessKey: "dynamodblocalsecretaccesskey",
			},
		}),
	)

	if err != nil {
		log.Panic("Failed to load default AWS config. Error: " + err.Error())
	}
	
	return dynamoDbLoader{
		client: dynamodb.NewFromConfig(cfg),
	}
}

func (d dynamoDbLoader) quizTableExists(ctx context.Context) bool {
	input := dynamodb.DescribeTableInput{
		TableName: aws.String(quizTableName),
	}
	output, err := d.client.DescribeTable(ctx, &input)
	if err != nil {
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
	return err
}

func (d dynamoDbLoader) putQuiz(ctx context.Context, quiz quiz.Quiz) error {

	marshelledItem, err := attributevalue.MarshalMap(quiz)
	if err != nil {
		return fmt.Errorf("failed to DynamoDB marshal record: %v", err)
	}

	input := dynamodb.PutItemInput{
		TableName: aws.String(quizTableName),
		Item: marshelledItem,
	}

	if _, err := d.client.PutItem(ctx, &input); err != nil {
		return fmt.Errorf("failed to put item: %v", err)
	}

	fmt.Println("Quiz successfully putted")

	return nil
}
package load

import (
	"context"
	"fmt"

	"github.com/Ryangwaite/mc-speedrun/quiz-result-loader/quiz"
	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
	"github.com/aws/aws-sdk-go-v2/feature/dynamodb/attributevalue"
	log "github.com/sirupsen/logrus"
)

// The name of the quiz table to load quizzes into
var quizTableName string = "quiz"

type DynamoDbLoaderOptions struct {
	Region 				string
	EndpointUrl			string
	AccessKeyID			string
	SecretAccessKey		string
}

type dynamoDbLoader struct {
	client *dynamodb.Client
}

func NewDynamodDbLoader(options DynamoDbLoaderOptions) Loader {
	cfg, err := config.LoadDefaultConfig(context.TODO(),
		config.WithRegion(options.Region),
		// Use dynamodb-local
		config.WithEndpointResolverWithOptions(aws.EndpointResolverWithOptionsFunc(
			func(s, r string, o ...interface{}) (aws.Endpoint, error) {
				return aws.Endpoint{URL: options.EndpointUrl}, nil
			},
		)),
		config.WithCredentialsProvider(credentials.StaticCredentialsProvider{
			Value: aws.Credentials{
				// These don't matter for dynmaodb-local
				AccessKeyID: options.AccessKeyID,
				SecretAccessKey: options.SecretAccessKey,
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

func (d dynamoDbLoader) Load(ctx context.Context, quiz quiz.Quiz) error {
	if !d.quizTableExists(ctx) {
		log.Info("Quiz table doesn't yet exist - creating it.")
		if err := d.createQuizTable(ctx); err != nil {
			return err
		}
	} else {
		log.Debug("Quiz table already exists - not creating.")
	}

	if err := d.putQuiz(ctx, quiz); err != nil {
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

	log.Infof("Quiz '%s' loaded", quiz.Id)

	return nil
}
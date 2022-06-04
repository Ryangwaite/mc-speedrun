package load

import (
	"bytes"
	"context"
	"fmt"
	"testing"

	"github.com/Ryangwaite/mc-speedrun/quiz-result-loader/internal/testutils"
	"github.com/Ryangwaite/mc-speedrun/quiz-result-loader/quiz"
	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
	"github.com/aws/smithy-go/middleware"
	log "github.com/sirupsen/logrus"
)

//------------------------------------------
// Code adapted from: https://gist.github.com/Cyberax/eb42d249d022c55ce9dc6572309200ce

// Context key for saving/restoring the request across stages of the middleware stack
type initialRequestKey struct {}

// Saves the request object to the context early in the stack, making it available for
// mockRetargetDeserializeMiddleware
type saveRequestMiddleware struct {}

func (s *saveRequestMiddleware) ID() string {
	return "OriginalRequestSaver"
}

func (s *saveRequestMiddleware) HandleInitialize(ctx context.Context, in middleware.InitializeInput,
		next middleware.InitializeHandler) (out middleware.InitializeOutput, metadata middleware.Metadata, err error) {
	// Save the initial request to the context so that it can later be used to run the matching mock implementation
	// in the mockRetargetDeserializeMiddleware. 
	ctxWithReq := context.WithValue(ctx, &initialRequestKey{}, in.Parameters)
	return next.HandleInitialize(ctxWithReq, in)
}

// Reads the request object from the context and runs the corresponding mock implementation
type mockRetargetDeserializeMiddleware struct {
	awsConfig *mockDynamodbAwsConfig
}

func (m *mockRetargetDeserializeMiddleware) ID() string {
	return "mockRetarget"
}

func (m *mockRetargetDeserializeMiddleware) HandleDeserialize(ctx context.Context, in middleware.DeserializeInput,
		next middleware.DeserializeHandler) (out middleware.DeserializeOutput, metadata middleware.Metadata, err error) {
	params := ctx.Value(&initialRequestKey{})
	switch input := params.(type) {
	case *dynamodb.DescribeTableInput:
		out.Result, err = m.awsConfig.describeTableHandler(ctx, input)
	case *dynamodb.CreateTableInput:
		out.Result, err = m.awsConfig.createTableHandler(ctx, input)
	case *dynamodb.PutItemInput:
		out.Result, err = m.awsConfig.putItemHandler(ctx, input)
	default:
		panic(fmt.Sprintf("Unexpected type: %T", params))
	}
	return
}

type mockDynamodbAwsConfig struct {
	describeTableHandler func(ctx context.Context, params *dynamodb.DescribeTableInput) (*dynamodb.DescribeTableOutput, error)
	createTableHandler func(ctx context.Context, params *dynamodb.CreateTableInput) (*dynamodb.CreateTableOutput, error)
	putItemHandler func(ctx context.Context, params *dynamodb.PutItemInput) (*dynamodb.PutItemOutput, error)
}

func (a *mockDynamodbAwsConfig) AwsConfig() aws.Config {
	cfg := aws.NewConfig()
	cfg.Region = "test"
	cfg.APIOptions = []func(*middleware.Stack) error{
		func(stack *middleware.Stack) error {
			stack.Initialize.Add(&saveRequestMiddleware{}, middleware.Before)

			// Clear default middleware
			stack.Build.Clear()
			stack.Finalize.Clear()
			stack.Deserialize.Clear()

			stack.Deserialize.Add(&mockRetargetDeserializeMiddleware{awsConfig: a}, middleware.Before)

			return nil
		},
	}

	return *cfg
}

//------------------------------------------

func NewDynamodDbLoaderFromClientAndLogger(client *dynamodb.Client, logger *log.Logger) dynamoDbLoader {
	return dynamoDbLoader{
		client: client,
		logger: logger,
	}
}

// Builds a new instance of a completed quiz using the provided quizId
func BuildCompletedQuiz(quizId string) quiz.Quiz {
	return quiz.Quiz{

	}
}

// Tests successfully loading when the quiz table exists
func TestLoad_ok_table_exists(t *testing.T) {
	quizId := "quiz1"
	tableName := quizTableName

	describeTableCallCount := 0
	createTableCallCount := 0
	putItemCallCount := 0
	mockAwsConfigProvider := mockDynamodbAwsConfig{
		describeTableHandler: func(ctx context.Context, params *dynamodb.DescribeTableInput) (*dynamodb.DescribeTableOutput, error) {
			describeTableCallCount++
			return &dynamodb.DescribeTableOutput{
				Table: &types.TableDescription{TableName: &tableName},  // Table exists
			}, nil // Success
		},
		createTableHandler: func(ctx context.Context, params *dynamodb.CreateTableInput) (*dynamodb.CreateTableOutput, error) {
			createTableCallCount++
			return &dynamodb.CreateTableOutput{}, nil // success
		},
		putItemHandler: func(ctx context.Context, params *dynamodb.PutItemInput) (*dynamodb.PutItemOutput, error) {
			putItemCallCount++
			return &dynamodb.PutItemOutput{}, nil // success
		},
	}

	loader := NewDynamodDbLoaderFromClientAndLogger(
		dynamodb.NewFromConfig(mockAwsConfigProvider.AwsConfig()),
		testutils.BuildMemoryLogger(new(bytes.Buffer)),
	)
	quiz := BuildCompletedQuiz(quizId)

	if err := loader.Load(context.Background(), quiz); err != nil {
		t.Fatalf("Failed to load quiz: Error: %s", err.Error())
	}
	if describeTableCallCount != 1 {
		t.Errorf("Called DescribeTable %d times but expected 1", describeTableCallCount)
	}
	if createTableCallCount != 0 {
		t.Errorf("Called CreateTable %d times but expected 0", createTableCallCount)
	}
	if putItemCallCount != 1 {
		t.Errorf("Called PutItem %d times but expected 1", putItemCallCount)
	}
}

// Tests successfully loading when the quiz table doesn't yet exist
func TestLoad_ok_table_absent(t *testing.T) {
	quizId := "quiz1"
	tableName := "notthetablewerelookingfor"

	describeTableCallCount := 0
	createTableCallCount := 0
	putItemCallCount := 0
	mockAwsConfigProvider := mockDynamodbAwsConfig{
		describeTableHandler: func(ctx context.Context, params *dynamodb.DescribeTableInput) (*dynamodb.DescribeTableOutput, error) {
			describeTableCallCount++
			return &dynamodb.DescribeTableOutput{
				Table: &types.TableDescription{TableName: &tableName},  // The table we're looking for doesn't exist
			}, nil // Call itself is a success
		},
		createTableHandler: func(ctx context.Context, params *dynamodb.CreateTableInput) (*dynamodb.CreateTableOutput, error) {
			createTableCallCount++
			return &dynamodb.CreateTableOutput{}, nil // success
		},
		putItemHandler: func(ctx context.Context, params *dynamodb.PutItemInput) (*dynamodb.PutItemOutput, error) {
			putItemCallCount++
			return &dynamodb.PutItemOutput{}, nil // success
		},
	}

	loader := NewDynamodDbLoaderFromClientAndLogger(
		dynamodb.NewFromConfig(mockAwsConfigProvider.AwsConfig()),
		testutils.BuildMemoryLogger(new(bytes.Buffer)),
	)
	quiz := BuildCompletedQuiz(quizId)

	if err := loader.Load(context.Background(), quiz); err != nil {
		t.Fatalf("Failed to load quiz: Error: %s", err.Error())
	}
	if describeTableCallCount != 1 {
		t.Errorf("Called DescribeTable %d times but expected 1", describeTableCallCount)
	}
	if createTableCallCount != 1 {
		t.Errorf("Called CreateTable %d times but expected 1", createTableCallCount)
	}
	if putItemCallCount != 1 {
		t.Errorf("Called PutItem %d times but expected 1", putItemCallCount)
	}
}

// Tests loading when the quiz table fails to be created
func TestLoad_fail_create_table(t *testing.T) {
	quizId := "quiz1"
	describeTableCallCount := 0
	createTableCallCount := 0
	putItemCallCount := 0
	mockAwsConfigProvider := mockDynamodbAwsConfig{
		describeTableHandler: func(ctx context.Context, params *dynamodb.DescribeTableInput) (*dynamodb.DescribeTableOutput, error) {
			describeTableCallCount++
			return &dynamodb.DescribeTableOutput{}, fmt.Errorf("Table doesnt exist") // Interpreted as False for table not existing
		},
		createTableHandler: func(ctx context.Context, params *dynamodb.CreateTableInput) (*dynamodb.CreateTableOutput, error) {
			createTableCallCount++
			return &dynamodb.CreateTableOutput{}, fmt.Errorf("Failed to create table")
		},
		putItemHandler: func(ctx context.Context, params *dynamodb.PutItemInput) (*dynamodb.PutItemOutput, error) {
			putItemCallCount++
			return &dynamodb.PutItemOutput{}, nil // success
		},
	}

	loader := NewDynamodDbLoaderFromClientAndLogger(
		dynamodb.NewFromConfig(mockAwsConfigProvider.AwsConfig()),
		testutils.BuildMemoryLogger(new(bytes.Buffer)),
	)
	quiz := BuildCompletedQuiz(quizId)

	if err := loader.Load(context.Background(), quiz); err == nil {
		t.Errorf("Failed to return error")
	}
	if describeTableCallCount != 1 {
		t.Errorf("Called DescribeTable %d times but expected 1", describeTableCallCount)
	}
	if createTableCallCount != 1 {
		t.Errorf("Called CreateTable %d times but expected 1", createTableCallCount)
	}
	if putItemCallCount != 0 {
		t.Errorf("Called PutItem %d times but expected 0", putItemCallCount)
	}
}

// Tests loading when the quiz table exists but fails to write to it
func TestLoad_fail_put_quiz(t *testing.T) {
	quizId := "quiz1"
	tableName := quizTableName

	describeTableCallCount := 0
	createTableCallCount := 0
	putItemCallCount := 0
	mockAwsConfigProvider := mockDynamodbAwsConfig{
		describeTableHandler: func(ctx context.Context, params *dynamodb.DescribeTableInput) (*dynamodb.DescribeTableOutput, error) {
			describeTableCallCount++
			return &dynamodb.DescribeTableOutput{
				Table: &types.TableDescription{TableName: &tableName},  // Table exists
			}, nil // Success
		},
		createTableHandler: func(ctx context.Context, params *dynamodb.CreateTableInput) (*dynamodb.CreateTableOutput, error) {
			createTableCallCount++
			return &dynamodb.CreateTableOutput{}, nil // success
		},
		putItemHandler: func(ctx context.Context, params *dynamodb.PutItemInput) (*dynamodb.PutItemOutput, error) {
			putItemCallCount++
			return &dynamodb.PutItemOutput{}, fmt.Errorf("Failed to write quiz")
		},
	}

	loader := NewDynamodDbLoaderFromClientAndLogger(
		dynamodb.NewFromConfig(mockAwsConfigProvider.AwsConfig()),
		testutils.BuildMemoryLogger(new(bytes.Buffer)),
	)
	quiz := BuildCompletedQuiz(quizId)

	if err := loader.Load(context.Background(), quiz); err == nil {
		t.Errorf("Failed to return error")
	}
	if describeTableCallCount != 1 {
		t.Errorf("Called DescribeTable %d times but expected 1", describeTableCallCount)
	}
	if createTableCallCount != 0 {
		t.Errorf("Called CreateTable %d times but expected 0", createTableCallCount)
	}
	if putItemCallCount != 1 {
		t.Errorf("Called PutItem %d times but expected 1", putItemCallCount)
	}
}

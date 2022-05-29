package config

import (
	"bytes"
	"fmt"
	"io"
	"os"
	"strconv"
	"testing"
	"github.com/google/go-cmp/cmp"
)

type testConfigRabbitMq struct {
	host *string
	port *int
	username *string
	password *string
	queueName *string
}

type testConfigRedis struct {
	host *string
	port *int
}

type testConfigQuestionSet struct {
	path *string
}

type testConfigDynamodb struct {
	region *string
	endpointUrl *string
	accessKeyId *string
	secretAccessKey *string
}

type testConfig struct {
	rabbitMq *testConfigRabbitMq
	redis *testConfigRedis
	questionSet *testConfigQuestionSet
	dynamodb *testConfigDynamodb
}

// Builds and returns a reader that reads from a config file-like source
func buildConfigReader(config testConfig) io.Reader {
	var buff bytes.Buffer

	if config.rabbitMq != nil {
		buff.WriteString("[rabbit-mq]\n")
		rmq := *config.rabbitMq
		if rmq.host != nil {buff.WriteString(fmt.Sprintf("host = %s\n", *rmq.host))}
		if rmq.port != nil {buff.WriteString(fmt.Sprintf("port = %d\n", *rmq.port))}
		if rmq.username != nil {buff.WriteString(fmt.Sprintf("username = %s\n", *rmq.username))}
		if rmq.password != nil {buff.WriteString(fmt.Sprintf("password = %s\n", *rmq.password))}
		if rmq.queueName != nil {buff.WriteString(fmt.Sprintf("queue_name = %s\n", *rmq.queueName))}
	}

	if config.redis != nil {
		buff.WriteString("\n[redis]\n")
		r := *config.redis
		if r.host != nil {buff.WriteString(fmt.Sprintf("host = %s\n", *r.host))}
		if r.port != nil {buff.WriteString(fmt.Sprintf("port = %d\n", *r.port))}
	}

	if config.questionSet != nil {
		buff.WriteString("\n[question-set]\n")
		qs := *config.questionSet
		if qs.path != nil {buff.WriteString(fmt.Sprintf("path = %s\n", *qs.path))}
	}

	if config.dynamodb != nil {
		buff.WriteString("\n[dynamodb]\n")
		d := *config.dynamodb
		if d.region != nil {buff.WriteString(fmt.Sprintf("region = %s\n", *d.region))}
		if d.endpointUrl != nil {buff.WriteString(fmt.Sprintf("endpoint_url = %s\n", *d.endpointUrl))}
		if d.accessKeyId != nil {buff.WriteString(fmt.Sprintf("access_key_id = %s\n", *d.accessKeyId))}
		if d.secretAccessKey != nil {buff.WriteString(fmt.Sprintf("secret_access_key = %s\n", *d.secretAccessKey))}
	}

	return bytes.NewReader(buff.Bytes())
}

// Sets environment varibles from `config` and returns a cleanup function
// to unset them at the end of the test.
func setEnvVarsFromConfig(config testConfig) (cleanup func()) {

	envVarsToClear := make([]string, 0)

	if config.rabbitMq != nil {
		rmq := *config.rabbitMq
		if rmq.host != nil {
			envVar := "RABBITMQ_HOST"
			os.Setenv(envVar, *rmq.host)
			envVarsToClear = append(envVarsToClear, envVar)
		}
		if rmq.port != nil {
			envVar := "RABBITMQ_PORT"
			os.Setenv(envVar, strconv.Itoa(*rmq.port))
			envVarsToClear = append(envVarsToClear, envVar)
		}
		if rmq.username != nil {
			envVar := "RABBITMQ_USERNAME"
			os.Setenv(envVar, *rmq.username)
			envVarsToClear = append(envVarsToClear, envVar)
		}
		if rmq.password != nil {
			envVar := "RABBITMQ_PASSWORD"
			os.Setenv(envVar, *rmq.password)
			envVarsToClear = append(envVarsToClear, envVar)
		}
		if rmq.queueName != nil {
			envVar := "RABBITMQ_QUEUE_NAME"
			os.Setenv(envVar, *rmq.queueName)
			envVarsToClear = append(envVarsToClear, envVar)
		}
	}

	if config.redis != nil {
		r := *config.redis
		if r.host != nil {
			envVar := "REDIS_HOST"
			os.Setenv(envVar, *r.host)
			envVarsToClear = append(envVarsToClear, envVar)
		}
		if r.port != nil {
			envVar := "REDIS_PORT"
			os.Setenv(envVar, strconv.Itoa(*r.port))
			envVarsToClear = append(envVarsToClear, envVar)
		}
	}

	if config.questionSet != nil {
		qs := *config.questionSet
		if qs.path != nil {
			envVar := "QUESTION_SET_PATH"
			os.Setenv(envVar, *qs.path)
			envVarsToClear = append(envVarsToClear, envVar)
		}
	}

	if config.dynamodb != nil {
		d := *config.dynamodb
		if d.region != nil {
			envVar := "DYNAMODB_REGION"
			os.Setenv(envVar, *d.region)
			envVarsToClear = append(envVarsToClear, envVar)
		}
		if d.endpointUrl != nil {
			envVar := "DYNAMODB_ENDPOINT_URL"
			os.Setenv(envVar, *d.endpointUrl)
			envVarsToClear = append(envVarsToClear, envVar)
		}
		if d.accessKeyId != nil {
			envVar := "DYNAMODB_ACCESS_KEY_ID"
			os.Setenv(envVar, *d.accessKeyId)
			envVarsToClear = append(envVarsToClear, envVar)
		}
		if d.secretAccessKey != nil {
			envVar := "DYNAMODB_SECRET_ACCESS_KEY"
			os.Setenv(envVar, *d.secretAccessKey)
			envVarsToClear = append(envVarsToClear, envVar)
		}
	}

	cleanup = func() {
		for _, envVar := range envVarsToClear {
			os.Unsetenv(envVar)
		}
	}
	return
}

// Tests loading from config where all fields are overriden by env vars
func TestLoadFromReader_env_vars_override(t *testing.T) {
	// Expected values
	rmq_host := "rmq.envvar.localhost"
	rmq_port := 7672
	rmq_username := "admin"
	rmq_password := "passwd"
	rmq_queue_name := "quiz-complete"
	redis_host := "redis.envvar.localhost"
	redis_port := 7379
	qs_path := "/envvar/question-sets/"
	db_region := "us-east-1"
	db_endpoint_url := "http://db.envvar.localhost:8000"
	db_access_key_id := "envvardynamodblocalkeyid"
	db_secret_access_key := "envvardynamodblocaltest"

	// Setup
	cleanupEnvVars := setEnvVarsFromConfig(testConfig{
		rabbitMq: &testConfigRabbitMq{
			host: &rmq_host,
			port: &rmq_port,
			username: &rmq_username,
			password: &rmq_password,
			queueName: &rmq_queue_name,
		},
		redis: &testConfigRedis{
			host: &redis_host,
			port: &redis_port,
		},
		questionSet: &testConfigQuestionSet{
			path: &qs_path,
		},
		dynamodb: &testConfigDynamodb{
			region: &db_region,
			endpointUrl: &db_endpoint_url,
			accessKeyId: &db_access_key_id,
			secretAccessKey: &db_secret_access_key,
		},
	})
	defer cleanupEnvVars() // Cleanup

	reader_rmq_host := "rmq.reader.localhost"
	reader_rmq_port := 6672
	reader_rmq_username := "readeradmin"
	reader_rmq_password := "readerpasswd"
	reader_rmq_queue_name := "reader-quiz-complete"
	reader_redis_host := "redis.reader.localhost"
	reader_redis_port := 6379
	reader_qs_path := "/reader/question-sets/"
	reader_db_region := "us-east-2"
	reader_db_endpoint_url := "http://db.reader.localhost:8000"
	reader_db_access_key_id := "readerdynamodblocalkeyid"
	reader_db_secret_access_key := "readerdynamodblocaltest"
	reader := buildConfigReader(testConfig{
		rabbitMq: &testConfigRabbitMq{
			host: &reader_rmq_host,
			port: &reader_rmq_port,
			username: &reader_rmq_username,
			password: &reader_rmq_password,
			queueName: &reader_rmq_queue_name,
		},
		redis: &testConfigRedis{
			host: &reader_redis_host,
			port: &reader_redis_port,
		},
		questionSet: &testConfigQuestionSet{
			path: &reader_qs_path,
		},
		dynamodb: &testConfigDynamodb{
			region: &reader_db_region,
			endpointUrl: &reader_db_endpoint_url,
			accessKeyId: &reader_db_access_key_id,
			secretAccessKey: &reader_db_secret_access_key,
		},
	})

	// Act
	got, err := loadFromReader(reader)
	if err != nil {
		t.Fatalf("Failed to load config with: %v", err)
	}

	// Assert
	want := Config{
		RabbitMQ: struct{Host string; Port int; Username string; Password string; QueueName string}{
			Host: rmq_host,
			Port: rmq_port,
			Username: rmq_username,
			Password: rmq_password,
			QueueName: rmq_queue_name,
		},
		Redis: struct{Host string; Port int}{
			Host: redis_host,
			Port: redis_port,
		},
		QuestionSet: struct{Path string}{
			Path: qs_path,
		},
		DynamoDB: struct{Region string; EndpointUrl string; AccessKeyID string; SecretAccessKey string}{
			Region: db_region,
			EndpointUrl: db_endpoint_url,
			AccessKeyID: db_access_key_id,
			SecretAccessKey: db_secret_access_key,
		},
	}
	if diff := cmp.Diff(want, got); diff != "" {
		t.Fatal("Wrong config loaded: ", diff)
	}
}

// Tests loading from config where there are no env vars set
func TestLoadFromReader_no_env_vars(t *testing.T) {
	// Expected values
	rmq_host := "rmq.envvar.localhost"
	rmq_port := 7672
	rmq_username := "admin"
	rmq_password := "passwd"
	rmq_queue_name := "quiz-complete"
	redis_host := "redis.envvar.localhost"
	redis_port := 7379
	qs_path := "/envvar/question-sets/"
	db_region := "us-east-1"
	db_endpoint_url := "http://db.envvar.localhost:8000"
	db_access_key_id := "envvardynamodblocalkeyid"
	db_secret_access_key := "envvardynamodblocaltest"

	// Setup
	reader := buildConfigReader(testConfig{
		rabbitMq: &testConfigRabbitMq{
			host: &rmq_host,
			port: &rmq_port,
			username: &rmq_username,
			password: &rmq_password,
			queueName: &rmq_queue_name,
		},
		redis: &testConfigRedis{
			host: &redis_host,
			port: &redis_port,
		},
		questionSet: &testConfigQuestionSet{
			path: &qs_path,
		},
		dynamodb: &testConfigDynamodb{
			region: &db_region,
			endpointUrl: &db_endpoint_url,
			accessKeyId: &db_access_key_id,
			secretAccessKey: &db_secret_access_key,
		},
	})

	// Act
	got, err := loadFromReader(reader)
	if err != nil {
		t.Fatalf("Failed to load config with: %v", err)
	}

	// Assert
	want := Config{
		RabbitMQ: struct{Host string; Port int; Username string; Password string; QueueName string}{
			Host: rmq_host,
			Port: rmq_port,
			Username: rmq_username,
			Password: rmq_password,
			QueueName: rmq_queue_name,
		},
		Redis: struct{Host string; Port int}{
			Host: redis_host,
			Port: redis_port,
		},
		QuestionSet: struct{Path string}{
			Path: qs_path,
		},
		DynamoDB: struct{Region string; EndpointUrl string; AccessKeyID string; SecretAccessKey string}{
			Region: db_region,
			EndpointUrl: db_endpoint_url,
			AccessKeyID: db_access_key_id,
			SecretAccessKey: db_secret_access_key,
		},
	}
	if diff := cmp.Diff(want, got); diff != "" {
		t.Fatal("Wrong config loaded: ", diff)
	}
}

// Tests loading where required keys are absent
func TestLoadFromReader_absent_required_keys(t *testing.T) {
	// Expected values
	rmq_host := "rmq.envvar.localhost"
	rmq_port := 7672
	rmq_username := "admin"
	rmq_password := "passwd"
	rmq_queue_name := "quiz-complete"
	redis_host := "redis.envvar.localhost"
	redis_port := 7379
	qs_path := "/envvar/question-sets/"
	db_region := "us-east-1"
	db_endpoint_url := "http://db.envvar.localhost:8000"
	db_access_key_id := "envvardynamodblocalkeyid"
	db_secret_access_key := "envvardynamodblocaltest"

	completeRabbitMq := &testConfigRabbitMq{&rmq_host, &rmq_port, &rmq_username, &rmq_password, &rmq_queue_name}
	completeRedis := &testConfigRedis{&redis_host, &redis_port}
	completeQuestionSet := &testConfigQuestionSet{&qs_path}
	completeDynamodb := &testConfigDynamodb{&db_region, &db_endpoint_url, &db_access_key_id, &db_secret_access_key}


	tests := map[string]testConfig{
		"rabbit-mq.host": {rabbitMq: &testConfigRabbitMq{nil, &rmq_port, &rmq_username, &rmq_password, &rmq_queue_name}, redis: completeRedis, questionSet: completeQuestionSet, dynamodb: completeDynamodb},
		"rabbit-mq.port": {rabbitMq: &testConfigRabbitMq{&rmq_host, nil, &rmq_username, &rmq_password, &rmq_queue_name}, redis: completeRedis, questionSet: completeQuestionSet, dynamodb: completeDynamodb},
		"rabbit-mq.username": {rabbitMq: &testConfigRabbitMq{&rmq_host, &rmq_port, nil, &rmq_password, &rmq_queue_name}, redis: completeRedis, questionSet: completeQuestionSet, dynamodb: completeDynamodb},
		"rabbit-mq.password": {rabbitMq: &testConfigRabbitMq{&rmq_host, &rmq_port, &rmq_username, nil, &rmq_queue_name}, redis: completeRedis, questionSet: completeQuestionSet, dynamodb: completeDynamodb},
		"rabbit-mq.queue_name": {rabbitMq: &testConfigRabbitMq{&rmq_host, &rmq_port, &rmq_username, &rmq_queue_name, nil}, redis: completeRedis, questionSet: completeQuestionSet, dynamodb: completeDynamodb},
		"redis.host": {rabbitMq: completeRabbitMq, redis: &testConfigRedis{nil, &redis_port}, questionSet: completeQuestionSet, dynamodb: completeDynamodb},
		"redis.port": {rabbitMq: completeRabbitMq, redis: &testConfigRedis{&redis_host, nil}, questionSet: completeQuestionSet, dynamodb: completeDynamodb},
		"question-set.path": {rabbitMq: completeRabbitMq, redis: completeRedis, questionSet: &testConfigQuestionSet{nil}, dynamodb: completeDynamodb},
		"dynamodb.region": {rabbitMq: completeRabbitMq, redis: completeRedis, questionSet: completeQuestionSet, dynamodb: &testConfigDynamodb{nil, &db_endpoint_url, &db_access_key_id, &db_secret_access_key}},
		"dynamodb.endpoint_url": {rabbitMq: completeRabbitMq, redis: completeRedis, questionSet: completeQuestionSet, dynamodb: &testConfigDynamodb{&db_region, nil, &db_access_key_id, &db_secret_access_key}},
		"dynamodb.access_key_id": {rabbitMq: completeRabbitMq, redis: completeRedis, questionSet: completeQuestionSet, dynamodb: &testConfigDynamodb{&db_region, &db_endpoint_url, nil, &db_secret_access_key}},
		"dynamodb.secret_access_key": {rabbitMq: completeRabbitMq, redis: completeRedis, questionSet: completeQuestionSet, dynamodb: &testConfigDynamodb{&db_region, &db_endpoint_url, &db_access_key_id, nil}},
	}

	for missingKey, config := range tests {
		t.Run(fmt.Sprintf("no %s", missingKey), func(t *testing.T) {
			// Setup
			reader := buildConfigReader(config)
			
			// Act
			_, got := loadFromReader(reader)
			
			// Assert
			if got == nil {
				t.Errorf("Failed to detect error")
			}

			want := (&missingConfigError{key: missingKey}).Error()
			if diff := cmp.Diff(want, got.Error()); diff != "" {
				t.Error("Wrong error received", diff)
			}
		})
	}
}

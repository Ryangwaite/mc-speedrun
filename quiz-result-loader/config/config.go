package config

import (
	"fmt"
	"io"
	"os"

	"github.com/spf13/viper"
)

type Config struct {
	RabbitMQ struct {
		Host string
		Port int
		Username string
		Password string
		QueueName string
	}
	Redis struct {
		Host string
		Port int
	}
	QuestionSet struct {
		Path string
	}
	DynamoDB struct {
		Region				string
		EndpointUrl			string
		AccessKeyID			string
		SecretAccessKey		string
	}
}

type missing string

type missingConfigError struct {
	key string
}

func (e *missingConfigError) Error() string {
	return fmt.Sprintf("config item '%s' was not set", e.key)
}

// Loads the config from the path specified and applys any overrides
// from environment variables. Missing settings return an error
func Load(path string) (Config, error) {
	file, err := os.Open(path)
	if err != nil {
		return Config{}, fmt.Errorf("failed to open config file '%s': %v", path, err)
	}
	return loadFromReader(file)
}

func loadFromReader(reader io.Reader) (Config, error) {
	viper.SetConfigType("ini")

	// Pair up env vars with the fields in config
	viper.BindEnv("rabbit-mq.host", "RABBITMQ_HOST")
	viper.BindEnv("rabbit-mq.port", "RABBITMQ_PORT")
	viper.BindEnv("rabbit-mq.username", "RABBITMQ_USERNAME")
	viper.BindEnv("rabbit-mq.password", "RABBITMQ_PASSWORD")
	viper.BindEnv("rabbit-mq.queue_name", "RABBITMQ_QUEUE_NAME")
	viper.BindEnv("redis.host", "REDIS_HOST")
	viper.BindEnv("redis.port", "REDIS_PORT")
	viper.BindEnv("question-set.path", "QUESTION_SET_PATH")
	viper.BindEnv("dynamodb.region", "DYNAMODB_REGION")
	viper.BindEnv("dynamodb.endpoint_url", "DYNAMODB_ENDPOINT_URL")
	viper.BindEnv("dynamodb.access_key_id", "DYNAMODB_ACCESS_KEY_ID")
	viper.BindEnv("dynamodb.secret_access_key", "DYNAMODB_SECRET_ACCESS_KEY")

	// Set all fields to be required
	var missingFlag missing
	viper.SetDefault("rabbit-mq.host", missingFlag)
	viper.SetDefault("rabbit-mq.port", missingFlag)
	viper.SetDefault("rabbit-mq.username", missingFlag)
	viper.SetDefault("rabbit-mq.password", missingFlag)
	viper.SetDefault("rabbit-mq.queue_name", missingFlag)
	viper.SetDefault("redis.host", missingFlag)
	viper.SetDefault("redis.port", missingFlag)
	viper.SetDefault("question-set.path", missingFlag)
	viper.SetDefault("dynamodb.region", missingFlag)
	viper.SetDefault("dynamodb.endpoint_url", missingFlag)
	viper.SetDefault("dynamodb.access_key_id", missingFlag)
	viper.SetDefault("dynamodb.secret_access_key", missingFlag)

	loadedConfig := Config{}
	
	if err := viper.ReadConfig(reader); err != nil {
		return loadedConfig, err
	}

	// Validate that there were no missing required keys
	keys := []string {
		"rabbit-mq.host","rabbit-mq.port","rabbit-mq.username",
		"rabbit-mq.password","rabbit-mq.queue_name",
		"redis.host", "redis.port",
		"question-set.path",
		"dynamodb.region", "dynamodb.endpoint_url",
		"dynamodb.access_key_id", "dynamodb.secret_access_key",
	}
	for _, key := range keys {
		if _, ok := viper.Get(key).(missing); ok {
			return loadedConfig, &missingConfigError{key}
		}
	}

	// Everythings present and been validated - pull it out
	loadedConfig.RabbitMQ.Host = viper.GetString("rabbit-mq.host")
	loadedConfig.RabbitMQ.Port = viper.GetInt("rabbit-mq.port")
	loadedConfig.RabbitMQ.Username = viper.GetString("rabbit-mq.username")
	loadedConfig.RabbitMQ.Password = viper.GetString("rabbit-mq.password")
	loadedConfig.RabbitMQ.QueueName = viper.GetString("rabbit-mq.queue_name")
	loadedConfig.Redis.Host = viper.GetString("redis.host")
	loadedConfig.Redis.Port = viper.GetInt("redis.port")
	loadedConfig.QuestionSet.Path = viper.GetString("question-set.path")
	loadedConfig.DynamoDB.Region = viper.GetString("dynamodb.region")
	loadedConfig.DynamoDB.EndpointUrl = viper.GetString("dynamodb.endpoint_url")
	loadedConfig.DynamoDB.AccessKeyID = viper.GetString("dynamodb.access_key_id")
	loadedConfig.DynamoDB.SecretAccessKey = viper.GetString("dynamodb.secret_access_key")

	// TODO: Validate these settings
	
	return loadedConfig, nil
}

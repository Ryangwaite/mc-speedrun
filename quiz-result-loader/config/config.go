package config

import (
	"fmt"

	"github.com/spf13/viper"
)

type Config struct {
	Redis struct {
		Host string
		Port int
		// TODO: Add subscription key in here
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
	viper.SetConfigFile(path)

	// Pair up env vars with the fields in config
	viper.BindEnv("redis.host", "REDIS_HOST")
	viper.BindEnv("redis.port", "REDIS_PORT")
	viper.BindEnv("question-set.path", "QUESTION_SET_PATH")
	viper.BindEnv("dynamodb.region", "DYNAMODB_REGION")
	viper.BindEnv("dynamodb.endpoint_url", "DYNAMODB_ENDPOINT_URL")
	viper.BindEnv("dynamodb.access_key_id", "DYNAMODB_ACCESS_KEY_ID")
	viper.BindEnv("dynamodb.secret_access_key", "DYNAMODB_SECRET_ACCESS_KEY")

	// Set all fields to be required
	var missingFlag missing
	viper.SetDefault("redis.host", missingFlag)
	viper.SetDefault("redis.port", missingFlag)
	viper.SetDefault("question-set.path", missingFlag)
	viper.SetDefault("dynamodb.region", missingFlag)
	viper.SetDefault("dynamodb.endpoint_url", missingFlag)
	viper.SetDefault("dynamodb.access_key_id", missingFlag)
	viper.SetDefault("dynamodb.secret_access_key", missingFlag)

	loadedConfig := Config{}
	
	if err := viper.ReadInConfig(); err != nil {
		return loadedConfig, err
	}

	// Validate that there were no missing required keys
	keys := []string {
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

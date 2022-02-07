package config

import (
	"fmt"

	"github.com/spf13/viper"
)

type Config struct {
	Server struct {
		Port int
		Development bool
	}
	Jwt struct {
		Secret	string
		Issuer	string
		Audience string
	}
	Loader struct {
		DestinationDirectory string
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
	viper.BindEnv("server.port", "PORT")
	viper.BindEnv("server.development", "DEVELOPMENT_MODE")
	viper.BindEnv("jwt.secret", "JWT_SECRET")
	viper.BindEnv("jwt.issuer", "JWT_ISSUER")
	viper.BindEnv("jwt.audience", "JWT_AUDIENCE")
	viper.BindEnv("loader.destination_directory", "LOADER_DST_DIR")

	// Set add fields to be required
	var missingFlag missing
	viper.SetDefault("server.port", missingFlag)
	viper.SetDefault("server.development", missingFlag)
	viper.SetDefault("jwt.secret", missingFlag)
	viper.SetDefault("jwt.issuer", missingFlag)
	viper.SetDefault("jwt.audience", missingFlag)
	viper.SetDefault("loader.destination_directory", missingFlag)

	loadedConfig := Config{}
	
	if err := viper.ReadInConfig(); err != nil {
		return loadedConfig, err
	}

	// Validate that there were no missing required keys
	keys := []string {
		"server.port", "server.development",
		"jwt.secret", "jwt.issuer", "jwt.audience",
		"loader.destination_directory",
	}
	for _, key := range keys {
		if _, ok := viper.Get(key).(missing); ok {
			return loadedConfig, &missingConfigError{key}
		}
	}

	// Everythings present and been validated - pull it out
	loadedConfig.Server.Port					= viper.GetInt("server.port")
	loadedConfig.Server.Development				= viper.GetBool("server.development")
	loadedConfig.Jwt.Secret						= viper.GetString("jwt.secret")
	loadedConfig.Jwt.Issuer						= viper.GetString("jwt.issuer")
	loadedConfig.Jwt.Audience					= viper.GetString("jwt.audience")
	loadedConfig.Loader.DestinationDirectory 	= viper.GetString("loader.destination_directory")
	
	return loadedConfig, nil
}

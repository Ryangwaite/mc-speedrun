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

type testConfigServer struct {
	port *int
	development *bool
}

type testConfigJwt struct {
	secret *string
	issuer *string
	audience *string
}

type testConfigLoader struct {
	destinationDirectory *string
}

type testConfig struct {
	server *testConfigServer
	jwt *testConfigJwt
	loader *testConfigLoader
}

// Builds and returns a reader that reads from a config file-like source
func buildConfigReader(config testConfig) io.Reader {
	var buff bytes.Buffer

	if config.server != nil {
		buff.WriteString("[server]\n")
		s := *config.server
		if s.port != nil {buff.WriteString(fmt.Sprintf("port = %d\n", *s.port))}
		if s.development != nil {buff.WriteString(fmt.Sprintf("development = %t\n", *s.development))}
	}

	if config.jwt != nil {
		buff.WriteString("\n[jwt]\n")
		j := *config.jwt
		if j.secret != nil {buff.WriteString(fmt.Sprintf("secret = %s\n", *j.secret))}
		if j.issuer != nil {buff.WriteString(fmt.Sprintf("issuer = %s\n", *j.issuer))}
		if j.audience != nil {buff.WriteString(fmt.Sprintf("audience = %s\n", *j.audience))}
	}

	if config.loader != nil {
		buff.WriteString("\n[loader]\n")
		l := *config.loader
		if l.destinationDirectory != nil {buff.WriteString(fmt.Sprintf("destination_directory = %s\n", *l.destinationDirectory))}
	}

	return bytes.NewReader(buff.Bytes())
}

// Sets environment varibles from `config` and returns a cleanup function
// to unset them at the end of the test.
func setEnvVarsFromConfig(config testConfig) (cleanup func()) {

	envVarsToClear := make([]string, 0)

	if config.server != nil {
		s := *config.server
		if s.port != nil {
			envVar := "PORT"
			os.Setenv(envVar, strconv.Itoa(*s.port))
			envVarsToClear = append(envVarsToClear, envVar)
		}
		if s.development != nil {
			envVar := "DEVELOPMENT_MODE"
			os.Setenv(envVar, strconv.FormatBool(*s.development))
			envVarsToClear = append(envVarsToClear, envVar)
		}
	}

	if config.jwt != nil {
		j := *config.jwt
		if j.secret != nil {
			envVar := "JWT_SECRET"
			os.Setenv(envVar, *j.secret)
			envVarsToClear = append(envVarsToClear, envVar)
		}
		if j.issuer != nil {
			envVar := "JWT_ISSUER"
			os.Setenv(envVar, *j.issuer)
			envVarsToClear = append(envVarsToClear, envVar)
		}
		if j.audience != nil {
			envVar := "JWT_AUDIENCE"
			os.Setenv(envVar, *j.audience)
			envVarsToClear = append(envVarsToClear, envVar)
		}
	}

	if config.loader != nil {
		l := *config.loader
		if l.destinationDirectory != nil {
			envVar := "LOADER_DST_DIR"
			os.Setenv(envVar, *l.destinationDirectory)
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
	serverPort := 9000
	serverDevelopment := true
	jwtSecret := "secret from environment vars"
	jwtIssuer := "issuer from environment vars"
	jwtAudience := "audience from environment vars"
	loaderDestinationDirectory := "/loader/dstdir/from/env"

	// Setup
	cleanupEnvVars := setEnvVarsFromConfig(testConfig{
		server: &testConfigServer{
			port: &serverPort,
			development: &serverDevelopment,
		},
		jwt: &testConfigJwt{
			secret: &jwtSecret,
			issuer: &jwtIssuer,
			audience: &jwtAudience,
		},
		loader: &testConfigLoader{
			destinationDirectory: &loaderDestinationDirectory,
		},
	})
	defer cleanupEnvVars() // Cleanup

	readerPort := 10000
	readerDevelopment := false
	readerSecret := "secret from reader"
	readerIssuer := "issuer from reader"
	readerAudience := "audience from reader"
	readerDestinationDirectory := "/loader/dstdir/from/reader"
	reader := buildConfigReader(testConfig{
		server: &testConfigServer{
			port: &readerPort,
			development: &readerDevelopment,
		},
		jwt: &testConfigJwt{
			secret: &readerSecret,
			issuer: &readerIssuer,
			audience: &readerAudience,
		},
		loader: &testConfigLoader{
			destinationDirectory: &readerDestinationDirectory,
		},
	})

	// Act
	got, err := loadFromReader(reader)
	if err != nil {
		t.Fatalf("Failed to load config with: %v", err)
	}

	// Assert
	want := Config{
		Server: struct{Port int; Development bool}{
			Port: serverPort,
			Development: serverDevelopment,
		},
		Jwt: struct{Secret string; Issuer string; Audience string}{
			Secret: jwtSecret,
			Issuer: jwtIssuer,
			Audience: jwtAudience,
		},
		Loader: struct{DestinationDirectory string}{
			DestinationDirectory: loaderDestinationDirectory,
		},
	}
	if diff := cmp.Diff(want, got); diff != "" {
		t.Fatal("Wrong config loaded: ", diff)
	}
}

// Tests loading from config where there are no env vars set
func TestLoadFromReader_no_env_vars(t *testing.T) {
	// Expected values
	serverPort := 9000
	serverDevelopment := true
	jwtSecret := "secret from environment vars"
	jwtIssuer := "issuer from environment vars"
	jwtAudience := "audience from environment vars"
	loaderDestinationDirectory := "/loader/dstdir/from/env"

	// Setup
	reader := buildConfigReader(testConfig{
		server: &testConfigServer{
			port: &serverPort,
			development: &serverDevelopment,
		},
		jwt: &testConfigJwt{
			secret: &jwtSecret,
			issuer: &jwtIssuer,
			audience: &jwtAudience,
		},
		loader: &testConfigLoader{
			destinationDirectory: &loaderDestinationDirectory,
		},
	})

	// Act
	got, err := loadFromReader(reader)
	if err != nil {
		t.Fatalf("Failed to load config with: %v", err)
	}

	// Assert
	want := Config{
		Server: struct{Port int; Development bool}{
			Port: serverPort,
			Development: serverDevelopment,
		},
		Jwt: struct{Secret string; Issuer string; Audience string}{
			Secret: jwtSecret,
			Issuer: jwtIssuer,
			Audience: jwtAudience,
		},
		Loader: struct{DestinationDirectory string}{
			DestinationDirectory: loaderDestinationDirectory,
		},
	}
	if diff := cmp.Diff(want, got); diff != "" {
		t.Fatal("Wrong config loaded: ", diff)
	}
}

// Tests loading where required keys are absent
func TestLoadFromReader_absent_required_keys(t *testing.T) {
	// Expected values
	serverPort := 9000
	serverDevelopment := true
	jwtSecret := "secret from environment vars"
	jwtIssuer := "issuer from environment vars"
	jwtAudience := "audience from environment vars"
	loaderDestinationDirectory := "/loader/dstdir/from/env"

	completeServer := &testConfigServer{&serverPort, &serverDevelopment}
	completeJwt := &testConfigJwt{&jwtSecret, &jwtIssuer, &jwtAudience}
	completeLoader := &testConfigLoader{&loaderDestinationDirectory}

	tests := map[string]testConfig{
		"server.port": {server: &testConfigServer{development: &serverDevelopment}, jwt: completeJwt, loader: completeLoader},
		"server.development": {server: &testConfigServer{port: &serverPort}, jwt: completeJwt, loader: completeLoader},
		"jwt.secret": {server: completeServer, jwt: &testConfigJwt{issuer: &jwtIssuer, audience: &jwtAudience}, loader: completeLoader},
		"jwt.issuer": {server: completeServer, jwt: &testConfigJwt{secret: &jwtSecret, audience: &jwtAudience}, loader: completeLoader},
		"jwt.audience": {server: completeServer, jwt: &testConfigJwt{secret: &jwtSecret, issuer: &jwtIssuer}, loader: completeLoader},
		"loader.destination_directory": {server: completeServer, jwt: completeJwt, loader: &testConfigLoader{}},
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

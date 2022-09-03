package main

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"os"

	"github.com/Ryangwaite/mc-speedrun/question-set-loader/adapter"
	"github.com/Ryangwaite/mc-speedrun/question-set-loader/auth"
	"github.com/Ryangwaite/mc-speedrun/question-set-loader/handler"
	"github.com/Ryangwaite/mc-speedrun/question-set-loader/logfmt"
	"github.com/Ryangwaite/mc-speedrun/question-set-loader/quiz"
	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	log "github.com/sirupsen/logrus"
)

type lambdaConfig struct {
	quizFileDirectory string
	jwt auth.JwtParams

}

const ENV_VAR_PREFIX = "MC_SPEEDRUN_"

// Loads the lambda config from the environment variables
func loadLambdaConfig() (lambdaConfig, error) {
	config := lambdaConfig{}

	loaderDstDirKey := ENV_VAR_PREFIX + "LOADER_DST_DIR"
	if config.quizFileDirectory = os.Getenv(loaderDstDirKey); config.quizFileDirectory == "" {
		return config, fmt.Errorf("required env var '%s' was missing", loaderDstDirKey) // TODO: Use custom error type
	}

	// NOTE: This is an unsecure way of doing this. Ideally these should be ARNS's to
	// secrets in AWS secrets manager which the lambda should query at runtime using it's
	// execution role that has permissions to read from secrets manager.
	jwtSecretKey := ENV_VAR_PREFIX + "JWT_SECRET"
	if config.jwt.Secret = os.Getenv(jwtSecretKey); config.jwt.Secret == "" {
		return config, fmt.Errorf("required env var '%s' was missing", jwtSecretKey)
	}
	jwtAudienceKey := ENV_VAR_PREFIX + "JWT_AUDIENCE"
	if config.jwt.Audience = os.Getenv(jwtAudienceKey); config.jwt.Audience == "" {
		return config, fmt.Errorf("required env var '%s' was missing", jwtAudienceKey)
	}
	jwtIssuerKey := ENV_VAR_PREFIX + "JWT_ISSUER"
	if config.jwt.Issuer = os.Getenv(jwtIssuerKey); config.jwt.Issuer == "" {
		return config, fmt.Errorf("required env var '%s' was missing", jwtIssuerKey)
	}

	return config, nil
}

// Builds an error response for returning in the lambda response.
func buildErrorResponse(statusCode int, errMsg string) events.ALBTargetGroupResponse {
	return events.ALBTargetGroupResponse{
		StatusCode: statusCode,
		Headers: map[string]string{
			"Content-Type": "text/plain",
		},
		Body: errMsg,
		IsBase64Encoded: false,
	}
}

func HandleRequest(ctx context.Context, event events.ALBTargetGroupRequest) (events.ALBTargetGroupResponse, error) {

	logger := log.New()
	logger.SetLevel(log.InfoLevel)
	logger.SetOutput(os.Stdout)
	logger.SetFormatter(logfmt.NewUtcLogFormatter())

	jsonEvent, _ := json.Marshal(event)
	logger.Debugf("Event as json: %s", string(jsonEvent))

	config, err := loadLambdaConfig()
	if err != nil {
		return buildErrorResponse(http.StatusInternalServerError, fmt.Sprintf("Couldn't load config. Error: %s", err.Error())), nil
	}
	logger.Debugf("Loaded config: %+v", config)

	// Adapt the lambda event to an http.Request
	httpRequest, err := adapter.ALBTargetGroupRequestEventToHttpRequest(&event)
	if err != nil {
		return buildErrorResponse(http.StatusInternalServerError, fmt.Sprintf("Couldn't adapt ALB request to http request. Error: %s", err.Error())), nil
	}
	logger.Debugf("Adapted ALBTargetGroupRequest: %+v\nTo http.Request: %+v", event, httpRequest)

	httpResponseWriter := adapter.NewHttpResponseWriterToALBTargetGroupResponse()

	upload := handler.Upload {
		DevelopmentMode: false,
		QuizWriter: quiz.QuizJsonFileWriter{SaveDirectory: config.quizFileDirectory},
		JwtParams: config.jwt,
		Logger: logger,
	}

	// Process the request
	upload.Quiz(&httpResponseWriter, httpRequest)

	// Adapt the http.ResponseWriter to ALBTargetGroupResponse
	albTargetGroupResponse, err := httpResponseWriter.AsALBTargetGroupResponse()
	if err != nil {
		return buildErrorResponse(http.StatusInternalServerError, fmt.Sprintf("Couldn't adapt http.ResponseWriter to ALBTargetGroupResponse. Error: %s", err.Error())), fmt.Errorf("why doint i see this????")
	}

	return albTargetGroupResponse, nil
}

func main() {
	lambda.Start(HandleRequest)
}

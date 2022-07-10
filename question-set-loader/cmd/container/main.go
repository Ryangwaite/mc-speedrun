package main

import (
	"fmt"
	"net/http"
	"os"

	"github.com/Ryangwaite/mc-speedrun/question-set-loader/config"
	"github.com/Ryangwaite/mc-speedrun/question-set-loader/handler"
	"github.com/Ryangwaite/mc-speedrun/question-set-loader/logfmt"
	"github.com/Ryangwaite/mc-speedrun/question-set-loader/quiz"
	log "github.com/sirupsen/logrus"
)

func main() {

	logger := log.New()
	logger.SetLevel(log.DebugLevel)
	logger.SetOutput(os.Stdout)
	logger.SetFormatter(logfmt.NewUtcLogFormatter())

	config, err := config.Load("./config.ini")
	if err != nil {
		logger.Panic("Failed to load config. Error: " + err.Error())
	}

	// NOTE: Probably should mask out sensitive config
	logger.Info("Loaded config: " + fmt.Sprintf("%#v", config))

	upload := handler.Upload {
		DevelopmentMode: config.Server.Development,
		QuizWriter: quiz.QuizJsonFileWriter{SaveDirectory: config.Loader.DestinationDirectory},
		JwtParams: config.Jwt,
		Logger: logger,
	}

	http.HandleFunc("/upload/quiz", handler.LoggerMiddleware(logger, upload.Quiz))

	port := config.Server.Port
	logger.Info(fmt.Sprintf("Listening on port %d", port))
	err = http.ListenAndServe(fmt.Sprintf(":%d", port), nil)
	if err != nil {
		logger.Panic(fmt.Sprintf("Failed to start server. Error: %s", err.Error()))
	}
}

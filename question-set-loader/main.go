package main

import (
	"fmt"
	"net/http"
	"os"

	"github.com/Ryangwaite/mc-speedrun/question-set-loader/config"
	"github.com/Ryangwaite/mc-speedrun/question-set-loader/handler"
	"github.com/Ryangwaite/mc-speedrun/question-set-loader/logfmt"
	log "github.com/sirupsen/logrus"
)




func main() {

	log.SetLevel(log.DebugLevel)
	log.SetOutput(os.Stdout)
	log.SetFormatter(logfmt.NewUtcLogFormatter())

	config, err := config.Load("./config.ini")
	if err != nil {
		log.Panic("Failed to load config. Error: " + err.Error())
	}

	// NOTE: Probably should mask out sensitive config
	log.Info("Loaded config: " + fmt.Sprintf("%#v", config))

	upload := handler.Upload {
		SaveDirectory: config.Loader.DestinationDirectory,
		JwtParams: config.Jwt,
	}

	http.HandleFunc("/upload/quiz", handler.LoggerMiddleware(upload.Quiz))

	port := config.Server.Port
	log.Info(fmt.Sprintf("Listening on port %d", port))
	err = http.ListenAndServe(fmt.Sprintf(":%d", port), nil)
	if err != nil {
		log.Panic(fmt.Sprintf("Failed to start server. Error: %s", err.Error()))
	}
}

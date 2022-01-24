package main

import (
	"fmt"
	"net/http"
	"os"

	"github.com/Ryangwaite/mc-speedrun/question-set-loader/auth"
	"github.com/Ryangwaite/mc-speedrun/question-set-loader/handler"
	"github.com/Ryangwaite/mc-speedrun/question-set-loader/logfmt"
	log "github.com/sirupsen/logrus"
)




func main() {

	log.SetLevel(log.DebugLevel)
	log.SetOutput(os.Stdout)
	log.SetFormatter(logfmt.NewUtcLogFormatter())

	// TODO: Get these settings from config/envvars
	upload := handler.Upload {
		SaveDirectory: "/tmp/question-set-loader",
		JwtParams: auth.JwtParams {
			Secret: "dockercomposesecret",
			Issuer: "http://sign-on/",
			Audience: "http://0.0.0.0/",
		},
	}

	http.HandleFunc("/upload/quiz", handler.LoggerMiddleware(upload.Quiz))

	port := 8082
	log.Info(fmt.Sprintf("Listening on port %d", port))
	err := http.ListenAndServe(fmt.Sprintf(":%d", port), nil)
	if err != nil {
		log.Panic(fmt.Sprintf("Failed to start server. Error: %s", err.Error()))
	}
}

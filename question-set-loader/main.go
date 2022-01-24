package main

import (
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"

	"github.com/Ryangwaite/mc-speedrun/question-set-loader/auth"
	"github.com/Ryangwaite/mc-speedrun/question-set-loader/logfmt"
	"github.com/Ryangwaite/mc-speedrun/question-set-loader/quiz"
	log "github.com/sirupsen/logrus"
)

const MaxFileSize int64 = 10 * (1 << 20)

func FileUploadRoute(w http.ResponseWriter, r *http.Request) {
	authHeader := r.Header.Get("Authorization")
	if authHeader == "" {
		http.Error(w, "Absent 'Authorization' header", http.StatusUnauthorized)
		return
	}

	authHeaderParts := strings.Fields(authHeader)
	if len(authHeaderParts) != 2 || authHeaderParts[0] != "Bearer" {
		http.Error(w, fmt.Sprintf("Invalid 'Authorization' header value '%s'", authHeader), http.StatusUnauthorized)
		return
	}

	jwtToken := authHeaderParts[1]
	quizId, err := auth.ValidateJwt(jwtToken)
	if err != nil {
		http.Error(w, fmt.Sprintf("Invalid token '%s'", jwtToken), http.StatusUnauthorized)
		return
	}

	log.Info(fmt.Sprintf("Quiz id is '%s'", quizId))

	err = r.ParseMultipartForm(MaxFileSize) // set in memory limit equal to max file size
	if err != nil {
		http.Error(w, err.Error(), http.StatusUnsupportedMediaType)
		return
	}

	inFile, header, err := r.FormFile("file")
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	defer inFile.Close()

	if header.Size > MaxFileSize {
		http.Error(w, "File exceeds the 10MiB limit", http.StatusRequestEntityTooLarge)
		return
	}

	fileBytes := make([]byte, header.Size)
	if _, err := inFile.Read(fileBytes); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if _, err := quiz.IsQuizFileValid(&fileBytes); err != nil {
		http.Error(w, "Uploaded file is invalid", http.StatusBadRequest)
		return
	}
	
	// Save the file to disk
	outFile, err := os.OpenFile("/tmp/uploaded-quiz.json", os.O_WRONLY | os.O_CREATE, 0666)
	if err != nil {
		http.Error(w, "failed to open file for storing locally. Error: " + err.Error(), http.StatusInternalServerError)
		return
	}
	defer outFile.Close()

	// Set the pointer back to the start so that the following copy copies the entire contents
	if _, err := inFile.Seek(0, io.SeekStart); err != nil {
		http.Error(w, "failed to seek to the start of uploaded file: " + err.Error(), http.StatusInternalServerError)
		return
	}

	if _, err := io.Copy(outFile, inFile); err != nil {
		http.Error(w, "failed to store file locally. Error: " + err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
}


func main() {

	log.SetLevel(log.DebugLevel)
	log.SetOutput(os.Stdout)
	log.SetFormatter(logfmt.NewUtcLogFormatter())

	http.HandleFunc("/upload/quiz", FileUploadRoute)

	port := 8082
	log.Info(fmt.Sprintf("Listening on port %d", port))
	err := http.ListenAndServe(fmt.Sprintf(":%d", port), nil)
	if err != nil {
		log.Panic(fmt.Sprintf("Failed to start server. Error: %s", err.Error()))
	}
}

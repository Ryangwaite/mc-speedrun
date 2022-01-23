package main

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"

	"github.com/Ryangwaite/mc-speedrun/question-set-loader/logfmt"
	log "github.com/sirupsen/logrus"
)

// TODO: Add logging

const MaxFileSize int64 = 10 * (1 << 20)

type QuestionAndAnswers struct {
	Question	string		`json:"question"`
	Category	string		`json:"category"`
	Options		[]string	`json:"options"`
	Answers		[]int		`json:"answers"`
}

func IsQuizFileValid(fileBytes *[]byte) (isValid bool, err error) {

	var questionsAndAnswers []QuestionAndAnswers
	if err := json.Unmarshal(*fileBytes, &questionsAndAnswers); err != nil {
		return false, fmt.Errorf("failed to deserialize quiz file: Error: %s", err.Error())
	}

	// Successfully deserialized the file so its valid
	return true, nil

}

func FileUploadRoute(w http.ResponseWriter, r *http.Request) {

	err := r.ParseMultipartForm(MaxFileSize) // set in memory limit equal to max file size
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
	}

	if _, err := io.Copy(outFile, inFile); err != nil {
		http.Error(w, "failed to store file locally. Error: " + err.Error(), http.StatusInternalServerError)
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

package handler

import (
	"fmt"
	"net/http"
	"path/filepath"
	"strings"

	"github.com/Ryangwaite/mc-speedrun/question-set-loader/auth"
	"github.com/Ryangwaite/mc-speedrun/question-set-loader/quiz"
	log "github.com/sirupsen/logrus"
)

const MaxFileSize int64 = 10 * (1 << 20)

type Upload struct {
	SaveDirectory string
	auth.JwtParams
}

func (u *Upload) Quiz(w http.ResponseWriter, r *http.Request) {

	// Authentication

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
	quizId, err := auth.ValidateJwt(jwtToken, u.JwtParams)
	if err != nil {
		http.Error(w, fmt.Sprintf("Invalid token '%s'", jwtToken), http.StatusUnauthorized)
		return
	}

	log.Info(fmt.Sprintf("Received quiz upload for id '%s'", quizId))

	// Validate Payload

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

	qAndA, err := quiz.QuizFileFromBytes(&fileBytes)
	if err != nil {
		http.Error(w, "Uploaded file is invalid", http.StatusBadRequest)
		return
	}
	
	// Save the file to disk

	writePath := filepath.Join(u.SaveDirectory, quizId + ".json")
	if err := qAndA.WriteToDisk(writePath); err != nil {
		http.Error(w, "Failed to save file", http.StatusBadRequest)
		return
	}
	log.Info(fmt.Sprintf("Wrote quiz to '%s'", writePath))

	w.WriteHeader(http.StatusCreated)

}
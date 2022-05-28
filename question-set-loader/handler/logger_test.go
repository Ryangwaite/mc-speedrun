package handler

import (
	"bytes"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/google/go-cmp/cmp"
	log "github.com/sirupsen/logrus"
)

func NewMockHandler(statusCode int, responseBody string) func(w http.ResponseWriter, r *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		http.Error(w, responseBody, statusCode)
	}
}

type MockLogFormatter struct {}
func (f *MockLogFormatter) Format(entry *log.Entry) ([]byte, error) {
	return []byte(entry.Message), nil
}

type testConfig struct {
	StatusCode int
	ResponseBody string
	ExpectedLog string
}

func TestLoggerMiddleware_logs_response(t *testing.T) {

	tests := map[string]testConfig{
		"100 response": {100, "continue", ""},
		"200 response": {200, "ok", ""},
		"301 response": {301, "moved permanently", ""},
		"400 response": {400, "bad request", "bad request"},
		"410 response": {410, "gone", "gone"},
		"500 response": {500, "internal server error", "internal server error"},
		"599 response": {599, "network connect timeout error", "network connect timeout error"},
	}

	for label, config := range tests {
		t.Run(label, func(t *testing.T) {
			logBuffer := bytes.Buffer{}
			logger := log.New()
			logger.SetOutput(&logBuffer)
			logger.SetFormatter(&MockLogFormatter{})

			handler := LoggerMiddleware(logger, NewMockHandler(config.StatusCode, config.ResponseBody))

			req := httptest.NewRequest(http.MethodGet, "/mock/handler", nil)
			recorder := httptest.NewRecorder()

			handler(recorder, req)

			// Assert
			loggedResponse := strings.TrimSpace(logBuffer.String())
			if diff := cmp.Diff(loggedResponse, config.ExpectedLog); diff != "" {
				t.Errorf("Unexpected error message: %s", diff)
			}
		})
	}
}

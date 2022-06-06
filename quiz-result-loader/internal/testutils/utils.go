package testutils

import (
	"bytes"
	log "github.com/sirupsen/logrus"
)

type mockLogFormatter struct {}

func (f *mockLogFormatter) Format(entry *log.Entry) ([]byte, error) {
	return []byte(entry.Message), nil
}

// Returns a new logger instance that writes to the provided logBuffer
func BuildMemoryLogger(logBuffer *bytes.Buffer) *log.Logger {
	logger := log.New()
	logger.SetOutput(logBuffer)
	logger.SetFormatter(&mockLogFormatter{})
	return logger
}

type channelWriter struct {
	channel chan<-[]byte
}

func (w *channelWriter) Write(p []byte) (n int, err error) {
	w.channel<-p
	return len(p), nil
}

// Returns a new logger instance that writes to the provided log channel
func BuildChannelLogger(logCh chan<-[]byte) *log.Logger {
	logger := log.New()
	logger.SetOutput(&channelWriter{logCh})
	logger.SetFormatter(&mockLogFormatter{})
	return logger
}

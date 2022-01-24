package handler

import (
	"bytes"
	"net/http"
	log "github.com/sirupsen/logrus"
)

type loggingResponseWriter struct {
	wrappedWriter http.ResponseWriter	// Wrapped response writer
	statusCode int				// http response status code
	responseRaw bytes.Buffer	// Raw bytes written as response
}

func (lrw *loggingResponseWriter) Header() http.Header {
	return lrw.wrappedWriter.Header()
}

func (lrw *loggingResponseWriter) Write(data []byte) (int, error) {
	lrw.responseRaw.Write(data)
	return lrw.wrappedWriter.Write(data)
}

func (lrw *loggingResponseWriter) WriteHeader(statusCode int) {
	lrw.statusCode = statusCode
	lrw.wrappedWriter.WriteHeader(statusCode)
}

func LoggerMiddleware(handler func(http.ResponseWriter, *http.Request)) func (http.ResponseWriter, *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		lrw := loggingResponseWriter{
			wrappedWriter: w,
			statusCode: 0, 
			responseRaw: bytes.Buffer{},
		}

		handler(&lrw, r)

		// Log the body for 4xx's and 5xx's only
		if 400 <= lrw.statusCode && lrw.statusCode < 600 {
			log.Warn(lrw.responseRaw.String())
		}
	}
}
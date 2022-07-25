package adapter

import (
	"bytes"
	"net/http"

	"github.com/aws/aws-lambda-go/events"
)

type httpResponseWriterToALBTargetGroupResponse struct {
	headers http.Header
	bodyWriter bytes.Buffer
	statusCode *int
}

func NewHttpResponseWriterToALBTargetGroupResponse() httpResponseWriterToALBTargetGroupResponse {
	return httpResponseWriterToALBTargetGroupResponse{
		headers: make(http.Header),
		bodyWriter: bytes.Buffer{},
	}
}

// Get a reference to the header map to send in the response
func (a *httpResponseWriterToALBTargetGroupResponse) Header() http.Header {
	return a.headers
}

// Write writes the data to the connection as part of an HTTP reply.
//
// If WriteHeader has not yet been called, Write calls
// WriteHeader(http.StatusOK) before writing the data. If the Header
// does not contain a Content-Type line, Write adds a Content-Type set
// to the result of passing the initial 512 bytes of written data to
// DetectContentType.
func (a *httpResponseWriterToALBTargetGroupResponse) Write(bytes []byte) (int, error) {
	if a.statusCode == nil {
		a.WriteHeader(http.StatusOK)
	}

	a.bodyWriter.Write(bytes)

	contentType := "Content-Type"
	if a.headers.Get(contentType) == "" {
		// No Content-Type header set yet, detect and set based on current bytes in buffer
		contentTypeVal := http.DetectContentType(a.bodyWriter.Bytes())
		a.headers[contentType] = []string{contentTypeVal}
	}

	return a.bodyWriter.Len(), nil
}

// WriteHeader sends an HTTP response header with the provided
// status code.
//
// If WriteHeader is not called explicitly, the first call to Write
// will trigger an implicit WriteHeader(http.StatusOK).
// Thus explicit calls to WriteHeader are mainly used to
// send error codes.
func (a *httpResponseWriterToALBTargetGroupResponse) WriteHeader(statusCode int) {
	a.statusCode = &statusCode
}

// Creates the ALBTargetGroupResponse from the writer. Returns non-nill error if failed to create
func (a *httpResponseWriterToALBTargetGroupResponse) AsALBTargetGroupResponse() (events.ALBTargetGroupResponse, error) {
	return events.ALBTargetGroupResponse{
		StatusCode: *a.statusCode,
		MultiValueHeaders: a.headers,
		Body: a.bodyWriter.String(),
		IsBase64Encoded: false,
	}, nil
}
package adapter

import (
	"bytes"
	"encoding/base64"
	"fmt"
	"io"
	"net/http"
	"net/url"

	"github.com/aws/aws-lambda-go/events"
)

// Converts the AWS Lambda ALBTargetGroupRequest event to an http.Request
func ALBTargetGroupRequestEventToHttpRequest(event *events.ALBTargetGroupRequest) (*http.Request, error) {

	var body []byte
	if event.IsBase64Encoded {
		var err error
		body, err = base64.StdEncoding.DecodeString(event.Body)
		if err != nil {
			return &http.Request{}, fmt.Errorf("failed to decode base64 encoded body: Error: %w", err)
		}
	} else {
		body = []byte(event.Body)
	}

	httpHeaders := make(http.Header)
	for key, values := range event.MultiValueHeaders {
		for _, value := range values {
			httpHeaders.Add(key, value)
		}
	}

	return &http.Request{
		Method: event.HTTPMethod,
		URL: &url.URL{Path: event.Path},
		Header: httpHeaders,
		Body: io.NopCloser(bytes.NewReader(body)),
	}, nil
}
package handler

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/Ryangwaite/mc-speedrun/question-set-loader/auth"
	"github.com/Ryangwaite/mc-speedrun/question-set-loader/internal/testutils"
	"github.com/Ryangwaite/mc-speedrun/question-set-loader/quiz"
	"github.com/google/go-cmp/cmp"
	"github.com/sirupsen/logrus"
)

type mockQuizWriter struct {
	quizId string
	qAndA quiz.QuestionAndAnswers
	writeImpl func(quizId string, qAndA *quiz.QuestionAndAnswers) error
}

func NewMockQuizWriter(writeImpl *func(quizId string, qAndA *quiz.QuestionAndAnswers) error) *mockQuizWriter {
	if writeImpl != nil {
		return &mockQuizWriter{writeImpl: *writeImpl}
	} else {
		return &mockQuizWriter{writeImpl: func(quizId string, qAndA *quiz.QuestionAndAnswers) error {return nil}}
	}
}

func (m *mockQuizWriter) Write(quizId string, qAndA *quiz.QuestionAndAnswers) error {
	m.quizId = quizId
	m.qAndA = *qAndA
	return m.writeImpl(quizId, qAndA)
}

// Returns buffer containing the questionsAndAnswers written as multipart form data,
// corresponding content-type or non-nil error on failure
func buildReqBodyWithBytes(formKey string, bodyBytes []byte) (reqBody *bytes.Buffer, contentTypeValue string, err error) {
	// Create writer for writing the request body
	body := new(bytes.Buffer)
	reqBodyWriter := multipart.NewWriter(body)
	defer reqBodyWriter.Close()

	partWriter, err := reqBodyWriter.CreateFormFile(formKey, "quiz.json")
	if err != nil {
		err = fmt.Errorf("failed to create writer for 'file': %w", err)
		return
	}
	
	if _, err = partWriter.Write(bodyBytes); err != nil {
		err = fmt.Errorf("failed to write body content: %w", err)
		return
	}
	return body, reqBodyWriter.FormDataContentType(), nil
}

// Returns buffer containing the questionsAndAnswers written as multipart form data,
// corresponding content-type or non-nil error on failure
func buildReqBodyWithQAndA(formKey string, qAndA *quiz.QuestionAndAnswers) (reqBody *bytes.Buffer, contentTypeValue string, err error) {
	bodyBytes, err := json.Marshal(qAndA)
	if err != nil {
		err = fmt.Errorf("failed to create body content: %w", err)
		return
	}
	return buildReqBodyWithBytes(formKey, bodyBytes)
}

var qAndA = quiz.QuestionAndAnswers {
	{
		Question: "question 1",
		Category: "food",
		Options: []string {"a", "b", "c", "d"},
		Answers: []int{1, 2},
	},
}

// Tests uploading when the method is not POST
func TestUploadQuizHandler_wrong_method(t *testing.T) {
	// Initialize
	jwtParams := auth.JwtParams{
		Secret: "testsecret",
		Issuer: "go.test",
		Audience: "go.test",
	}
	quizId := "quizId"

	body, contentTypeValue, err := buildReqBodyWithQAndA("file", &qAndA)
	if err != nil {
		t.Fatalf("failed to create request body: %v", err)
	}
	req := httptest.NewRequest(http.MethodPatch, "/upload/quiz", body)
	req.Header.Add("Content-Type", contentTypeValue)

	token, err := testutils.BuildJwt(testutils.JwtTestParams{
		Secret: jwtParams.Secret,
		Issuer: jwtParams.Issuer,
		Audience: jwtParams.Audience,
		IsHost: true,
		QuizId: quizId,
	})
	if err != nil {
		t.Fatalf("failed to create auth token: %v", err)
	}
	req.Header.Add("Authorization", fmt.Sprintf("Bearer %s", token))

	uploadServer := Upload {
		DevelopmentMode: false,
		QuizWriter: NewMockQuizWriter(nil),
		JwtParams: jwtParams,
		Logger: logrus.StandardLogger(),
	}

	// Act
	recorder := httptest.NewRecorder()
	uploadServer.Quiz(recorder, req)
	response := recorder.Result()
	defer response.Body.Close()

	// Assert
	if diff := cmp.Diff(response.StatusCode, http.StatusUnauthorized); diff != "" {
		t.Errorf("Wrong status code: %s", diff)
	}
	
	bodyBytes, err := ioutil.ReadAll(response.Body)
	if err != nil {
		t.Fatalf("Failed to read response body bytes: %v", err)
	}
	expectedError := "Unexpected HTTP method"
	actualError := string(bodyBytes)
	if !strings.Contains(actualError, expectedError) {
		t.Fatalf("Response body '%s' did not contain error message '%s'", actualError, expectedError)
	}
}

// Tests uploading when the "Authorization" header is absent
func TestUploadQuizHandler_absent_authorization_header(t *testing.T) {
	// Initialize
	body, contentTypeValue, err := buildReqBodyWithQAndA("file", &qAndA)
	if err != nil {
		t.Fatalf("failed to create request body: %v", err)
	}
	req := httptest.NewRequest(http.MethodPost, "/upload/quiz", body)
	req.Header.Add("Content-Type", contentTypeValue)

	uploadServer := Upload {
		DevelopmentMode: false,
		QuizWriter: NewMockQuizWriter(nil),
		JwtParams: auth.JwtParams{},
		Logger: logrus.StandardLogger(),
	}

	// Act
	recorder := httptest.NewRecorder()
	uploadServer.Quiz(recorder, req)
	response := recorder.Result()
	defer response.Body.Close()

	// Assert
	if diff := cmp.Diff(response.StatusCode, http.StatusUnauthorized); diff != "" {
		t.Errorf("Wrong status code: %s", diff)
	}
	
	bodyBytes, err := ioutil.ReadAll(response.Body)
	if err != nil {
		t.Fatalf("Failed to read response body bytes: %v", err)
	}
	expectedError := "Absent 'Authorization' header"
	actualError := string(bodyBytes)
	if !strings.Contains(actualError, expectedError) {
		t.Fatalf("Response body '%s' did not contain error message '%s'", actualError, expectedError)
	}
}

// Tests uploading when the auth header is of invalid format
func TestUploadQuizHandler_invalid_authorization_format(t *testing.T) {
	// Initialize
	body, contentTypeValue, err := buildReqBodyWithQAndA("file", &qAndA)
	if err != nil {
		t.Fatalf("failed to create request body: %v", err)
	}
	req := httptest.NewRequest(http.MethodPost, "/upload/quiz", body)
	req.Header.Add("Content-Type", contentTypeValue)
	req.Header.Add("Authorization", "Invalid format")

	uploadServer := Upload {
		DevelopmentMode: false,
		QuizWriter: NewMockQuizWriter(nil),
		JwtParams: auth.JwtParams{},
		Logger: logrus.StandardLogger(),
	}

	// Act
	recorder := httptest.NewRecorder()
	uploadServer.Quiz(recorder, req)
	response := recorder.Result()
	defer response.Body.Close()

	// Assert
	if diff := cmp.Diff(response.StatusCode, http.StatusUnauthorized); diff != "" {
		t.Errorf("Wrong status code: %s", diff)
	}
	
	bodyBytes, err := ioutil.ReadAll(response.Body)
	if err != nil {
		t.Fatalf("Failed to read response body bytes: %v", err)
	}
	expectedError := "Invalid 'Authorization' header value"
	actualError := string(bodyBytes)
	if !strings.Contains(actualError, expectedError) {
		t.Fatalf("Response body '%s' did not contain error message '%s'", actualError, expectedError)
	}
}

// Tests uploading when the auth token is invalid
func TestUploadQuizHandler_invalid_auth_token(t *testing.T) {
	// Initialize
	jwtParams := auth.JwtParams{
		Secret: "testsecret",
		Issuer: "go.test",
		Audience: "go.test",
	}
	quizId := "quizId"

	body, contentTypeValue, err := buildReqBodyWithQAndA("file", &qAndA)
	if err != nil {
		t.Fatalf("failed to create request body: %v", err)
	}
	req := httptest.NewRequest(http.MethodPost, "/upload/quiz", body)
	req.Header.Add("Content-Type", contentTypeValue)

	token, err := testutils.BuildJwt(testutils.JwtTestParams{
		Secret: jwtParams.Secret + "wrongtoken",
		Issuer: jwtParams.Issuer,
		Audience: jwtParams.Audience,
		IsHost: true,
		QuizId: quizId,
	})
	if err != nil {
		t.Fatalf("failed to create auth token: %v", err)
	}
	req.Header.Add("Authorization", fmt.Sprintf("Bearer %s", token))

	uploadServer := Upload {
		DevelopmentMode: false,
		QuizWriter: NewMockQuizWriter(nil),
		JwtParams: jwtParams,
		Logger: logrus.StandardLogger(),
	}

	// Act
	recorder := httptest.NewRecorder()
	uploadServer.Quiz(recorder, req)
	response := recorder.Result()
	defer response.Body.Close()

	// Assert
	if diff := cmp.Diff(response.StatusCode, http.StatusUnauthorized); diff != "" {
		t.Errorf("Wrong status code: %s", diff)
	}
	
	bodyBytes, err := ioutil.ReadAll(response.Body)
	if err != nil {
		t.Fatalf("Failed to read response body bytes: %v", err)
	}
	expectedError := "Invalid token"
	actualError := string(bodyBytes)
	if !strings.Contains(actualError, expectedError) {
		t.Fatalf("Response body '%s' did not contain error message '%s'", actualError, expectedError)
	}
}

// Tests uploading when the form key is not "file"
func TestUploadQuizHandler_invalid_form_key(t *testing.T) {
	// Initialize
	jwtParams := auth.JwtParams{
		Secret: "testsecret",
		Issuer: "go.test",
		Audience: "go.test",
	}
	quizId := "quizId"

	body, contentTypeValue, err := buildReqBodyWithQAndA("invalidformkey", &qAndA)
	if err != nil {
		t.Fatalf("failed to create request body: %v", err)
	}
	req := httptest.NewRequest(http.MethodPost, "/upload/quiz", body)
	req.Header.Add("Content-Type", contentTypeValue)

	token, err := testutils.BuildJwt(testutils.JwtTestParams{
		Secret: jwtParams.Secret,
		Issuer: jwtParams.Issuer,
		Audience: jwtParams.Audience,
		IsHost: true,
		QuizId: quizId,
	})
	if err != nil {
		t.Fatalf("failed to create auth token: %v", err)
	}
	req.Header.Add("Authorization", fmt.Sprintf("Bearer %s", token))

	uploadServer := Upload {
		DevelopmentMode: false,
		QuizWriter: NewMockQuizWriter(nil),
		JwtParams: jwtParams,
		Logger: logrus.StandardLogger(),
	}

	// Act
	recorder := httptest.NewRecorder()
	uploadServer.Quiz(recorder, req)
	response := recorder.Result()
	defer response.Body.Close()

	// Assert
	if diff := cmp.Diff(response.StatusCode, http.StatusBadRequest); diff != "" {
		t.Errorf("Wrong status code: %s", diff)
	}
	
	bodyBytes, err := ioutil.ReadAll(response.Body)
	if err != nil {
		t.Fatalf("Failed to read response body bytes: %v", err)
	}
	expectedError := "Missing form field 'file'"
	actualError := string(bodyBytes)
	if !strings.Contains(actualError, expectedError) {
		t.Fatalf("Response body '%s' did not contain error message '%s'", actualError, expectedError)
	}
}

// Tests uploading a file that is incorrectly formatted
func TestUploadQuizHandler_incorrectly_formatted_file(t *testing.T) {
	// Initialize
	jwtParams := auth.JwtParams{
		Secret: "testsecret",
		Issuer: "go.test",
		Audience: "go.test",
	}
	quizId := "quizId"

	body, contentTypeValue, err := buildReqBodyWithBytes("file", []byte("incorrectly formatted file"))
	if err != nil {
		t.Fatalf("failed to create request body: %v", err)
	}
	req := httptest.NewRequest(http.MethodPost, "/upload/quiz", body)
	req.Header.Add("Content-Type", contentTypeValue)

	token, err := testutils.BuildJwt(testutils.JwtTestParams{
		Secret: jwtParams.Secret,
		Issuer: jwtParams.Issuer,
		Audience: jwtParams.Audience,
		IsHost: true,
		QuizId: quizId,
	})
	if err != nil {
		t.Fatalf("failed to create auth token: %v", err)
	}
	req.Header.Add("Authorization", fmt.Sprintf("Bearer %s", token))

	mockQuizWriter := NewMockQuizWriter(nil)
	uploadServer := Upload {
		DevelopmentMode: false,
		QuizWriter: mockQuizWriter,
		JwtParams: jwtParams,
		Logger: logrus.StandardLogger(),
	}

	// Act
	recorder := httptest.NewRecorder()
	uploadServer.Quiz(recorder, req)
	response := recorder.Result()
	defer response.Body.Close()

	// Assert
	if diff := cmp.Diff(response.StatusCode, http.StatusBadRequest); diff != "" {
		t.Errorf("Wrong status code: %s", diff)
	}
	
	bodyBytes, err := ioutil.ReadAll(response.Body)
	if err != nil {
		t.Fatalf("Failed to read response body bytes: %v", err)
	}
	expectedError := "Uploaded file is invalid"
	actualError := string(bodyBytes)
	if !strings.Contains(actualError, expectedError) {
		t.Fatalf("Response body '%s' did not contain error message '%s'", actualError, expectedError)
	}
}

// Tests uploading a quiz where the file fails to save to disk
func TestUploadQuizHandler_fail_to_save_file(t *testing.T) {
	// Initialize
	jwtParams := auth.JwtParams{
		Secret: "testsecret",
		Issuer: "go.test",
		Audience: "go.test",
	}
	quizId := "quizId"

	body, contentTypeValue, err := buildReqBodyWithQAndA("file", &qAndA)
	if err != nil {
		t.Fatalf("failed to create request body: %v", err)
	}
	req := httptest.NewRequest(http.MethodPost, "/upload/quiz", body)
	req.Header.Add("Content-Type", contentTypeValue)

	token, err := testutils.BuildJwt(testutils.JwtTestParams{
		Secret: jwtParams.Secret,
		Issuer: jwtParams.Issuer,
		Audience: jwtParams.Audience,
		IsHost: true,
		QuizId: quizId,
	})
	if err != nil {
		t.Fatalf("failed to create auth token: %v", err)
	}
	req.Header.Add("Authorization", fmt.Sprintf("Bearer %s", token))

	writeImpl := func(quizId string, qAndA *quiz.QuestionAndAnswers) error {
		return fmt.Errorf("failed to write file")
	}
	mockQuizWriter := NewMockQuizWriter(&writeImpl)
	uploadServer := Upload {
		DevelopmentMode: false,
		QuizWriter: mockQuizWriter,
		JwtParams: jwtParams,
		Logger: logrus.StandardLogger(),
	}

	// Act
	recorder := httptest.NewRecorder()
	uploadServer.Quiz(recorder, req)
	response := recorder.Result()
	defer response.Body.Close()

	// Assert
	if diff := cmp.Diff(response.StatusCode, http.StatusBadRequest); diff != "" {
		t.Errorf("Wrong status code: %s", diff)
	}
	
	bodyBytes, err := ioutil.ReadAll(response.Body)
	if err != nil {
		t.Fatalf("Failed to read response body bytes: %v", err)
	}
	expectedError := "Failed to save file"
	actualError := string(bodyBytes)
	if !strings.Contains(actualError, expectedError) {
		t.Fatalf("Response body '%s' did not contain error message '%s'", actualError, expectedError)
	}
}

// Tests a successful upload
func TestUploadQuizHandler_success(t *testing.T) {
	// Initialize
	jwtParams := auth.JwtParams{
		Secret: "testsecret",
		Issuer: "go.test",
		Audience: "go.test",
	}
	quizId := "quizId"

	body, contentTypeValue, err := buildReqBodyWithQAndA("file", &qAndA)
	if err != nil {
		t.Fatalf("failed to create request body: %v", err)
	}
	req := httptest.NewRequest(http.MethodPost, "/upload/quiz", body)
	req.Header.Add("Content-Type", contentTypeValue)

	token, err := testutils.BuildJwt(testutils.JwtTestParams{
		Secret: jwtParams.Secret,
		Issuer: jwtParams.Issuer,
		Audience: jwtParams.Audience,
		IsHost: true,
		QuizId: quizId,
	})
	if err != nil {
		t.Fatalf("failed to create auth token: %v", err)
	}
	req.Header.Add("Authorization", fmt.Sprintf("Bearer %s", token))

	mockQuizWriter := NewMockQuizWriter(nil)
	uploadServer := Upload {
		DevelopmentMode: false,
		QuizWriter: mockQuizWriter,
		JwtParams: jwtParams,
		Logger: logrus.StandardLogger(),
	}

	// Act
	recorder := httptest.NewRecorder()
	uploadServer.Quiz(recorder, req)
	response := recorder.Result()
	defer response.Body.Close()

	// Assert
	if diff := cmp.Diff(response.StatusCode, http.StatusCreated); diff != "" {
		t.Errorf("Wrong status code: %s", diff)
	}
	
	bodyBytes, err := ioutil.ReadAll(response.Body)
	if err != nil {
		t.Fatalf("Failed to read response body bytes: %v", err)
	}
	expectedResponse := ""
	actualResponse := string(bodyBytes)
	if !strings.Contains(actualResponse, expectedResponse) {
		t.Fatalf("Response body '%s' did not contain error message '%s'", actualResponse, expectedResponse)
	}

	if diff := cmp.Diff(mockQuizWriter.quizId, quizId); diff != "" {
		t.Fatalf("Wrong quizId '%s' expected '%s'", mockQuizWriter.quizId, quizId)
	}
	if diff := cmp.Diff(mockQuizWriter.qAndA, qAndA); diff != "" {
		t.Fatalf("Wrong uploaded question set '%v' expected '%v'", mockQuizWriter.qAndA, qAndA)
	}
}

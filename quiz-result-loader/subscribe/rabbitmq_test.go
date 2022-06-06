package subscribe

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"testing"
	"time"

	"github.com/Ryangwaite/mc-speedrun/quiz-result-loader/internal/testutils"
	"github.com/google/go-cmp/cmp"
	"github.com/streadway/amqp"
)

//---------------------------------------------------
// Mock implementations of the RabbitMqReceiver components

type mockAmqpConnection struct {
	closeCallCount int
}

func (m *mockAmqpConnection) Close() error {
	m.closeCallCount++
	return nil
}

type mockAmqpChannel struct {
	consumeCh chan amqp.Delivery
	consumeCallCount int
	closeCallCount int
}

func (m *mockAmqpChannel) Consume(queue, consumer string, autoAck, exclusive, noLocal, noWait bool, args amqp.Table) (<-chan amqp.Delivery, error) {
	m.consumeCallCount++
	return m.consumeCh, nil
}

func (m *mockAmqpChannel) Close() error {
	m.closeCallCount++
	return nil
}

type mockAmqpQueue struct {
	nameCallCount int
}

func (m *mockAmqpQueue) Name() string {
	m.nameCallCount++
	return "mockname"
}

//---------------------------------------------------

// Serializes the quiz complete event into its json representation
func serializeQuizCompleteEvent(event QuizCompleteEvent) ([]byte, error) {
	return json.Marshal(event)
}

// Sends message to quizCh when receiving correctly formatted QuizCompleteEvent from rabbitmq
func TestStart_receive_correctly_formatted_event(t *testing.T) {
	subscriberConsumerCh := make(chan amqp.Delivery)
	mockConnection := mockAmqpConnection{}
	mockChannel := mockAmqpChannel{consumeCh: subscriberConsumerCh}
	mockQueue := mockAmqpQueue{}
	mockLogger := testutils.BuildMemoryLogger(&bytes.Buffer{})
	rabbitMqReceiver := rabbitMqReceiver{&mockConnection, &mockChannel, &mockQueue, mockLogger,}

	ctx, cancel := context.WithTimeout(context.Background(), time.Second) // test has 1 second to run
	defer cancel()
	quizReceiveCh := make(chan string)
	startErrCh := make(chan error)
	go func() {
		defer close(startErrCh)
		if err := rabbitMqReceiver.Start(ctx, quizReceiveCh); err != nil {
			startErrCh<-fmt.Errorf("Failed to start. Error %w", err)
		}
	}()

	// Send the correctly formatted event
	quizId := "testquiz"
	eventBytest, err := serializeQuizCompleteEvent(QuizCompleteEvent{
		"com.ryangwaite.mc-speedrun.quiz.complete.test.v1",
		"/mc-speedrun/quiz-complete",
		"universaluid",
		time.Now(),
		QuizCompleteEventDataV1{QuizId: quizId},
	})
	if err != nil {
		t.Fatalf("Failed to format quizCompleteEvent. Error %+v", err)
	}
	mockChannel.consumeCh<-amqp.Delivery{Body: eventBytest}


	// Check that the processed quiz was received out the other end
	select {
	case processedQuizId := <-quizReceiveCh:
		if diff := cmp.Diff(processedQuizId, quizId); diff != "" {
			t.Errorf("Unexpected processed quiz from subscriber. %s", diff)
		}
	case err := <-startErrCh:
		if err != nil {
			t.Fatalf("Failed to start subscriber. Error: %+v", err)
		}
	case <-ctx.Done():
		t.Errorf("Context cancelled. Error: %+v", ctx.Err())
	}
}

// Logs warning when receiving a msg from rmq that doesn't conform to a QuizCompleteEvent
func TestStart_receive_incorrectly_formatted_event(t *testing.T) {
	subscriberConsumerCh := make(chan amqp.Delivery)
	mockConnection := mockAmqpConnection{}
	mockChannel := mockAmqpChannel{consumeCh: subscriberConsumerCh}
	mockQueue := mockAmqpQueue{}
	logCh := make(chan []byte)
	mockLogger := testutils.BuildChannelLogger(logCh)
	rabbitMqReceiver := rabbitMqReceiver{&mockConnection, &mockChannel, &mockQueue, mockLogger,}

	ctx, cancel := context.WithTimeout(context.Background(), time.Second) // test has 1 second to run
	defer cancel()
	quizReceiveCh := make(chan string)
	startErrCh := make(chan error)
	go func() {
		defer close(startErrCh)
		if err := rabbitMqReceiver.Start(ctx, quizReceiveCh); err != nil {
			startErrCh<-fmt.Errorf("Failed to start. Error %w", err)
		}
	}()

	// Send the a garbage event
	mockChannel.consumeCh<-amqp.Delivery{Body: []byte("garbage")}

	// Check that the log was received
	select {
	case logMsgBytes := <-logCh:
		logMsg := string(logMsgBytes)
		if !strings.Contains(logMsg, "Unable to parse") {
			t.Fatalf("Failed to detect badly formatted event")
		}
	case <-quizReceiveCh:
		t.Fatalf("Received processed quiz")
	case err := <-startErrCh:
		t.Fatalf("Received. Error: %+v", err)
	case <-ctx.Done():
		t.Errorf("Context cancelled. Error: %+v", ctx.Err())
	}
}

// Logs warning when receiving a msg from rmq that has an empty quizId
func TestStart_receive_event_with_empty_quizid(t *testing.T) {
	subscriberConsumerCh := make(chan amqp.Delivery)
	mockConnection := mockAmqpConnection{}
	mockChannel := mockAmqpChannel{consumeCh: subscriberConsumerCh}
	mockQueue := mockAmqpQueue{}
	logCh := make(chan []byte)
	mockLogger := testutils.BuildChannelLogger(logCh)
	rabbitMqReceiver := rabbitMqReceiver{&mockConnection, &mockChannel, &mockQueue, mockLogger,}

	ctx, cancel := context.WithTimeout(context.Background(), time.Second) // test has 1 second to run
	defer cancel()
	quizReceiveCh := make(chan string)
	startErrCh := make(chan error)
	go func() {
		defer close(startErrCh)
		if err := rabbitMqReceiver.Start(ctx, quizReceiveCh); err != nil {
			startErrCh<-fmt.Errorf("Failed to start. Error %w", err)
		}
	}()

	// Send the correctly formatted event but with empty quizId
	eventBytest, err := serializeQuizCompleteEvent(QuizCompleteEvent{
		"com.ryangwaite.mc-speedrun.quiz.complete.test.v1",
		"/mc-speedrun/quiz-complete",
		"universaluid",
		time.Now(),
		QuizCompleteEventDataV1{QuizId: ""},
	})
	if err != nil {
		t.Fatalf("Failed to format quizCompleteEvent. Error %+v", err)
	}
	mockChannel.consumeCh<-amqp.Delivery{Body: eventBytest}


	// Check that the log was received
	select {
	case logMsgBytes := <-logCh:
		logMsg := string(logMsgBytes)
		if !strings.Contains(logMsg, "Empty quizId") {
			t.Fatalf("Failed to detect badly formatted event")
		}
	case <-quizReceiveCh:
		t.Fatalf("Received processed quiz")
	case err := <-startErrCh:
		t.Fatalf("Failed to start subscriber. Error: %+v", err)
	case <-ctx.Done():
		t.Errorf("Context cancelled. Error: %+v", ctx.Err())
	}
}

type errorAmqpChannelConsume struct{ }
func (a *errorAmqpChannelConsume) Consume(queue, consumer string, autoAck, exclusive, noLocal, noWait bool, args amqp.Table) (<-chan amqp.Delivery, error) {
	return nil, fmt.Errorf("Failed to consume")
}
func (a *errorAmqpChannelConsume) Close() error { return nil }

// Returns an error when it fails to consume from channel
func TestStart_fails_to_consume(t *testing.T) {
	mockLogger := testutils.BuildMemoryLogger(&bytes.Buffer{})
	rabbitMqReceiver := rabbitMqReceiver{
		&mockAmqpConnection{},
		&errorAmqpChannelConsume{},
		&mockAmqpQueue{},
		mockLogger,
	}

	if err := rabbitMqReceiver.Start(context.Background(), make(chan string)); err == nil {
		t.Fatalf("Failed to return error when start failed")
	}
}

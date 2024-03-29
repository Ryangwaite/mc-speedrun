package subscribe

import (
	"context"
	"encoding/json"
	"fmt"
	log "github.com/sirupsen/logrus"
	"github.com/streadway/amqp"
)

//--------------------------------------------------------
// Interfaces for injecting mocks
type amqpConnection interface {
	Close() error
}

type amqpChannel interface {
	Consume(queue, consumer string, autoAck, exclusive, noLocal, noWait bool, args amqp.Table) (<-chan amqp.Delivery, error)
	Close() error
}

type amqpQueue interface {
	Name() string
}

// Wrappers over amqp that implement the above interfaces for the actual implementation

type amqpConnectionWrapper struct {
	conn *amqp.Connection
}

func (a *amqpConnectionWrapper) Close() error {
	return a.conn.Close()
}

type amqpChannelWrapper struct {
	amqpCh *amqp.Channel
}

func (a *amqpChannelWrapper) Consume(queue, consumer string, autoAck, exclusive, noLocal, noWait bool, args amqp.Table) (<-chan amqp.Delivery, error) {
	return a.amqpCh.Consume(queue, consumer, autoAck, exclusive, noLocal, noWait, args)
}

func (a *amqpChannelWrapper) Close() error {
	return a.amqpCh.Close()
}

type amqpQueueWrapper struct {
	amqpQ *amqp.Queue
}

func (a *amqpQueueWrapper) Name() string {
	return a.amqpQ.Name
}

//------------------------------------------------------

type RabbitMqReceiverOptions struct {
	Host		string
	Port		int
	Username	string
	Password	string
	QueueName	string
	Logger		*log.Logger
}

type rabbitMqReceiver struct {
	conn amqpConnection
	amqpCh amqpChannel
	queue amqpQueue
	logger *log.Logger
}

// Get a new RabbitMQ connected receiver
func NewRabbitMqReceiver(o RabbitMqReceiverOptions) (rabbitMqReceiver, error) {
	connectionString := fmt.Sprintf("amqp://%s:%s@%s:%d/", o.Username, o.Password, o.Host, o.Port)
	conn, err := amqp.Dial(connectionString) // TODO: Add TLS
	if err != nil {
		return rabbitMqReceiver{}, err
	}

	amqpCh, err := conn.Channel()
	if err != nil {
		conn.Close()
		return rabbitMqReceiver{}, err
	}

	queue, err := amqpCh.QueueDeclare(
		o.QueueName,
		true,			// durable
		false,			// dont delete when unused
		false,			// not exclusive
		false,			// no-wait
		nil,
	)
	if err != nil {
		amqpCh.Close()
		conn.Close()
		return rabbitMqReceiver{}, err
	}

	receiver := rabbitMqReceiver{
		conn: &amqpConnectionWrapper{conn},
		amqpCh: &amqpChannelWrapper{amqpCh},
		queue: &amqpQueueWrapper{&queue},
		logger: o.Logger,
	}

	return receiver, nil
}

// Listens forever on RabbitMQ queue and publishes received quizzes to quizCh
func (r rabbitMqReceiver) Start(ctx context.Context, quizCh QuizCh) error {
	msgs, err := r.amqpCh.Consume(
		r.queue.Name(),
		"",					// consumer
		true,				// auto-ack
		false,				// exclusive
		false,				// no-local
		false,				// no-wait
		nil,
	)
	if err != nil {
		return err
	}

	for {
		select {
		case msg := <-msgs:
			var event QuizCompleteEvent
			err := json.Unmarshal(msg.Body, &event)
			if err != nil {
				// TODO: Send to  RabbitMQ dead letter queue
				r.logger.Warnf("Unable to parse '%s', Error: %s", string(msg.Body), err.Error())
				continue
			}

			quizId := event.Data.QuizId
			if quizId == "" {
				r.logger.Warnf("Empty quizId for event : '%s'", string(msg.Body))
				// TODO: Send to RabbitMQ dead letter queue
				continue
			}

			// Successfully pulled out the quizID
			quizCh<-quizId

		case <-ctx.Done():
			if ctx.Err() != nil {
				return ctx.Err()
			} else {
				return nil // success
			}
		}
	}
}

// Close the underlying RabbitMQ connection
func (r rabbitMqReceiver) Close() {
	r.amqpCh.Close()
	r.conn.Close()
}

package subscribe

import (
	"context"
	"fmt"

	"github.com/streadway/amqp"
)

type RabbitMqReceiverOptions struct {
	Host		string
	Port		int
	Username	string
	Password	string
	QueueName	string
}

type rabbitMqReceiver struct {
	conn *amqp.Connection
	amqpCh *amqp.Channel
	queue amqp.Queue
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
		false,			// durable
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
		conn: conn,
		amqpCh: amqpCh,
		queue: queue,
	}

	return receiver, nil
}

// Listens forever on RabbitMQ queue and publishes received quizzes to quizCh
func (r rabbitMqReceiver) Start(ctx context.Context, quizCh QuizCh) error {
	msgs, err := r.amqpCh.Consume(
		r.queue.Name,
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
			fmt.Println("Received msg with body: " + string(msg.Body))
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


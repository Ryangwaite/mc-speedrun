# quiz-result-loader

- [1. Overview](#1-overview)
  - [Gotchas (TODO: fix these)](#gotchas-todo-fix-these)
- [2. Installation](#2-installation)
- [3. Usage](#3-usage)
  - [3.1 Host](#31-host)
  - [3.2 Container](#32-container)
- [4. Tests](#4-tests)
- [5. Tips and Tricks](#5-tips-and-tricks)
  - [5.1 DynamoDB Commands](#51-dynamodb-commands)
  - [5.2 Invoking quiz-result-loader job processing](#52-invoking-quiz-result-loader-job-processing)

## 1. Overview
An extract, transform, load (ETL) process responsible for aggregating freshly completed real-time quiz results and the questions themselves and loading it into a persistent data store. Once loaded, the data is deleted from the original sources.

The service is packaged in two different ways depending on where it's deployed. Either AWS Lambda (entrypoint `cmd/lambda/main.go`) or as a docker container (entrypoint `cmd/container/main.go`). Configuration of the Lambda type is done through environment variables only, whereas configuration of the container type is done through an adjacent `config.ini` file with environment variables optionally overriding them.

The lambda is invoked with a batch of events (each event is 1 quiz), then processes each in parallel before returning.

The container type runs a daemon process with a pool of workers sitting idle awaiting jobs to process. It subscribes to messages from RabbitMQ and upon receiving, adds the job to the worker pool for processing.

### Gotchas (TODO: fix these)

- Upon failing to process the job for the quiz, the container type will simply log a failure. There's no concept of a deadletter queue. For the Lambda type, if the job processing failed then it will return that in the set of failures from the batch as output. Depending on the configuration of SQS that invoked the job, on failure the job may remain in the queue that it was received from or be sent to a deadletter queue.
- **The service does not support receiving the same message twice**.

## 2. Installation

To run locally on the host you need to install:
- [go 1.17 or newer](https://go.dev/doc/install)

## 3. Usage

Note that the redis, rabbit-mq and dynamodb hosts (as configured in `config.ini`) need to be reachable else the application will exit with an error.

### 3.1 Host
To run the binary on the host run:
```bash
go run cmd/container/main.go
```

### 3.2 Container
Build the container with:
```bash
make container-build
```
And run it with:
```bash
make container-run
```

## 4. Tests
The tests are run with:
```bash
go test ./...
```

## 5. Tips and Tricks

### 5.1 DynamoDB Commands

Listing tables for dynamodb served out of the docker-compose environment:
```bash
aws dynamodb list-tables --endpoint-url http://localhost:8000
```

Deleting a table:
```bash
aws dynamodb delete-table --table-name quiz --endpoint-url http://localhost:8000
```

Scanning table contents:
```bash
 aws dynamodb scan --table-name quiz --endpoint-url http://localhost:8000
 ```

### 5.2 Invoking quiz-result-loader job processing

To trigger 10 in parallel run:
```bash
for i in 1 2 3 4 5 6 7 8 9 10; do { ./load-sample-data quiz$i & }; done
```

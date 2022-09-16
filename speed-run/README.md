# speed-run

- [1. Overview](#1-overview)
- [2. Installation](#2-installation)
- [3. Usage](#3-usage)
  - [3.1 Host](#31-host)
  - [3.2 Container](#32-container)
- [4. Tests](#4-tests)
- [5. Tips and Tricks](#5-tips-and-tricks)
  - [5.1 Hot-reloading with intellij IDEA Community](#51-hot-reloading-with-intellij-idea-community)

## 1. Overview
A websocket server responsible for controlling active quizzes. It's designed to work in a cluster with Redis Pub/Sub used to relay messages between instances. Clients of a single quiz may be spread across instances and if one fails, they can failover to another without dropping from the quiz.

Quizzes are read from disk and in-progress quiz state is persisted to the same Redis Pub/Sub instance. At quiz completion, a message is sent to a messaging queue for asynchronous processing of the state by a downstream service. For docker-compose, the messaging-queue is RabbitMq and for AWS it's SQS.

The messages sent between clients and speed-run instances is described [here](../docs/message-protocol.md).

## 2. Installation

To run locally on the host you need to install:
 - [OpenJDK11](https://openjdk.org/install/)

## 3. Usage

Redis and RabbitMq instances accessible by the settings of *src/main/resources/application.conf* must be running for the application to start. Running the docker-compose environment and port forwarding these services ports to the host is the recommended way to achieve this.

### 3.1 Host

To build the application:
```bash
./gradlew installDist
```
or to build but exclude tests:
```bash
./gradlew installDist -x test
```

And to run it:
```bash
./build/install/com.ryangwaite.speed-run/bin/com.ryangwaite.speed-run
```

### 3.2 Container

To build the container:
```bash
docker build --tag speed-run .
```

And to run it:
```bash
docker run \
    --rm \
    --publish 8081:8081 \
    --network docker-compose_default \
    --env REDIS_HOST=docker-compose_speed-run-cache_1 \
    --env NOTIFY_RABBITMQ_HOST=docker-compose_quiz-completion-queue_1 \
    speed-run
```
The above command joins the container to the docker-compose network and specifies the hostname environment variables of the dependent services as discoverable within the network.

## 4. Tests
The tests can be run with:
```bash
./gradlew test
```

## 5. Tips and Tricks

### 5.1 Hot-reloading with intellij IDEA Community

Run the docker-compose environment with ports forwarded to the host followed by the *ApplicationKt-dev-with-compose-env* run configuration in intellij. In another terminal run:
```bash
./gradlew -t build -x test -i
```

Whenever a file is changed and saved, the server will automatically notice, build the change and hot-swap it all without having to restart the server.

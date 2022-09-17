# mc-speedrun
![demo](./docs/demo.gif)

***A highly available web application for speedrunning multiple-choice quizzes. The fastest, most-accurate participant wins!***

---
- [1. Overview](#1-overview)
- [2. Design Goals](#2-design-goals)
- [3. Architecture](#3-architecture)
- [4. Project Structure](#4-project-structure)
- [5. Getting Started](#5-getting-started)

## 1. Overview
Upon browsing to the homepage, a user has the option to start a quiz as a host or use an access code to join an existing one as a participant.

Once begun, the host can configure various attributes of the quiz and upload the question set (quizzes are available in `sample-quizzes/`). An access code is available to copy and share to participants which enables the quiz _start_ button once at least one has joined. 

Starting the quiz presents each participant with the first question where they should answer it as quickly and as accurately as possible before advancing. As the participants progress through the questions, the host waits on a dashboard screen for all to finish.

At the end, the host and participants can browse through their results to see how they did. A _return to home_ button is available for easy access to the homepage for another round if desired.

## 2. Design Goals
The overarching goal of this project is to provide a _"sandbox for learning"_ different technolgies while still building something useful. A microservice architecure was deliberately chosen as that offers clear boundaries between services which is where one technology can stop and another one can start. For this reason, there's quite a number of languages used in the codebase.

## 3. Architecture

The application has two different architectures that mirror one another. Refer to the following links for a deep-dive on the design of each:
- [AWS Native](./deployment/aws/README.md)
- [Docker Compose](./deployment/docker-compose/README.md)

Both share roughly the same architectural shape although the implementation service or package type varies in some instances. The list of common services and relevant details is as follows:

Service | Purpose | Technologies
---------|----------|---------
 [question-set-loader](./question-set-loader/README.md) | HTTP endpoint for handling uploading of question sets | Go, Docker (for docker-compose), Lambda (for AWS)
 [quiz-result-loader](./quiz-result-loader/README.md) | ETL service for moving runtime quiz data to persistant storage | Go, Docker (for docker-compose), Lambda (for AWS)
 [sign-on](./sign-on/README.md) | Rudimentary Identity provider | Kotlin, Ktor, Docker
 [speed-run](./speed-run/README.md) | The server-side brains for running quizzes | Kotlin, Ktor, Docker
 [ui](./ui/README.md) | Frontend user interface | Typescript, React
 speed-run-cache | Facilitates Pub/Sub between _speed-run_ instances and acts as a data-store for in-progress quizzes | Redis (for docker-compose), Elasticache for Redis (for AWS)
 quiz-completion-queue | Queue for decoupling mc-speedrun instances and the processing pipeline. Msgs represent completed quizzes that are ready to be processed. | RabbitMQ (for docker-compose), SQS (for AWS)
 quiz-result-store | Persistent store for completed quizzes and results | DynamoDB (the local version is used for docker-compose)

## 4. Project Structure

```
.
├── deployment                  # Deployment environments
│   ├── aws                     # Source for aws cdk deployment
│   └── docker-compose          # Source for docker-compose environment
├── docs                        # Documentation
├── LICENSE                     # Project license
├── question-set-loader         # Source for question-set-loader service
├── quiz-result-loader          # Source for quiz-result-loader service
├── README.md                   # This file
├── sample-quizzes              # Sample quizzes for testing the application
├── sign-on                     # Source for sign-on service
├── speed-run                   # Source for speed-run service
├── test                        # Tests
│   └── end-to-end              # End to end tests
└── ui                          # Source for ui
```

## 5. Getting Started

To use the application in its entirety, browse to the directory of one of the deployment targets and follow the instructions there. The [docker-compose](./deployment/docker-compose/README.md) environment is the simplest as it can be run locally.

Each of the services can be run individually in which case browse to a services directory for instructions on how to run it.

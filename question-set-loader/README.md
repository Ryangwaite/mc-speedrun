# question-set-loader

- [1. Overview](#1-overview)
- [2. Installation](#2-installation)
- [3. Usage](#3-usage)
  - [3.1 Host](#31-host)
  - [3.2 Container](#32-container)
- [4. Tests](#4-tests)
- [5. Tips and Tricks](#5-tips-and-tricks)
  - [5.1 Uploading a file to a running server](#51-uploading-a-file-to-a-running-server)

## 1. Overview
An HTTP server with an endpoint for uploading question sets. When a request is received, its checked for authorization and that the content of the uploaded file is valid then it gets written to the local filesystem.

The server is packaged in two different ways depending on where it's deployed. Either AWS Lambda or as a docker container. To configure the container version, edit the `config.ini` file running local to the binary, optionally providing overrides via environment variables. For the Lambda version, only environment variable configuration is supported.

## 2. Installation

To run locally on the host you need to install:
- [go 1.17 or newer](https://go.dev/doc/install)

## 3. Usage

### 3.1 Host
To run the binary on the host run:
```bash
go run cmd/container/main.go
```
or in development mode:
```bash
DEVELOPMENT_MODE=true go run cmd/container/main.go
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
The tests can be run with:
```bash
go test ./...
```

## 5. Tips and Tricks
### 5.1 Uploading a file to a running server

To upload a file run:
```bash
./upload -f ../sample-quizzes/example-2.json localhost:8082
```
where `localhost:8082` is the host and port that the server is listening on.

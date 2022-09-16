# sign-on

- [1. Overview](#1-overview)
- [2. Installation](#2-installation)
- [3. Usage](#3-usage)
  - [3.1 Host](#31-host)
  - [3.2 Container](#32-container)
- [4. Tests](#4-tests)
- [5. Tips and Tricks](#5-tips-and-tricks)
  - [5.1 Hot-reloading with intellij IDEA Community](#51-hot-reloading-with-intellij-idea-community)

## 1. Overview
An HTTP server that responds to requests with an auth token for authenticating the user to other services. There's two types of tokens with different claims. One for hosts and one for clients.

Amongst the wider mc-speedrun architecture, it allowed other services auth logic to be implemented without relying on a full-fledged auth solution.

In future, it's likely this service will be removed for something more full featured when the flows through the application change e.g. login screen gated quiz creation.

## 2. Installation

To run locally on the host you need to install:
 - [OpenJDK11](https://openjdk.org/install/)


## 3. Usage

### 3.1 Host

To build the application then run it on the host:
```bash
./gradlew installDist
```
or to build but exclude tests:
```bash
./gradlew installDist -x test
```

To run it:
```bash
./build/install/com.ryangwaite.sign-on/bin/com.ryangwaite.sign-on
```

### 3.2 Container

To build the container:
```bash
docker build --tag sign-on .
```

And to run it:
```bash
docker run --rm -p 8080:8080 sign-on
```

## 4. Tests
The tests can be run with:
```bash
./gradlew test
```

## 5. Tips and Tricks
### 5.1 Hot-reloading with intellij IDEA Community

Run the *ApplicationKt-DEV* run configuration then in another terminal run:
```bash
./gradlew -t build -x test -i
```

Whenever a file is changed and saved, the server will automatically notice, build the change and hot-swap it all without having to restart the server.

# AWS
- [1. Setup](#1-setup)
- [2. Deploying](#2-deploying)
- [3. Architecture](#3-architecture)
  - [3.1 Application load balancer](#31-application-load-balancer)
  - [3.2 Question Set Loader](#32-question-set-loader)
  - [3.3 Question Set Store](#33-question-set-store)
  - [3.4 speed-run Fargate Cluster](#34-speed-run-fargate-cluster)
  - [3.5 speed-run Cache](#35-speed-run-cache)
  - [3.6 speed-run Reporter](#36-speed-run-reporter)
  - [3.7 speed-run Store](#37-speed-run-store)
  - [3.8 sign-on](#38-sign-on)
  - [3.9 CloudFront](#39-cloudfront)

## 1. Setup
Before deploying to aws, the following needs to be installed:
- [AWS CDK](https://docs.aws.amazon.com/cdk/v2/guide/getting_started.html#getting_started_install)
- [AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install-linux.html)


## 2. Deploying
Bootstrapping the cdk environment:
```
cdk bootstrap aws://<aws-account>/us-east-1
```
Unbootstrapping the cdk environment:
```
aws cloudformation delete-stack --stack-name CDKToolkit
```
Also need to delete the `cdk-hnb659fds-assets-xxxxxxxx-us-east-1` bucket as well.

## 3. Architecture
![AWS Architecture](./architecture-aws.drawio.png)

### 3.1 Application load balancer

An Application load balancer typed gateway with three targets:

- **question-set-loader** (*Lambda*) - Receives multipart/form-data at `POST /question-set-upload`. This facilatates client-side file upload. Note the maximum file upload + overhead is [1MB](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/lambda-functions.html) as per limitations of this target type. With an API Gateway + Lambda integration this could increase to [10MB](https://docs.aws.amazon.com/apigateway/latest/developerguide/limits.html).
- **speed-run** (*Fargate*)- Receives `GET /speedrun` requests which get upgraded to WebSocket connections.
- **sign-on** (*Fargate*) - Receives `/signon` requests

### 3.2 Question Set Loader
A lambda function that receives mutlipart/form-data from the the API gateway, processes it then writes it to Question Set Store (EFS). There is a 1MB limit on the uploaded file size.

### 3.3 Question Set Store
An EFS file share mounted into each ECS.

### 3.4 speed-run Fargate Cluster
Application load balancer with multiple elastic scaling *speed-run* service containers. Each has the *Question Set Store* EFS mounted. *speed-run* persists current running speed-run state to *speed-run State* (Redis). On completion, sends a job to *Completion Job Queue*.

See [message protocol spec](docs/message-protocol.md) for the messages sent between the host/participants and speed-run instances.

### 3.5 speed-run Cache
An elasticached redis instance that stores state of in-progress speedruns. Also has a pub-sub mechanism for keeping all `speed-run` instances for a particular quiz session in sync.

### 3.6 speed-run Reporter
Lamda function that gets triggered when jobs are written to the *Completion Job Queue* (SQS standard queue). It extacts and loads the elasticache speed-run state into *speed-run Store*

### 3.7 speed-run Store
DynamoDB instance(s) for long term persistant store of completed speedruns.

### 3.8 sign-on
Facilitates hosts creating multiple choice speedruns and participants joining them. Initialises speedrun state in *speed-run State*. This service is anticipated to experience less load than *speed-run* services hence less instances in the cluster.

### 3.9 CloudFront
Serves static assets from S3, reverse-proxies requests to API gateway via AWS backbone network.

Will be something similar to: https://www.rehanvdm.com/blog/cloudfront-reverse-proxy-api-gateway-to-prevent-cors

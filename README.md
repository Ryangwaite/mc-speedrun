# mc-speedrun

- [1. Overview](#1-overview)
- [2. AWS Architecture](#2-aws-architecture)
  - [2.x API Gateway](#2x-api-gateway)
  - [2.1 Question Set Loader](#21-question-set-loader)
  - [2.2 Question Set Store](#22-question-set-store)
  - [2.3 speed-run Fargate Cluster](#23-speed-run-fargate-cluster)
  - [2.4 speed-run State](#24-speed-run-state)
  - [2.5 speed-run Reporter](#25-speed-run-reporter)
  - [2.6 speed-run Store](#26-speed-run-store)
  - [2.7 sign-on](#27-sign-on)
  - [2.8 CloudFront](#28-cloudfront)
## 1. Overview
Web app for competing with others in multi-choice quizzes where the fastest most accurate wins.

This was created as a way to reinforce the knowledge acquired in studying for the AWS SAA-C02 exam.


## 2. AWS Architecture
![AWS Architecture](docs/architecture-aws.drawio.png)

### 2.x API Gateway 

An *HTTP API* typed gateway with three integrations:

- **question-set-loader** - Receives multipart/form-data at `POST /question-set-upload`. This facilatates client-side file upload.
- **speed-run Service Fargate Cluster** - Receives `GET /speedrun` requests which get upgraded to WebSocket connections.
- **sign-on** - Receives `/signon` requests

### 2.1 Question Set Loader
A lambda function that receives mutlipart/form-data from the the API gateway, processes it then writes it to Question Set Store (EFS) 

### 2.2 Question Set Store
An EFS file share mounted into each ECS.

### 2.3 speed-run Fargate Cluster
Application load balancer with multiple elastic scaling *speed-run* service containers. Each has the *Question Set Store* EFS mounted. *speed-run* persists current running speed-run state to *speed-run State* (Redis). On completion, sends a job to *Completion Job Queue*.

### 2.4 speed-run State
An elasticached redis instance that stores state of in-progress speedruns.

### 2.5 speed-run Reporter
Lamda function that gets triggered when jobs are written to the *Completion Job Queue* (SQS standard queue). It extacts and loads the elasticache speed-run state into *speed-run Store*

### 2.6 speed-run Store
DynamoDB instance(s) for long term persistant store of completed speedruns.

### 2.7 sign-on
Facilitates hosts creating multiple choice speedruns and participants joining them. Initialises speedrun state in *speed-run State*. This service is anticipated to experience less load than *speed-run* services hence less instances in the cluster.

### 2.8 CloudFront
Serves static assets from S3, reverse-proxies requests to API gateway via AWS backbone network.

Will be something similar to: https://www.rehanvdm.com/blog/cloudfront-reverse-proxy-api-gateway-to-prevent-cors
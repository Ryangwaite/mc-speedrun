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
- [Useful commands](#useful-commands)
- [Steps to create the cross account delegation role for Route 53 in the parent account and grant access to the sub account](#steps-to-create-the-cross-account-delegation-role-for-route-53-in-the-parent-account-and-grant-access-to-the-sub-account)

## 1. Setup

 a) Before deploying to aws, the following needs to be installed:
- [AWS CDK](https://docs.aws.amazon.com/cdk/v2/guide/getting_started.html#getting_started_install)
- [AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install-linux.html)

 b) Follow these [steps](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-quickstart.html#cli-configure-quickstart-creds-create#cli-configure-quickstart-creds) to download a new key pair for programmatic access to AWS.

 c) Run `make init` and configure `.env` with all the relevant details.


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


----------------------------------
# This was from a nested README. TODO: combine it all into this README properly:



# Welcome to your CDK TypeScript project

This is a blank project for CDK development with TypeScript.

The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Useful commands

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `cdk deploy`      deploy this stack to your default AWS account/region
* `cdk diff`        compare deployed stack with current state
* `cdk synth`       emits the synthesized CloudFormation template


## Steps to create the cross account delegation role for Route 53 in the parent account and grant access to the sub account

1. In the parent account, create a new IAM role where the trusted entity type is "AWS Account"
2. Check the "Another AWS account" radio button and enter the ID of the sub account
3. Leave options unchecked and press "next"
4. Don't attach any permissions and press "next" again
5. For the role name enter "mcspeedrun-route53-delagation-role", followed by "Create role"
6. Click on the role, scroll down, click "Add permissions" drop down followed by "Create inline policy"
7. Switch to the JSON editor and input:
    ```json
    {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Action": "route53:ChangeResourceRecordSets",
                "Resource": "arn:aws:route53:::hostedzone/<REPLACE WITH YOUR ZONE ID>"
            },
            {
                "Effect": "Allow",
                "Action": "route53:ListHostedZonesByName",
                "Resource": "*"
            }
        ]
    }
    ```
8. Click "Review policy"
9. Input a name and click "Create policy"

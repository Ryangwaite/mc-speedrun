# AWS
- [1. Usage](#1-usage)
  - [1.1 Setup](#11-setup)
  - [1.2 Deploying](#12-deploying)
  - [1.3 Destroying](#13-destroying)
  - [1.4 Cleanup](#14-cleanup)
- [2. Architecture](#2-architecture)
  - [2.1 Route53](#21-route53)
  - [2.2 CloudFront](#22-cloudfront)
  - [2.3 S3](#23-s3)
  - [2.4 Application Load Balancer (ALB)](#24-application-load-balancer-alb)
  - [2.5 Question Set Loader](#25-question-set-loader)
  - [2.6 Question Set Store](#26-question-set-store)
  - [2.7 speed-run](#27-speed-run)
  - [2.8 sign-on](#28-sign-on)
  - [2.9 Completion Job Queue](#29-completion-job-queue)
  - [2.10 speed-run Cache](#210-speed-run-cache)
  - [2.11 speed-run Reporter](#211-speed-run-reporter)
  - [2.12 speed-run Store](#212-speed-run-store)
- [3. Miscellaneous](#3-miscellaneous)
  - [3.1 `cdk` commands](#31-cdk-commands)

## 1. Usage
### 1.1 Setup

 a) Before deploying to aws, the following needs to be installed:
- [AWS CDK](https://docs.aws.amazon.com/cdk/v2/guide/getting_started.html#getting_started_install)
- [AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install-linux.html)

 b) Follow these [steps](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-quickstart.html#cli-configure-quickstart-creds-create#cli-configure-quickstart-creds) to download a new key pair for programmatic access to AWS.

 c) Run `make init`

 d) Create a cross account delegation role for Route 53 in the parent account and grant access to the sub account as follows:

  1. In the parent account, create a new IAM role where the trusted entity type is "AWS Account"
  2. Check the "Another AWS account" radio button and enter the ID of the sub account
  3. Leave options unchecked and press "next"
  4. Don't attach any permissions and press "next" again
  5. For the role name enter "mcspeedrun-route53-delagation-role", followed by "Create role"
  6. Click on the role, scroll down, click "Add permissions" drop down followed by "Create inline policy"
  7. Switch to the JSON editor and input:
    ```
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
  9.  Input a name and click "Create policy"
 
 e) Configure `.env` with all the relevant details.

 f) Bootstrap the AWS account for cdk deployment with `make bootstrap`


### 1.2 Deploying

Run `make deploy` or if you want continuous observation of file changes and deployment run `make watch`.

### 1.3 Destroying

To destroy all application resources run `make destroy`.

### 1.4 Cleanup

Destroying the AWS resources will clean up the majority of the Account, however there are still a few remaining things.

To delete the resources involved in bootstrapping the environment run `make unbootstrap`

## 2. Architecture
![AWS Architecture](./architecture-aws.drawio.png)

### 2.1 Route53
The root account contains a hosted zone which is authoritative for the domain `example.com` (specify real value in `.env` to `PARENT_ZONE_DOMAIN_NAME`). There is also a delegation role that the Mc-Speedrun account can use for adding records to the zone.

At deploy time, a Route53 hosted zone is created in the Mc-speedrun account which is authoritative for the domain `mcspeedrun.example.com` and the Parent accounts delegation role is used to add NS records that points the parent domain zone to the subdomain name servers.

### 2.2 CloudFront

Uses a certificate from Certificate Manager with DNS validation against the `mcspeedrun.example.com` hosted zone to support HTTPS connections from clients.

The distribution has two origins. The first is for the static assets in S3, and the second is for dynamic assets served by the Application Load Balancer. TLS termination occurrs here, before the request is proxied along over HTTP.

### 2.3 S3

The UI static assets are served from here.

It is currently configured as a public website, so can be accessed via the http based public URL. Since this is a public site CloudFront treats this as an HTTP origin. 

TODO: Switch cloudfront to use origin access control. This way the S3 website will no longer be configured as a public website so all access to the assets are through cloudfront only.

### 2.4 Application Load Balancer (ALB)

The ALB is responsible for proxying dynamic requests to backend services. There are three downstream targets, where the specific target is decided based on the URL path. The matching logic is as follows:

- `/api/upload/*` ->  *question-set-loader* (*Lambda*)
- `/api/speed-run/*` -> *speed-run* (*HTTP/Fargate*)
- `/api/sign-on/*` -> *sign-on* (*HTTP/Fargate*)

TODO: Similar to the S3 origin deployment, the ALB is public internet facing so requests can go directly to the load-balancer and bypass cloudfront altogether. This was to facilitate easier debugging. The scheme of the ALB should be switched to "Internal" to prevent this.

### 2.5 Question Set Loader

A lambda function that receives question sets as mutlipart/form-data from the API gateway, processes it then writes it to Question Set Store (EFS). There is a 1MB limit on the uploaded file size.

Note the maximum file upload + overhead is [1MB](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/lambda-functions.html) as per limitations of this target type. With an API Gateway + Lambda integration this could increase to [10MB](https://docs.aws.amazon.com/apigateway/latest/developerguide/limits.html). Regardless, 1MB is sufficient to receive fairly large quizzes (~5000 questions long).

The lambda uses an execution role with permissions to mount and write to the EFS access point.

### 2.6 Question Set Store

An EFS file share with a single access point. *speed-run*, *question-set-loader* and *quiz-result-loader* all mount it via the access point.

### 2.7 speed-run

Deployed to AWS fargate with the *Question Set Store* mounted as a volume. The containers run under an ECS service scheduler which maintains two concurrent running instances of the service. This ensures that if one task terminates, clients can reconnect to the other one, meanwhile the service scheduler will launch a replacement instance. The instances form a target group which the *ALB* load balances across.

The instances use an iam task role (not execution - that's for executing ECS actions like pulling the image) that has permissions to send messages to *Completion Job Queue*.

For conveniance, these task instances share a Fargate cluster with *sign-on*.

### 2.8 sign-on

Deployed to the same fargate cluster as *speed-run*, with it's own service scheduler and load balancing target that the *ALB * load balances across. The desired count of running instances is set to one which is fine for a proof-of-concept, but if desired, it can be increased at an additional cost.

The instance uses an iam task role that doesn't require any permissions.

### 2.9 Completion Job Queue

An SQS FIFO queue that is written to by the *speed-run* instances and read from by the *quiz result loader*. A FIFO queue is used as oppossed to a standard queue since the *quiz result loader* (consumer) does not currently support receiving the same message twice. Only FIFO queues provide exactly-once processing.

### 2.10 speed-run Cache

An elasticached redis instance facilitating the state of in-progress speedruns and providing a pub-sub mechanism for keeping all `speed-run` instances for a particular quiz session in sync.

### 2.11 speed-run Reporter

A lambda function that is triggered when a message is enqueued in *Completion Job Queue*. Upon receiving, it extracts the data from *speed-run cache* and *Question Set Store*, transforms it and loads it into *speed-run Store*.

It's execution role requires permissions to mount EFS filesystems, receive and delete messages from SQS and write to DynamoDB.

### 2.12 speed-run Store

A single DynamoDB standard table configured with "Provisioned" capacity mode. This capacity mode is sufficient and cheap (free-tier eligible).


## 3. Miscellaneous
### 3.1 `cdk` commands

The `cdk` can be called directly without having to go through `Make` however sourcing the environment credentials must be done manually. Sample commands are:

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `cdk deploy`      deploy this stack to your default AWS account/region
* `cdk diff`        compare deployed stack with current state
* `cdk synth`       emits the synthesized CloudFormation template

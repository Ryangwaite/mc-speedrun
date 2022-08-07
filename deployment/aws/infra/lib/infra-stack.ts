import { Duration, RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elb from 'aws-cdk-lib/aws-elasticloadbalancingv2'
import * as elbtargets from 'aws-cdk-lib/aws-elasticloadbalancingv2-targets'
import * as efs from 'aws-cdk-lib/aws-efs'
import * as ecs from 'aws-cdk-lib/aws-ecs'
import * as sqs from 'aws-cdk-lib/aws-sqs'
import {CfnOutput} from 'aws-cdk-lib';

const QUESTION_SET_LOADER_ENV_VAR_PREFIX = "MC_SPEEDRUN_"

// TODO: Pass these in through secrets manager
const JWT_SECRET = "secret"
const JWT_AUDIENCE = "http://0.0.0.0/"
const JWT_ISSUER = "http://sign-on/"

export class InfraStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    ////// VPC //////

    const vpc = new ec2.Vpc(this, 'Vpc', {
      cidr: "10.16.0.0/16", // Avoids common ranges and is a nice clean base 2 number
      maxAzs: 2,
      subnetConfiguration: [
        {
          name: "application",
          cidrMask: 24,
          subnetType: ec2.SubnetType.PUBLIC, // TODO: Check this once ALB is in use
        },
        {
          name: "data",
          cidrMask: 24,
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED
        }
      ]
    })

    // TODO: So that the ECS Fargate can pull from ECR without going through the public internet
    // AWS PrivateLink endpoints need to be configured in the VPC
    // See: https://stackoverflow.com/a/66802973

    ////// ECS Fargate //////
    const ecsCluster = new ecs.Cluster(this, "Cluster", {
      vpc: vpc,
    })

    ////// Question Set Store //////
    // const questionSetStore = new efs.FileSystem(this, "QuestionSetStore", {
    //   vpc: vpc,
    //   vpcSubnets: {subnets: vpc.isolatedSubnets},
    //   performanceMode: efs.PerformanceMode.GENERAL_PURPOSE,
    //   throughputMode: efs.ThroughputMode.BURSTING,
    //   removalPolicy: RemovalPolicy.DESTROY,

    // })
    // // TODO: Doesn't look like there are any mount targets available??

    // ////// Question Set Loader //////
    // const questionSetStoreLoaderAP = questionSetStore.addAccessPoint("QuestionSetLoaderAccessPoint", {
    //   // NOTE: Even though there is only one type of data stored in EFS and we could theoretically use
    //   // the root path, the permissions are unable to be changed so that a non-root user can write to
    //   // it. Instead, the /quizzes directory is created with permissions that enable non-root users to
    //   // write to it.
    //   path: "/quizzes",
    //   createAcl: {
    //     ownerUid: "1001",
    //     ownerGid: "1001",
    //     permissions: "750", // Corresponds to: u+rwx,g+rx
    //   },
    //   posixUser: {
    //     uid: "1001",  // TODO: Paramaterize these
    //     gid: "1001",
    //   },
    // })

    // const quizDirPath = "/mnt/quizzes"
    // const questionSetLoaderLambda = new lambda.Function(this, "QuestionSetLoader", {
    //   filesystem: lambda.FileSystem.fromEfsAccessPoint(questionSetStoreLoaderAP, quizDirPath),
    //   vpc: vpc, // Put in data subnets and create a Security Group. TODO: Move to application subnets
    //   runtime: lambda.Runtime.GO_1_X,
    //   code: lambda.Code.fromAsset("../../../question-set-loader/", {
    //     bundling: {
    //       image: lambda.Runtime.GO_1_X.bundlingImage,
    //       user: "root",
    //       command: ["make", "cdk-lambda-build"],
    //     }
    //   }),
    //   handler: "lambda",
    //   environment: {
    //     [`${QUESTION_SET_LOADER_ENV_VAR_PREFIX}LOADER_DST_DIR`]: quizDirPath,
    //     [`${QUESTION_SET_LOADER_ENV_VAR_PREFIX}JWT_SECRET`]: JWT_SECRET,
    //     [`${QUESTION_SET_LOADER_ENV_VAR_PREFIX}JWT_AUDIENCE`]: JWT_AUDIENCE,
    //     [`${QUESTION_SET_LOADER_ENV_VAR_PREFIX}JWT_ISSUER`]: JWT_ISSUER,
    //   },
    // })

    // ////// Sign On //////
    // const signOnPort = 80
    // const signOnTaskDefinition = new ecs.FargateTaskDefinition(this, "SignOnTask", {
    //   cpu: 256,
    //   memoryLimitMiB: 512,
    // })
    // const signOnContainer = signOnTaskDefinition.addContainer("SignOnContainer", {
    //   image: ecs.ContainerImage.fromAsset("../../../sign-on/", {
    //     file: "Dockerfile",
    //   }),
    //   portMappings: [{
    //     containerPort: signOnPort,
    //     hostPort: signOnPort,
    //     protocol: ecs.Protocol.TCP,
    //   }],
    //   environment: {
    //     JWT_SECRET,
    //     JWT_AUDIENCE,
    //     JWT_ISSUER,
    //     SIGN_ON_PORT: signOnPort.toString(),
    //   },
    //   logging: ecs.LogDrivers.awsLogs({
    //     streamPrefix: "mc-speedrun",
    //   })
    // })

    // const signOnService = new ecs.FargateService(this, "SignOnService", {
    //   vpcSubnets: {subnets: vpc.publicSubnets},
    //   assignPublicIp: true, // Enables it to route through the internet gateway through to ECR to pull the image
    //   cluster: ecsCluster,
    //   taskDefinition: signOnTaskDefinition,
    //   desiredCount: 1,  // TODO: Tune tasks count
    // })

    ////// Completion Job Queue //////
    const completionJobQ = new sqs.Queue(this, "CompletionJobQueue", {
      fifo: true, // TODO: Confirm if client requires this
      // This is a single-producer/consumer system where each msg body is unique
      contentBasedDeduplication: true,
    })

    ///// Speed Run Cache /////
    // TODO: This

    ///// Speed Run /////
    const speedRunPort = 80
    const speedRunTaskDefinition = new ecs.FargateTaskDefinition(this, "SpeedRunTask", {
      cpu: 256,
      memoryLimitMiB: 512,
    })
    completionJobQ.grantSendMessages(speedRunTaskDefinition.taskRole)
    const speedRunContainer = speedRunTaskDefinition.addContainer("SpeedRunContainer", {
      image: ecs.ContainerImage.fromAsset("../../../speed-run/", {
        file: "Dockerfile",
      }),
      portMappings: [{
        containerPort: speedRunPort,
        hostPort: speedRunPort,
        protocol: ecs.Protocol.TCP,
      }],
      environment: {
        JWT_SECRET,
        JWT_AUDIENCE,
        JWT_ISSUER,
        SPEED_RUN_PORT: speedRunPort.toString(),
        REDIS_HOST: "redis",    // TODO: pass in from elasticache
        REDIS_PORT: "6379",
        QUIZ_DIRECTORY: "/quiz-questions",
        NOTIFY_DESTINATION_TYPE: "sqs",
        NOTIFY_QUEUE_NAME: completionJobQ.queueName,
      },
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: "mc-speedrun",
      }),
    })

    const speedRunService = new ecs.FargateService(this, "SpeedRunService", {
      vpcSubnets: {subnets: vpc.publicSubnets},
      assignPublicIp: true, // Enables it to route through the internet gateway through to ECR to pull the image
      cluster: ecsCluster,
      taskDefinition: speedRunTaskDefinition,
      desiredCount: 1,  // TODO: Tune tasks count
    })


    ////// Application Load Balancer //////

    // const alb = new elb.ApplicationLoadBalancer(this, "ALB", {
    //   vpc: vpc,
    //   internetFacing: true, // TODO: Might need to change this once cloudfront is put in front
    //   vpcSubnets: {subnets: vpc.publicSubnets} // Load balancer across all public subnets
    // })

    // const listener = alb.addListener("Listener", {
    //   // TODO: Update for HTTPS
    //   port: 80,
    //   protocol: elb.ApplicationProtocol.HTTP,
    //   open: true, // Allow anyone on the internet to reach it. TODO: Look into restricting this once cloudfront is in front
    //   defaultAction: elb.ListenerAction.fixedResponse(404, {
    //     contentType: "text/html",
    //     messageBody: "<h1>Nothing here</h1>", // TODO: Make a proper not found page
    //   })
    // })

    // const questionSetLoaderTarget = listener.addTargets("/upload", {
    //   priority: 10,
    //   conditions: [
    //     elb.ListenerCondition.pathPatterns(["/upload/*"]),
    //   ],
    //   targets: [
    //     new elbtargets.LambdaTarget(questionSetLoaderLambda)
    //   ],
    //   // TODO: Enable health checks
    // })
    // // Populates the "multiValueHeaders" attribute in the ALBTargetGroupRequest sent from the ALB
    // // as opposed to the "headers" attribute.
    // questionSetLoaderTarget.setAttribute("lambda.multi_value_headers.enabled", "true")

    // const signOnTarget = listener.addTargets("/sign-on", {
    //   priority: 11,
    //   protocol: elb.ApplicationProtocol.HTTP,
    //   conditions: [
    //     elb.ListenerCondition.pathPatterns(["/sign-on/*"]),
    //   ],
    //   targets: [
    //     signOnService.loadBalancerTarget({
    //       containerName: signOnContainer.containerName,
    //       containerPort: signOnPort,
    //       protocol: ecs.Protocol.TCP,
    //     })
    //   ],
    //   healthCheck: {
    //     path: "/ping",
    //     healthyHttpCodes: "200",
    //     // NOTE: For consistency, these should match that of the Docker containers HEALTHCHECK
    //     interval: Duration.seconds(5),
    //     timeout: Duration.seconds(2),
    //     unhealthyThresholdCount: 3, // corresponds to --retries for Docker
    //   }
    // })

    // new CfnOutput(this, "ALBPublicDnsName", {
    //   exportName: "ALB-DNS-name",
    //   description: "The public DNS name to reach the ALB",
    //   value: alb.loadBalancerDnsName,
    // })
  }
}

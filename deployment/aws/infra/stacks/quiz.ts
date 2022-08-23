import { CfnOutput, Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs'
import * as sqs from 'aws-cdk-lib/aws-sqs'
import { QuestionSetStore } from "../constructs/question-set-store";
import { QuestionSetLoader } from "../constructs/question-set-loader";
import { Jwt } from "../types";
import { SignOn } from "../constructs/sign-on";
import { SpeedRunCache } from "../constructs/speed-run-cache";
import { AppLoadBalancer } from "../constructs/app-load-balancer";
import { SpeedRun } from "../constructs/speed-run";
import { Frontend } from "../constructs/frontend";
import { CloudfrontDistro } from "../constructs/cloudfront";

interface QuizStackProps extends StackProps {
    vpc: ec2.IVpc
}

// TODO: Pass these in through secrets manager
const JWT: Jwt = {
    secret: "secret",
    audience: "http://0.0.0.0/",
    issuer: "http://sign-on/",
}


/**
 * Stack for bringing up all resources needed to run a quiz end-to-end
 */
export class QuizStack extends Stack {
    constructor(scope: Construct, id: string, props: QuizStackProps) {
        super(scope, id, props);

        // TODO: So that the ECS Fargate can pull from ECR without going through the public internet
        // AWS PrivateLink endpoints need to be configured in the VPC
        // See: https://stackoverflow.com/a/66802973

        const ecsCluster = new ecs.Cluster(this, "Cluster", {
            vpc: props.vpc,
        })

        const questionSetStore = new QuestionSetStore(this, "QuestionSetStore", {
            vpc: props.vpc,
        })

        const questionSetLoader = new QuestionSetLoader(this, "QuestionSetLoader", {
            vpc: props.vpc,
            questionSetStoreAccessPoint: questionSetStore.accessPoint,
            jwt: JWT,
        })

        const signOn = new SignOn(this, "SignOn", {
            vpc: props.vpc,
            ecsCluster: ecsCluster,
            jwt: JWT,
        })

        const speedRunCache = new SpeedRunCache(this, "SpeedRunCache", {
            vpc: props.vpc,
            vpcSubnets: { subnets: props.vpc.isolatedSubnets },
            redisPort: 6379,
        })

        const completionJobQ = new sqs.Queue(this, "CompletionJobQueue", {
            fifo: true, // TODO: Confirm if client requires this
            // This is a single-producer/consumer system where each msg body is unique
            contentBasedDeduplication: true,
        })

        const speedRun = new SpeedRun(this, "SpeedRun", {
            vpc: props.vpc,
            completionJobQ: completionJobQ,
            questionSetStore: questionSetStore,
            speedRunCache: speedRunCache,
            ecsCluster: ecsCluster,
            jwt: JWT
        })

        const appLoadBalancer = new AppLoadBalancer(this, "ApplicationLoadBalancer", {
            vpc: props.vpc,
            questionSetLoaderLambda: questionSetLoader.lambda,
            signOn: {
                service: signOn.service,
                containerName: signOn.containerName,
                containerPort: signOn.containerPort,
            },
            speedRun: {
                service: speedRun.service,
                containerName: speedRun.containerName,
                containerPort: speedRun.containerPort,
            }
        })

        new CfnOutput(this, "ALBPublicDnsName", {
            exportName: "ALB-DNS-name",
            description: "The public DNS name to reach the ALB",
            value: appLoadBalancer.loadBalancerDnsName,
        })

        const frontend = new Frontend(this, "Frontend", {})

        const distribution = new CloudfrontDistro(this, "CloudfrontDistrubution", {
            frontendBucket: frontend.bucket,
            loadBalancer: appLoadBalancer.loadBalancer
        })

        new CfnOutput(this, "CloudfrontDnsAddress", {
            exportName: "CF-DNS-name",
            description: "The public DNS name to reach the cloudfront distribution",
            value: `https://${distribution.domainName}`,
        })
    }
}
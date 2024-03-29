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
import { SpeedRunStore } from "../constructs/speed-run-store";
import { QuizResultLoader } from "../constructs/quiz-result-loader";
import { HostedZone } from "../constructs/hosted-zone";

interface QuizStackProps extends StackProps {
    vpc: ec2.IVpc,
    // The Route53 zone backed resource encapsulating the domain name
    hostedZone: HostedZone,
    jwt: Jwt,
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
            jwt: props.jwt,
        })

        const signOn = new SignOn(this, "SignOn", {
            vpc: props.vpc,
            ecsCluster: ecsCluster,
            jwt: props.jwt,
        })

        const speedRunCache = new SpeedRunCache(this, "SpeedRunCache", {
            vpc: props.vpc,
            vpcSubnets: { subnets: props.vpc.isolatedSubnets },
            redisPort: 6379,
        })

        const completionJobQueue = new sqs.Queue(this, "CompletionJobQueue", {
            fifo: true, // TODO: Confirm if client requires this
            // This is a single-producer/consumer system where each msg body is unique
            contentBasedDeduplication: true,
        })

        const speedRun = new SpeedRun(this, "SpeedRun", {
            vpc: props.vpc,
            completionJobQ: completionJobQueue,
            questionSetStore: questionSetStore,
            speedRunCache: speedRunCache,
            ecsCluster: ecsCluster,
            jwt: props.jwt,
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

        new CloudfrontDistro(this, "CloudfrontDistrubution", {
            frontendBucket: frontend.bucket,
            loadBalancer: appLoadBalancer.loadBalancer,
            r53HostedZone: props.hostedZone.r53HostedZone,
        })

        new CfnOutput(this, "CloudfrontDnsAddress", {
            exportName: "CF-DNS-name",
            description: "The public DNS name to reach the cloudfront distribution",
            value: `https://${props.hostedZone.r53HostedZone.zoneName}`,
        })

        const speedRunStore = new SpeedRunStore(this, "SpeedRunStore", {
            vpc: props.vpc,
        })

        new QuizResultLoader(this, "QuizResulLoader", {
            questionSetStoreAccessPoint: questionSetStore.accessPoint,
            vpc: props.vpc,
            completionJobQ: completionJobQueue,
            speedRunCache: speedRunCache,
            speedRunStore: speedRunStore,
        })
    }
}
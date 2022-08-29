import { Construct } from "constructs";
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambda_event_src from 'aws-cdk-lib/aws-lambda-event-sources'
import * as efs from 'aws-cdk-lib/aws-efs'
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as sqs from 'aws-cdk-lib/aws-sqs'
import * as iam from 'aws-cdk-lib/aws-iam'
import { SpeedRunCache } from "./speed-run-cache";
import { Duration } from "aws-cdk-lib";
import { SpeedRunStore } from "./speed-run-store";

export interface QuizResultLoaderProps {
    vpc: ec2.IVpc
    questionSetStoreAccessPoint: efs.IAccessPoint
    completionJobQ: sqs.IQueue
    speedRunCache: SpeedRunCache
    speedRunStore: SpeedRunStore
}

export class QuizResultLoader extends Construct {

    constructor(scope: Construct, id: string, props: QuizResultLoaderProps) {
        super(scope, id)

        const quizDirPath = "/mnt/quizzes"
        const lambdaFunc = new lambda.Function(this, "QuizResultLoader", {
            filesystem: lambda.FileSystem.fromEfsAccessPoint(props.questionSetStoreAccessPoint, quizDirPath),
            vpc: props.vpc,
            vpcSubnets: { subnets: props.vpc.isolatedSubnets },
            runtime: lambda.Runtime.GO_1_X,
            code: lambda.Code.fromAsset("../../../quiz-result-loader/", {
                bundling: {
                    image: lambda.Runtime.GO_1_X.bundlingImage,
                    user: "root",
                    command: ["make", "cdk-lambda-build"],
                }
            }),
            handler: "lambda",
            timeout: Duration.seconds(30),
            environment: {
                QUESTION_SET_PATH: quizDirPath,
                REDIS_HOST: props.speedRunCache.clusterEndpointAddress,
                REDIS_PORT: props.speedRunCache.clusterEndpointPort,
            },
        })
        lambdaFunc.addEventSource(new lambda_event_src.SqsEventSource(props.completionJobQ, {
            batchSize: 10,
            enabled: true,
            reportBatchItemFailures: true,
        }))

        props.speedRunStore.table.grantWriteData(lambdaFunc)
        // Grant privilege to query all tables to see if it exists
        lambdaFunc.addToRolePolicy(new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            resources: ["arn:aws:lambda::::*"],
            actions: [
                "dynamodb:listTables",
            ],
        }))
    }
}
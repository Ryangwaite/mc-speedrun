import { Construct } from "constructs";
import * as ecs from 'aws-cdk-lib/aws-ecs'
import { QuestionSetStore } from "./question-set-store";
import * as sqs from 'aws-cdk-lib/aws-sqs'
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Jwt } from "../types";
import { SpeedRunCache } from "./speed-run-cache";

export interface SpeedRunProps {
    questionSetStore: QuestionSetStore
    completionJobQ: sqs.IQueue
    speedRunCache: SpeedRunCache
    jwt: Jwt
    vpc: ec2.IVpc
    ecsCluster: ecs.ICluster,
}

export class SpeedRun extends Construct {

    public readonly service: ecs.FargateService
    public readonly containerName: string
    public readonly containerPort: number

    constructor(scope: Construct, id: string, props: SpeedRunProps) {
        super(scope, id)

        const speedRunPort = 80
        const speedRunTaskDefinition = new ecs.FargateTaskDefinition(this, "SpeedRunTask", {
            cpu: 256,
            memoryLimitMiB: 512,
        })
        speedRunTaskDefinition.addVolume({
            name: "question-set-store",
            efsVolumeConfiguration: {
                fileSystemId: props.questionSetStore.fileSystemId,
                transitEncryption: "ENABLED",
                authorizationConfig: {
                    accessPointId: props.questionSetStore.accessPoint.accessPointId,
                }
            },
        })
        props.completionJobQ.grantSendMessages(speedRunTaskDefinition.taskRole)

        const speedRunContainer = speedRunTaskDefinition.addContainer("SpeedRunContainer", {
            image: ecs.ContainerImage.fromAsset("../../speed-run/", {
                file: "Dockerfile",
                target: "AWS",
            }),
            portMappings: [{
                containerPort: speedRunPort,
                hostPort: speedRunPort,
                protocol: ecs.Protocol.TCP,
            }],
            environment: {
                JWT_SECRET: props.jwt.secret,
                JWT_AUDIENCE: props.jwt.audience,
                JWT_ISSUER: props.jwt.issuer,
                SPEED_RUN_PORT: speedRunPort.toString(),
                REDIS_HOST: props.speedRunCache.clusterEndpointAddress,
                REDIS_PORT: props.speedRunCache.clusterEndpointPort,
                QUIZ_DIRECTORY: "/quiz-questions",
                NOTIFY_DESTINATION_TYPE: "sqs",
                NOTIFY_QUEUE_NAME: props.completionJobQ.queueName,
            },
            logging: ecs.LogDrivers.awsLogs({
                streamPrefix: "mc-speedrun",
            }),
        })
        speedRunContainer.addMountPoints({
            containerPath: "/quiz-questions",
            readOnly: false,
            sourceVolume: "question-set-store", // Must match with the volume name on the task definition
        })

        this.containerName = speedRunContainer.containerName
        this.containerPort = speedRunContainer.containerPort

        this.service = new ecs.FargateService(this, "SpeedRunService", {
            vpcSubnets: { subnets: props.vpc.publicSubnets },
            assignPublicIp: true, // Enables it to route through the internet gateway through to ECR to pull the image
            cluster: props.ecsCluster,
            taskDefinition: speedRunTaskDefinition,
            desiredCount: 2,
        })
    }
}

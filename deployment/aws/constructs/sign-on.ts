import { Construct } from "constructs";
import * as ecs from 'aws-cdk-lib/aws-ecs'
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Jwt } from "../types";

export interface SignOnProps {
    jwt: Jwt,
    ecsCluster: ecs.ICluster,
    vpc: ec2.IVpc,
}

export class SignOn extends Construct {

    public readonly service: ecs.FargateService
    public readonly containerName: string
    public readonly containerPort: number

    constructor(scope: Construct, id: string, props: SignOnProps) {
        super(scope, id)

        const signOnPort = 80
        const signOnTaskDefinition = new ecs.FargateTaskDefinition(this, "SignOnTask", {
            cpu: 256,
            memoryLimitMiB: 512,
        })
        const signOnContainer = signOnTaskDefinition.addContainer("SignOnContainer", {
            image: ecs.ContainerImage.fromAsset("../../sign-on/", {
                file: "Dockerfile",
            }),
            portMappings: [{
                containerPort: signOnPort,
                hostPort: signOnPort,
                protocol: ecs.Protocol.TCP,
            }],
            environment: {
                JWT_SECRET: props.jwt.secret,
                JWT_AUDIENCE: props.jwt.audience,
                JWT_ISSUER: props.jwt.issuer,
                SIGN_ON_PORT: signOnPort.toString(),
            },
            logging: ecs.LogDrivers.awsLogs({
                streamPrefix: "mc-speedrun",
            })
        })
        this.containerName = signOnContainer.containerName
        this.containerPort = signOnContainer.containerPort

        this.service = new ecs.FargateService(this, "SignOnService", {
            vpcSubnets: { subnets: props.vpc.publicSubnets },
            assignPublicIp: true, // Enables it to route through the internet gateway through to ECR to pull the image
            cluster: props.ecsCluster,
            taskDefinition: signOnTaskDefinition,
            desiredCount: 1,  // TODO: Tune tasks count
        })
    }
}
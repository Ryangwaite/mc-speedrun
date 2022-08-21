import { Construct } from "constructs";
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elb from 'aws-cdk-lib/aws-elasticloadbalancingv2'
import * as elbtargets from 'aws-cdk-lib/aws-elasticloadbalancingv2-targets'
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as ecs from 'aws-cdk-lib/aws-ecs'
import { Duration } from "aws-cdk-lib";

export interface AppLoadBalancerProps {
    vpc: ec2.IVpc,
    questionSetLoaderLambda: lambda.IFunction,
    signOn: {
        service: ecs.FargateService,
        containerName: string,
        containerPort: number,
    },
    speedRun: {
        service: ecs.FargateService,
        containerName: string,
        containerPort: number,
    }
}

export class AppLoadBalancer extends Construct {

    public readonly loadBalancerDnsName: string

    constructor(scope: Construct, id: string, props: AppLoadBalancerProps) {
        super(scope, id)

        const alb = new elb.ApplicationLoadBalancer(this, "ALB", {
            vpc: props.vpc,
            internetFacing: true, // Required to serve as an origin for the cloudfront distribution
            vpcSubnets: { subnets: props.vpc.publicSubnets } // Load balancer across all public subnets
        })

        this.loadBalancerDnsName = alb.loadBalancerDnsName

        const listener = alb.addListener("Listener", {
            // TODO: Update for HTTPS
            port: 80,
            protocol: elb.ApplicationProtocol.HTTP,
            open: true, // Allow anyone on the internet to reach it. TODO: Look into restricting this once cloudfront is in front
            defaultAction: elb.ListenerAction.fixedResponse(404, {
                contentType: "text/html",
                messageBody: "<h1>Nothing here</h1>", // TODO: Make a proper not found page
            })
        })

        const questionSetLoaderTarget = listener.addTargets("/upload", {
            priority: 10,
            conditions: [
                elb.ListenerCondition.pathPatterns(["/upload/*"]),
            ],
            targets: [
                new elbtargets.LambdaTarget(props.questionSetLoaderLambda)
            ],
            // TODO: Enable health checks
        })
        // Populates the "multiValueHeaders" attribute in the ALBTargetGroupRequest sent from the ALB
        // as opposed to the "headers" attribute.
        questionSetLoaderTarget.setAttribute("lambda.multi_value_headers.enabled", "true")

        const signOnTarget = listener.addTargets("/sign-on", {
            priority: 11,
            protocol: elb.ApplicationProtocol.HTTP,
            conditions: [
                elb.ListenerCondition.pathPatterns(["/sign-on/*"]),
            ],
            targets: [
                props.signOn.service.loadBalancerTarget({
                    containerName: props.signOn.containerName,
                    containerPort: props.signOn.containerPort,
                    protocol: ecs.Protocol.TCP,
                })
            ],
            healthCheck: {
                path: "/ping",
                healthyHttpCodes: "200",
                // NOTE: For consistency, these should match that of the Docker containers HEALTHCHECK
                interval: Duration.seconds(5),
                timeout: Duration.seconds(2),
                unhealthyThresholdCount: 3, // corresponds to --retries for Docker
            }
        })

        const speedRunTarget = listener.addTargets("/speed-run", {
            priority: 12,
            protocol: elb.ApplicationProtocol.HTTP,
            conditions: [
                elb.ListenerCondition.pathPatterns(["/speed-run/*"]),
            ],
            targets: [
                props.speedRun.service.loadBalancerTarget({
                    containerName: props.speedRun.containerName,
                    containerPort: props.speedRun.containerPort,
                    protocol: ecs.Protocol.TCP,
                })
            ],
            healthCheck: {
                path: "/ping",
                healthyHttpCodes: "200",
                // NOTE: For consistency, these should match that of the Docker containers HEALTHCHECK
                interval: Duration.seconds(5),
                timeout: Duration.seconds(2),
                unhealthyThresholdCount: 3, // corresponds to --retries for Docker
            }
        })
    }
}
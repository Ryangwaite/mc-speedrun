import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elb from 'aws-cdk-lib/aws-elasticloadbalancingv2'
import * as elbtargets from 'aws-cdk-lib/aws-elasticloadbalancingv2-targets'

export class InfraStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    ////// Lambda //////

    const questionSetLoaderLambda = new lambda.Function(this, "QuestionSetLoader", {
      runtime: lambda.Runtime.GO_1_X,
      code: lambda.Code.fromAsset("../../../question-set-loader/", {
        bundling: {
          image: lambda.Runtime.GO_1_X.bundlingImage,
          user: "root",
          command: ["make", "cdk-lambda-build"],
        }
      }),
      handler: "lambda"
    })

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

    ////// Application Load Balancer //////

    const alb = new elb.ApplicationLoadBalancer(this, "ALB", {
      vpc: vpc,
      internetFacing: true, // TODO: Might need to change this once cloudfront is put in front
      vpcSubnets: {subnets: vpc.publicSubnets} // Load balancer across all public subnets
    })

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

    listener.addTargets("/upload", {
      priority: 10,
      conditions: [
        elb.ListenerCondition.pathPatterns(["/upload"])
      ],
      targets: [
        new elbtargets.LambdaTarget(questionSetLoaderLambda)
      ],
      // TODO: Enable health checks
    })
  }
}

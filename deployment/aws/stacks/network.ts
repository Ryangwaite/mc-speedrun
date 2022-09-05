import { Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ec2 from 'aws-cdk-lib/aws-ec2';

/**
 * Stack for bringing up the network resources for MC-Speedrun
 */
export class NetworkStack extends Stack {

    public readonly vpc: ec2.IVpc

    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        this.vpc = new ec2.Vpc(this, 'Vpc', {
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
    }
}
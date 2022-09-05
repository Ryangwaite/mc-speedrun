import { Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import { HostedZone } from "../constructs/hosted-zone";

interface SubdomainStackProps extends StackProps {
    subdomainLabel: string
    parentAccountId: string
    parentAccountRoleName: string
    parentHostedZoneName: string
}

/**
 * Stack for bringing up all resources needed to run a quiz end-to-end
 */
export class SubdomainStack extends Stack {

    public readonly hostedZone: HostedZone

    constructor(scope: Construct, id: string, props: SubdomainStackProps) {
        super(scope, id, props);

        this.hostedZone = new HostedZone(this, "McSpeedrunHostedZone", {
            subdomainLabel: props.subdomainLabel,
            parentAccountId: props.parentAccountId,
            parentAccountRoleName: props.parentAccountRoleName,
            parentHostedZoneName: props.parentHostedZoneName,
        })
    }
}
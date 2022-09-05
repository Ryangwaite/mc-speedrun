import { Construct } from "constructs";
import * as route53 from "aws-cdk-lib/aws-route53"
import * as iam from 'aws-cdk-lib/aws-iam'
import { Stack } from "aws-cdk-lib";

export class HostedZoneProps {
    subdomainLabel: string
    parentAccountId: string
    parentAccountRoleName: string
    parentHostedZoneName: string
 }

/**
 * Creates a hosted zone for the subdomain in this account and points NS
 * records of a hosted zone in a parent account to this one.
 */
export class HostedZone extends Construct {

    public readonly r53HostedZone: route53.IHostedZone

    constructor(scope: Construct, id: string, props: HostedZoneProps) {
        super(scope, id);

        const domainName = props.subdomainLabel + "." + props.parentHostedZoneName
        this.r53HostedZone = new route53.PublicHostedZone(this, "McspeedrunHostedZone", {
            zoneName: domainName
        })

        // Import the delegation role from the parent account
        const delegationRoleArn = Stack.of(this).formatArn({
            region: "", // IAM is global
            service: "iam",
            account: props.parentAccountId,
            resource: "role",
            resourceName: props.parentAccountRoleName,
        })
        const delegationRole = iam.Role.fromRoleArn(this, "ParentAccountDelegationRole", delegationRoleArn)

        // Create the NS record in the parent account pointing to this sub account hosted zone
        new route53.CrossAccountZoneDelegationRecord(this, "ParentAccountDelegationRecord", {
            delegatedZone: this.r53HostedZone,
            parentHostedZoneName: props.parentHostedZoneName,
            delegationRole: delegationRole,
        })
    }
}
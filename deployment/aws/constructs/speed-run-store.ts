import { RemovalPolicy } from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb'
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

export interface SpeedRunStoreProps {
    vpc: ec2.IVpc
}

export class SpeedRunStore extends Construct {

    public readonly table: dynamodb.Table

    constructor(scope: Construct, id: string, props: SpeedRunStoreProps) {
        super(scope, id)

        this.table = new dynamodb.Table(this, "QuizTable", {
            billingMode: dynamodb.BillingMode.PROVISIONED,
            tableClass: dynamodb.TableClass.STANDARD,
            tableName: "quiz",
            partitionKey: {
                name: "id",
                type: dynamodb.AttributeType.STRING,
            },
            readCapacity: 1,
            writeCapacity: 1,
            removalPolicy: RemovalPolicy.DESTROY, // just to make cleanup easier, wouldn't want this for prod
        })

        // Allow it to be accessed without routing through the public internet
        props.vpc.addGatewayEndpoint("DynamoDBEndpoint", {
            service: ec2.GatewayVpcEndpointAwsService.DYNAMODB,
            subnets: [{subnets: props.vpc.isolatedSubnets}],
        })
    }
}

import { Construct } from "constructs";
import * as elasticache from 'aws-cdk-lib/aws-elasticache'
import * as ec2 from "aws-cdk-lib/aws-ec2";
export interface SpeedRunCacheProps {
    vpc: ec2.IVpc,
    vpcSubnets: ec2.SubnetSelection,
    redisPort: number,
}

/**
 * As of cdk version 2.29.1 there are no official constructs for elasticache, so this
 * is a construct aggregating all of the CloudFormation configuration in the interim
 *
 * Creates Redis Elasticache running in standalone node mode.
 */
export class SpeedRunCache extends Construct {

    public readonly clusterEndpointAddress: string
    public readonly clusterEndpointPort: string

    constructor(scope: Construct, id: string, props: SpeedRunCacheProps) {
        super(scope, id)

        // Notes
        //---------------
        // - Dont need to worry about ElastiCache security groups if cluster is running in VPC. VPC security groups are used though
        // - Use redis replication groups for HA in a future iteration

        const subnetIds = props?.vpcSubnets.subnets?.map(x => x.subnetId)
        if (!subnetIds) throw new Error("No subnets were specified");

        const subnetGroup = new elasticache.CfnSubnetGroup(this, "ElasticacheSubnetGroup", {
            cacheSubnetGroupName: "mysubnetgroup",
            description: "subnet group for elasticache",
            subnetIds: subnetIds,
        })

        const securityGroup = new ec2.CfnSecurityGroup(this, "ElasticacheSecurityGroup", {
            vpcId: props.vpc.vpcId,
            groupDescription: `Permitts only inbound traffic on TCP port ${props.redisPort}`,
            securityGroupIngress: [
                {
                    description: "Allow access from outside world", // TODO: Make this rule tighter
                    cidrIp: "0.0.0.0/0",
                    ipProtocol: "tcp",
                    fromPort: props.redisPort,
                    toPort: props.redisPort,
                }
            ]
        })

        const cluster = new elasticache.CfnCacheCluster(this, "ElasticacheCluster", {
            clusterName: "mycluster",
            engine: "redis",
            engineVersion: "6.2", // NOTE: remember to keep in sync with docker-compose container version
            cacheNodeType: "cache.t2.micro", // TODO: Double check if this is the cheapest that is sufficient
            numCacheNodes: 1,
            vpcSecurityGroupIds: [securityGroup.ref],
            port: props.redisPort,
            // TODO: Create a parameter group if the default one is insufficient
            cacheSubnetGroupName: subnetGroup.cacheSubnetGroupName,
        })
        cluster.addDependsOn(subnetGroup)

        this.clusterEndpointAddress = cluster.attrRedisEndpointAddress
        this.clusterEndpointPort = cluster.attrRedisEndpointPort
    }
}
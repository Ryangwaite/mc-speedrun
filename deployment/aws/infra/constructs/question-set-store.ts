import { Construct } from "constructs";
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as efs from 'aws-cdk-lib/aws-efs'
import { RemovalPolicy } from "aws-cdk-lib";

export interface QuestionSetStoreProps {
    vpc: ec2.IVpc
}

export class QuestionSetStore extends Construct {

    public readonly fileSystemId: string
    public readonly accessPoint: efs.AccessPoint

    constructor(scope: Construct, id: string, {vpc}: QuestionSetStoreProps) {
        super(scope, id)

        const questionSetStore = new efs.FileSystem(this, "QuestionSetStore", {
            vpc: vpc,
            vpcSubnets: { subnets: vpc.isolatedSubnets },
            performanceMode: efs.PerformanceMode.GENERAL_PURPOSE,
            throughputMode: efs.ThroughputMode.BURSTING,
            removalPolicy: RemovalPolicy.DESTROY,
        })
        // Allow anyone to mount over NFS
        questionSetStore.connections.allowFromAnyIpv4(ec2.Port.tcp(2049))
        
        this.fileSystemId = questionSetStore.fileSystemId

        // ////// Question Set Loader //////
        this.accessPoint = questionSetStore.addAccessPoint("QuestionSetLoaderAccessPoint", {
            // NOTE: Even though there is only one type of data stored in EFS and we could theoretically use
            // the root path, the permissions are unable to be changed so that a non-root user can write to
            // it. Instead, the /quizzes directory is created with permissions that enable non-root users to
            // write to it.
            path: "/quizzes",
            createAcl: {
                ownerUid: "1001",
                ownerGid: "1001",
                permissions: "750", // Corresponds to: u+rwx,g+rx
            },
            posixUser: {
                uid: "1001",  // TODO: Paramaterize these
                gid: "1001",
            },
        })
    }
}
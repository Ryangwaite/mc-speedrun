import { Construct } from "constructs"
import * as s3 from 'aws-cdk-lib/aws-s3'
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment'
import { RemovalPolicy } from "aws-cdk-lib"

export interface FrontendProps {

}

export class Frontend extends Construct {
    constructor(scope: Construct, id: string, props: FrontendProps) {
        super(scope, id)

        const frontendBucket = new s3.Bucket(this, "FrontendBucket", {
            autoDeleteObjects: true,  // just to make cleanup easier, wouldn't want this for prod
            removalPolicy: RemovalPolicy.DESTROY,
            websiteIndexDocument: "index.html",
            publicReadAccess: true, // TODO: Disable once cloudfront is in use
        })
        new s3deploy.BucketDeployment(this, "DeployFrontend", {
            sources: [
                s3deploy.Source.asset("../../../ui/build"), // NOTE: The sources must exist for this to work
            ],
            destinationBucket: frontendBucket,
        })

    }
}
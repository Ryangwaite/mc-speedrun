import { Construct } from "constructs";

import * as s3 from 'aws-cdk-lib/aws-s3'
import * as elb from 'aws-cdk-lib/aws-elasticloadbalancingv2'
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront'
import * as cloudfront_distro from 'aws-cdk-lib/aws-cloudfront-origins'

export interface CloudfrontProps {
    frontendBucket: s3.IBucket
    loadBalancer: elb.IApplicationLoadBalancer
}

export class CloudfrontDistro extends Construct {

    public readonly domainName: string

    constructor(scope: Construct, id: string, props: CloudfrontProps) {
        super(scope, id)

        const distribution = new cloudfront.Distribution(this, "Distribution", {
            priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
            enableIpv6: false,
            defaultBehavior: {
                origin: new cloudfront_distro.S3Origin(props.frontendBucket),
                viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.HTTPS_ONLY,
                cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
            },
            additionalBehaviors: {
                '/api/*': {
                    origin: new cloudfront_distro.LoadBalancerV2Origin(props.loadBalancer, {
                        protocolPolicy: cloudfront.OriginProtocolPolicy.HTTP_ONLY,
                    }),
                    allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
                    viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.HTTPS_ONLY,
                    originRequestPolicy: new cloudfront.OriginRequestPolicy(this, "ApiOriginRequestPolicy", {
                        originRequestPolicyName: "APIPolicy",
                        headerBehavior: cloudfront.OriginRequestHeaderBehavior.allowList(
                            // Allow websockets to connect
                            "Sec-WebSocket-Extensions", "Sec-WebSocket-Key", "Sec-WebSocket-Version"
                        ),
                        queryStringBehavior: cloudfront.OriginRequestQueryStringBehavior.all()
                    }),
                    // All requests to this origin are dynamic so no point in caching
                    cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
                }
            }
        })
        this.domainName = distribution.domainName
    }
}
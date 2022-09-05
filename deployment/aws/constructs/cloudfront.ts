import { Construct } from "constructs";
import * as s3 from 'aws-cdk-lib/aws-s3'
import * as elb from 'aws-cdk-lib/aws-elasticloadbalancingv2'
import * as route53 from "aws-cdk-lib/aws-route53"
import * as targets from "aws-cdk-lib/aws-route53-targets"
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront'
import * as cloudfront_distro from 'aws-cdk-lib/aws-cloudfront-origins'

export interface CloudfrontProps {
    frontendBucket: s3.IBucket
    loadBalancer: elb.IApplicationLoadBalancer
    r53HostedZone: route53.IHostedZone
}

export class CloudfrontDistro extends Construct {

    constructor(scope: Construct, id: string, props: CloudfrontProps) {
        super(scope, id)

        const domainName = props.r53HostedZone.zoneName

        const certificate = new acm.DnsValidatedCertificate(this, "DistributionCertificate", {
            domainName: domainName,
            hostedZone: props.r53HostedZone,
            region: "us-east-1", // Region must be this for cloudfront
        })

        const distribution = new cloudfront.Distribution(this, "Distribution", {
            domainNames: [domainName],
            certificate: certificate,
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

        // Add record to the hosted zone pointing it at this cloudfront distribution
        new route53.ARecord(this, "Alias", {
            zone: props.r53HostedZone,
            target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(distribution)),
        })
    }
}
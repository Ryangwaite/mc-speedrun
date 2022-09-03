# Welcome to your CDK TypeScript project

This is a blank project for CDK development with TypeScript.

The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Useful commands

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `cdk deploy`      deploy this stack to your default AWS account/region
* `cdk diff`        compare deployed stack with current state
* `cdk synth`       emits the synthesized CloudFormation template


## Steps to create the cross account delegation role for Route 53 in the parent account and grant access to the sub account

1. In the parent account, create a new IAM role where the trusted entity type is "AWS Account"
2. Check the "Another AWS account" radio button and enter the ID of the sub account
3. Leave options unchecked and press "next"
4. Don't attach any permissions and press "next" again
5. For the role name enter "mcspeedrun-route53-delagation-role", followed by "Create role"
6. Click on the role, scroll down, click "Add permissions" drop down followed by "Create inline policy"
7. Switch to the JSON editor and input:
    ```json
    {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Action": "route53:ChangeResourceRecordSets",
                "Resource": "arn:aws:route53:::hostedzone/<REPLACE WITH YOUR ZONE ID>"
            },
            {
                "Effect": "Allow",
                "Action": "route53:ListHostedZonesByName",
                "Resource": "*"
            }
        ]
    }
    ```
8. Click "Review policy"
9. Input a name and click "Create policy"

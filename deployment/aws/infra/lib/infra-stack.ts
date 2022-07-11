import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';

export class InfraStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    new lambda.Function(this, "QuestionSetLoader", {
      runtime: lambda.Runtime.GO_1_X,
      code: lambda.Code.fromAsset("../../../question-set-loader/", {
        bundling: {
          image: lambda.Runtime.GO_1_X.bundlingImage,
          user: "root",
          command: ["make", "cdk-lambda-build"],
        }
      }),
      handler: "lambda"
    })
  }
}

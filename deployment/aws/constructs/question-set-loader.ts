import { Construct } from "constructs";
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as efs from 'aws-cdk-lib/aws-efs'
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Jwt } from "../types";

export class QuestionSetLoaderProps {
    vpc: ec2.IVpc
    questionSetStoreAccessPoint: efs.IAccessPoint
    jwt: Jwt
}

const QUESTION_SET_LOADER_ENV_VAR_PREFIX = "MC_SPEEDRUN_"

export class QuestionSetLoader extends Construct {

    public readonly lambda: lambda.IFunction

    constructor(scope: Construct, id: string, props: QuestionSetLoaderProps) {
        super(scope, id)

        const quizDirPath = "/mnt/quizzes"
        this.lambda = new lambda.Function(this, "QuestionSetLoader", {
            filesystem: lambda.FileSystem.fromEfsAccessPoint(props.questionSetStoreAccessPoint, quizDirPath),
            vpc: props.vpc, // Put in data subnets and create a Security Group. TODO: Move to application subnets
            runtime: lambda.Runtime.GO_1_X,
            code: lambda.Code.fromAsset("../../question-set-loader/", {
                bundling: {
                    image: lambda.Runtime.GO_1_X.bundlingImage,
                    user: "root",
                    command: ["make", "cdk-lambda-build"],
                }
            }),
            handler: "lambda",
            environment: {
                [`${QUESTION_SET_LOADER_ENV_VAR_PREFIX}LOADER_DST_DIR`]: quizDirPath,
                [`${QUESTION_SET_LOADER_ENV_VAR_PREFIX}JWT_SECRET`]: props.jwt.secret,
                [`${QUESTION_SET_LOADER_ENV_VAR_PREFIX}JWT_AUDIENCE`]: props.jwt.audience,
                [`${QUESTION_SET_LOADER_ENV_VAR_PREFIX}JWT_ISSUER`]: props.jwt.issuer,
            },
        })
    }
}
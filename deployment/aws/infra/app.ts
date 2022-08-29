#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { NetworkStack } from './stacks/network';
import { QuizStack } from './stacks/quiz';

const app = new cdk.App();

const networkStack = new NetworkStack(app, "Network", {})

new QuizStack(app, "Quiz", {
  vpc: networkStack.vpc,
});
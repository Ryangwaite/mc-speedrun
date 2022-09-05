#!/usr/bin/env node
import * as dotenv from 'dotenv'
dotenv.config()
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { NetworkStack } from './stacks/network';
import { QuizStack } from './stacks/quiz';
import Config from './utils/config';
import { SubdomainStack } from './stacks/subdomain';

const config = Config.load()

const app = new cdk.App();

const networkStack = new NetworkStack(app, "Network", {})

const subdomainStack = new SubdomainStack(app, "Subdomain", {
  subdomainLabel: "mcspeedrun",
  parentAccountId: config.parentZoneConfig.accountId,
  parentAccountRoleName: config.parentZoneConfig.delegationRoleName,
  parentHostedZoneName: config.parentZoneConfig.domainName,
})

new QuizStack(app, "Quiz", {
  vpc: networkStack.vpc,
  hostedZone: subdomainStack.hostedZone,
  jwt: config.jwt,
});
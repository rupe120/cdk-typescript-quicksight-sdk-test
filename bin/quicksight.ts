#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { QuicksightStack } from '../lib/quicksight-stack';

const app = new cdk.App();
new QuicksightStack(app, 'QuicksightStack', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
});
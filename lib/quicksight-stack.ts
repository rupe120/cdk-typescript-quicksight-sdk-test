import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as njsLambda from 'aws-cdk-lib/aws-lambda-nodejs';

export class QuicksightStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

        // Start asset export function, state function task
        const startQuicksightAssetExportFunction = new njsLambda.NodejsFunction(
          this,
          `quicksight-start-asset-export`,
          {
              functionName: `quicksight-start-asset-export`,
              entry: 'lib/quicksight-stack-export.ts',
              tracing: lambda.Tracing.ACTIVE,
              insightsVersion: lambda.LambdaInsightsVersion.VERSION_1_0_143_0,
              timeout: cdk.Duration.minutes(1),
              environment: {
                  AWS_REGION_ID: this.region,
                  AWS_ACCOUNT_ID: this.account,
              },
              bundling: {
                  minify: false,
                  sourceMap: true,
              },
          }
      );
      startQuicksightAssetExportFunction.addToRolePolicy(
          new iam.PolicyStatement({
              actions: [
                  'quicksight:StartAssetBundleExportJob',
                  'cloudformation:DescribeStacks',
                  'cloudformation:ListStackResources',
                  'tag:GetResources',
              ],
              resources: ['*'],
          })
      );
      startQuicksightAssetExportFunction.addToRolePolicy(
          new iam.PolicyStatement({
              actions: ['quicksight:List*', 'quicksight:Describe*'],
              resources: [`arn:aws:quicksight:${this.region}:${this.account}:dashboard/*`],
          })
      );

        // Get export job status function, state function task
        const getQuicksightAssetExportStatusFunction = new njsLambda.NodejsFunction(
          this,
          `get-quicksight-asset-export-status`,
          {
              functionName: `get-quicksight-asset-export-status`,
              entry: 'lib/quicksight-stack-get-export-status.ts',
              handler: 'handler',
              tracing: lambda.Tracing.ACTIVE,
              runtime: lambda.Runtime.NODEJS_18_X,
              environment: {
                  AWS_REGION_ID: this.region,
                  AWS_ACCOUNT_ID: this.account,
              },
              bundling: {
                  minify: false,
                  sourceMap: true,
              },
              timeout: cdk.Duration.minutes(1),
          }
      );
      getQuicksightAssetExportStatusFunction.addToRolePolicy(
          new iam.PolicyStatement({
              actions: ['quicksight:DescribeAssetBundleExportJob'],
              resources: ['*'],
          })
      );

  }
}

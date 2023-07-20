import {
  QuickSightClient,
  DescribeAssetBundleExportJobCommand,
  DescribeAssetBundleExportJobCommandInput,
} from '@aws-sdk/client-quicksight';

const REGION_ID = process.env['AWS_REGION_ID'];
const ACCOUNT_ID = process.env['AWS_ACCOUNT_ID'];

const quicksightClient = new QuickSightClient({ region: REGION_ID });

export const handler = async (event: any): Promise<any> => {
  console.log('event', event);

  if (!event.AssetBundleExportJob) {
      throw new Error('No AssetBundleExportJob provided');
  }
  if (!event.AssetBundleExportJob.Payload) {
      throw new Error('No AssetBundleExportJob.Payload provided');
  }
  const AssetBundleExportJobId = event.AssetBundleExportJob.Payload as string;

  const input = {
      AwsAccountId: ACCOUNT_ID,
      AssetBundleExportJobId: AssetBundleExportJobId,
  } as DescribeAssetBundleExportJobCommandInput;
  console.log('DescribeAssetBundleExportJobCommandInput', input);
  const command = new DescribeAssetBundleExportJobCommand(input);
  const response = await quicksightClient.send(command);

  return response;
};

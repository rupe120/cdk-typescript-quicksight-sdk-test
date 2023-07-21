import {
  QuickSightClient,
  StartAssetBundleExportJobCommandInput,
  StartAssetBundleExportJobCommand,
} from '@aws-sdk/client-quicksight';

const REGION_ID = process.env['AWS_REGION_ID'];
const AWS_ACCOUNT_ID = process.env['AWS_ACCOUNT_ID'];

const quicksightClient = new QuickSightClient({ region: REGION_ID });

function createRandomId(): string {
  let outString = '';
  const inOptions = 'abcdefghijklmnopqrstuvwxyz0123456789';

  for (let i = 0; i < 32; i++) {
      outString += inOptions.charAt(Math.floor(Math.random() * inOptions.length));
  }

  return outString;
}

async function startQuicksightAssetExport(dashboardIds: string[]): Promise<string> {
  console.log('Starting QuickSight Asset Export');

  const startExportCommandInput: StartAssetBundleExportJobCommandInput = {
      AwsAccountId: AWS_ACCOUNT_ID,
      AssetBundleExportJobId: createRandomId(),
      ResourceArns: dashboardIds,
      IncludeAllDependencies: true,
      ExportFormat: 'CLOUDFORMATION_JSON',
  };

  const startExportCommand = new StartAssetBundleExportJobCommand(startExportCommandInput);

  const start_asset_export_job_result = await quicksightClient.send(startExportCommand);

  if (!start_asset_export_job_result)
      throw new Error('Empty result from StartAssetBundleExportJobCommand');

  if (!start_asset_export_job_result.Status) {
      throw new Error('No Status returned');
  }

  if (start_asset_export_job_result.Status < 200 || start_asset_export_job_result.Status >= 300) {
      console.error(
          `StartAssetBundleExportJobCommand failed with status ${start_asset_export_job_result.Status}`,
          JSON.stringify(start_asset_export_job_result)
      );
      throw new Error(
          `StartAssetBundleExportJobCommand failed with status ${start_asset_export_job_result.Status}`
      );
  }

  if (!start_asset_export_job_result.AssetBundleExportJobId) {
      throw new Error('No AssetBundleExportJobId returned');
  }

  return start_asset_export_job_result.AssetBundleExportJobId;
}

export const handler = async (event: any): Promise<any> => {
  console.log('event', event);

  console.log('Starting dashboard export');

  const AssetBundleExportJobId = await startQuicksightAssetExport([]);

  return AssetBundleExportJobId;
};

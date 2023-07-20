import {
  QuickSightClient,
  ListDashboardsCommandInput,
  ListDashboardsCommand,
  ListTagsForResourceCommand,
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

async function getDashboardIdsForExport(): Promise<string[]> {
  console.log('Getting dashboards for export');

  const listDashboardsCommandInput = {
      AwsAccountId: AWS_ACCOUNT_ID,
      MaxResults: 100,
  } as ListDashboardsCommandInput;

  const listDashboardsCommand = new ListDashboardsCommand(listDashboardsCommandInput);

  const listDashboardsResult = await quicksightClient.send(listDashboardsCommand);

  if (!listDashboardsResult) throw new Error('Empty result from ListDashboardsCommand');

  if (!listDashboardsResult.Status) {
      throw new Error('No Status returned');
  }

  if (listDashboardsResult.Status < 200 || listDashboardsResult.Status >= 300) {
      console.error(
          `ListDashboardsCommand failed with status ${listDashboardsResult.Status}`,
          JSON.stringify(listDashboardsResult)
      );
      throw new Error(`ListDashboardsCommand failed with status ${listDashboardsResult.Status}`);
  }
  if (!listDashboardsResult.DashboardSummaryList) {
      throw new Error('No DashboardSummaryList returned');
  }

  if (listDashboardsResult.NextToken) {
      listDashboardsCommandInput.NextToken = listDashboardsResult.NextToken;
      const listDashboardsCommandNext = new ListDashboardsCommand(listDashboardsCommandInput);
      const listDashboardsResultNext = await quicksightClient.send(listDashboardsCommandNext);
      if (!listDashboardsResultNext) throw new Error('Empty result from ListDashboardsCommand');
      if (!listDashboardsResultNext.Status) {
          throw new Error('No Status returned');
      }
      if (listDashboardsResultNext.Status < 200 || listDashboardsResultNext.Status >= 300) {
          console.error(
              `ListDashboardsCommand failed with status ${listDashboardsResultNext.Status}`,
              JSON.stringify(listDashboardsResultNext)
          );
          throw new Error(
              `ListDashboardsCommand failed with status ${listDashboardsResultNext.Status}`
          );
      }
      if (listDashboardsResultNext.DashboardSummaryList) {
          listDashboardsResult.DashboardSummaryList = [
              ...listDashboardsResult.DashboardSummaryList,
              ...listDashboardsResultNext.DashboardSummaryList,
          ];
      }
  }

  const dashboardArns = listDashboardsResult.DashboardSummaryList.map((x) => x.Arn);

  // Filter the dashboards to only those with the ForPipelineExport tag

  const dashboardArnsForExport: string[] = [];

  for (const dashboardArn of dashboardArns) {
      if (!dashboardArn) {
          continue;
      }

      const listTagsForResourceInput = {
          ResourceArn: dashboardArn,
      };
      const listTagsForResourceCommand = new ListTagsForResourceCommand(listTagsForResourceInput);
      const listTagsForResourceResult = await quicksightClient.send(listTagsForResourceCommand);
      if (!listTagsForResourceResult)
          throw new Error('Empty result from ListTagsForResourceCommand');
      if (!listTagsForResourceResult.Status) {
          throw new Error('No Status returned');
      }
      if (listTagsForResourceResult.Status < 200 || listTagsForResourceResult.Status >= 300) {
          console.error(
              `ListTagsForResourceCommand failed with status ${listTagsForResourceResult.Status}`,
              JSON.stringify(listTagsForResourceResult)
          );
          throw new Error(
              `ListTagsForResourceCommand failed with status ${listTagsForResourceResult.Status}`
          );
      }
      if (!listTagsForResourceResult.Tags) {
          continue;
      }
      for (const tag of listTagsForResourceResult.Tags) {
          if (tag.Key === 'ForPipelineExport' && tag.Value === 'true') {
              console.log(`dashboardArn: ${dashboardArn} has tag ForPipelineExport=true`);
              dashboardArnsForExport.push(dashboardArn);
          }
      }
  }

  return dashboardArnsForExport;
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

  const dashboardIds = await getDashboardIdsForExport();
  console.log(`Found ${dashboardIds.length} dashboards to export`);

  const AssetBundleExportJobId = await startQuicksightAssetExport(dashboardIds);

  return AssetBundleExportJobId;
};

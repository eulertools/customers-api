import { MyEnv } from '../src/interfaces/MyEnv';
import { env } from './env';

const environment: MyEnv = {
  appName: 'euler',
  awsEnv: { account: 'CDK_DEV_ACCOUNT', region: 'us-east-1' },
  environment: env,
  branchName: 'development',
  domain: 'dev.euler.tools',
  customApiDomain: 'api.dev.euler.tools',
  customApiDomainHostedZone: 'HOSTED_ZONE_ID',
  vpcId: 'VPC_ID',
  subnetIDs: [
    'SUBNET_ID',
    'SUBNET_ID',
    'SUBNET_ID',
    'SUBNET_ID',
    'SUBNET_ID',
    'SUBNET_ID',
  ],
  elasticsearchURL: 'https://elastic.dev.euler.tools',
};

module.exports = environment;

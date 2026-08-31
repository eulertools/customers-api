import { MyEnv } from '../src/interfaces/MyEnv';

const development:MyEnv = require('./env_development');

const environment: MyEnv = {
  ...development,
  awsEnv: { account: 'CDK_PROD_ACCOUNT', region: 'us-east-1' },
  branchName: 'production',
  vpcId: 'VPC_ID',
  domain: 'prod.euler.tools',
  customApiDomain: 'api.prod.euler.tools',
  customApiDomainHostedZone: 'HOSTED_ZONE_ID',
  elasticsearchURL: 'https://elastic.prod.euler.tools',
  subnetIDs: [
    'SUBNET_ID',
    'SUBNET_ID',
    'SUBNET_ID',
    'SUBNET_ID',
    'SUBNET_ID',
    'SUBNET_ID',
  ],
};

module.exports = environment;

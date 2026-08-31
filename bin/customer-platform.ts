#!/usr/bin/env node
import * as cdk from '@aws-cdk/core';
import { myEnv } from '../config/env';
import { PlatformPipeline } from '../src/platform-pipeline';
import { CustomersDataStack } from '../src/customers-data-stack';
import { ElasticsearchStack } from '../src/elasticsearch-stack';
import { CustomersApiStack } from '../src/customers-api-stack';

const app = new cdk.App();

// Deploy self mutate pipeline
new PlatformPipeline(app, 'CustomersAPIPipeline', {
  githubToken: 'githubToken',
  gitHubRepo: 'customers-api',
  gitHubOwner: 'eulertools',
  env: myEnv.AwsEnv,
  myEnv,
});

new CustomersDataStack(app, 'CustomersTable', { myEnv });

new ElasticsearchStack(app, 'ElasticSearch', { myEnv });

new CustomersApiStack(app, 'CustomersApi', { myEnv });

/*
new DataTable(app, "DataTable", {env}
*/

/*
new PricesTable(app, "PricesTable", {env}
*/

app.synth();

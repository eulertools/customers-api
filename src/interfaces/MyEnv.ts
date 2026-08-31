import { Duration, StackProps } from '@aws-cdk/core';
import * as lambda from '@aws-cdk/aws-lambda';
import * as apigateway from '@aws-cdk/aws-apigateway';
import * as ec2 from '@aws-cdk/aws-ec2';

export interface MyEnv {
  readonly awsEnv: { readonly account: string; readonly region: string };
  readonly environment: string;
  readonly branchName: string;
  readonly domain: string;
  readonly appName: string;
  readonly vpcId: string;
  readonly subnetIDs: string[];
  readonly customApiDomain: string;
  readonly customApiDomainHostedZone: string;
  readonly elasticsearchURL: string;
}

export interface CustomerApiProps extends StackProps {
  readonly myEnv: MyEnv;
}

type DynamoDbActions = {
  tableArn: string,
  read?: boolean,
  write?: boolean
}

type EnvVariables = {
  [key: string]: string;
}

export interface CustomOptions {
  name: string,
  httpMethod: string,
  authorizer?: apigateway.RequestAuthorizer,
  handlerFile: string,
  handlerName: string,
  envVariables?: EnvVariables,
  codePath: string,
  dynamoDb?: DynamoDbActions,
  vpc?: ec2.IVpc,
  securityGroups?: ec2.ISecurityGroup[],
  athena?: boolean
}

export const lambaDefaultProps = {
  bundling: {
    externalModules: [],
    minify: true,
    sourceMap: true,
  },
  runtime: lambda.Runtime.NODEJS_12_X,
  timeout: Duration.minutes(15),
  memorySize: 3096,
};

export const httpMethods = {
  GET: 'GET',
  PUT: 'PUT',
  POST: 'POST',
  DELETE: 'DELETE',
  OPTIONS: 'OPTIONS',
  ANY: 'ANY',
};

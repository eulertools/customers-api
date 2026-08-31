import {
  CfnOutput, Construct, Stage, StageProps,
} from '@aws-cdk/core';
import { CustomersApiStack } from './customers-api-stack';
import { myEnv } from '../config/env';

export class DeployStage extends Stage {
  public readonly apiEndpoint: CfnOutput;

  constructor(scope: Construct, id: string, props?: StageProps) {
    super(scope, id, props);

    const service = new CustomersApiStack(this, 'CustomerApi', {
      env: myEnv.AwsEnv,
      myEnv,
    });

    this.apiEndpoint = service.apiEndpoint;
  }
}

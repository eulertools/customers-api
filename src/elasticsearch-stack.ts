import {
  Construct, Stack, StackProps, CfnResource,
} from '@aws-cdk/core';
import * as es from '@aws-cdk/aws-elasticsearch';
import * as ec2 from '@aws-cdk/aws-ec2';
import { SecurityGroup } from '@aws-cdk/aws-ec2';
import { Certificate } from '@aws-cdk/aws-certificatemanager';
import { MyEnv } from './interfaces/MyEnv';

export interface elasticsearchStackProps extends StackProps {
  readonly myEnv: MyEnv;
}

export class ElasticsearchStack extends Stack {
  private commonVpc: ec2.IVpc;

  constructor(scope: Construct, id: string, props: elasticsearchStackProps) {
    super(scope, id, props);
    const { myEnv } = props;

    const serviceLinkedRole = new CfnResource(this, 'es-service-linked-role', {
      type: 'AWS::IAM::ServiceLinkedRole',
      properties: {
        AWSServiceName: 'es.amazonaws.com',
        Description: 'Role for ES to access resources in my VPC',
      },
    });

    const arn = 'arn:aws:acm:us-east-1:CDK_PROD_ACCOUNT:certificate/CERTIFICATE_ID';
    const certificate = Certificate.fromCertificateArn(this, 'Certificate', arn);

    const securityGroup = SecurityGroup.fromSecurityGroupId(this, 'SG', 'RESOURCES_SG', {
      mutable: false,
    });

    // @ts-ignore
    new es.Domain(this, 'data-es', {
      version: es.ElasticsearchVersion.V7_9,
      customEndpoint: {
        domainName: `elastic.${myEnv.domain}`,
        certificate,
      },
      enableVersionUpgrade: true,
      capacity: {
        dataNodes: 2,
      },
      ebs: {
        volumeSize: 20,
      },
      zoneAwareness: {
        enabled: true,
      },
      enforceHttps: true,
      nodeToNodeEncryption: true,
      encryptionAtRest: {
        enabled: true,
      },
      securityGroups: [securityGroup],
      vpc: this.commonVpc,
      logging: {
        slowSearchLogEnabled: true,
        appLogEnabled: true,
        slowIndexLogEnabled: true,
      },
    });
  }
}

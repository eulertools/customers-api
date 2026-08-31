import * as cdk from '@aws-cdk/core';
import { CfnOutput } from '@aws-cdk/core';
import * as apigateway from '@aws-cdk/aws-apigateway';
import { AuthorizationType, Resource } from '@aws-cdk/aws-apigateway';
import * as lambda from '@aws-cdk/aws-lambda';
import { NodejsFunction, NodejsFunctionProps } from '@aws-cdk/aws-lambda-nodejs';
import * as ec2 from '@aws-cdk/aws-ec2';
import { PolicyStatement } from '@aws-cdk/aws-iam';
import path from 'path';
import {
  CustomerApiProps, CustomOptions, httpMethods, lambaDefaultProps, MyEnv,
} from './interfaces/MyEnv';

export class CustomersApiStack extends cdk.Stack {
  public readonly apiEndpoint: cdk.CfnOutput;

  readonly vpcId: string;

  readonly subnetIds: string[];

  readonly customApiDomain: string;

  readonly customApiDomainHostedZone: string;

  readonly elasticsearchUrl: string;

  readonly dataTableStreamARN: string;

  private myEnv: MyEnv;

  private restApi: apigateway.RestApi;

  private authorizer: apigateway.RequestAuthorizer;

  private securityGroups: ec2.ISecurityGroup[];

  private myRequestBodyValidator: apigateway.RequestValidator;

  private commonVpc: ec2.IVpc;

  constructor(scope: cdk.Construct, id: string, props: CustomerApiProps) {
    super(scope, id, props);
    const { myEnv } = props;

    // VPC's

    this.commonVpc = ec2.Vpc.fromVpcAttributes(this, 'default', {
      vpcId: myEnv.vpcId,
      availabilityZones: cdk.Fn.getAzs(),
      privateSubnetIds: myEnv.subnetIDs,
    });

    // END VPC's

    // API GATEWAY

    this.restApi = new apigateway.RestApi(this, 'CustomersApi', {
      description: 'Customers Api | This is the entrypoint for customers to the platform to manage their data',
      deploy: true,
      deployOptions: {
        stageName: 'customers',
        variables: { env: myEnv.environment },
      },
      defaultCorsPreflightOptions: {
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
      },
    });

    this.myRequestBodyValidator = new apigateway.RequestValidator(
      this,
      'bodyRequestValidator',
      {
        validateRequestBody: true,
        restApi: this.restApi,
        requestValidatorName: 'bodyRequestValidator',
      },
    );

    new apigateway.GatewayResponse(this, 'badrequest', {
      restApi: this.restApi,
      type: apigateway.ResponseType.BAD_REQUEST_BODY,
      statusCode: '400',
      templates: {
        'application/json': '{"error":$context.error.messageString,"exception":"$context.error.validationErrorString"}',
      },
      responseHeaders: {
        'Access-Control-Allow-Origin': "'*'",
        'Access-Control-Allow-Headers': "'*'",
      },
    });

    const customDomain = apigateway.DomainName.fromDomainNameAttributes(
      this,
      'customDomain',
      {
        domainName: myEnv.customApiDomain,
        domainNameAliasHostedZoneId: myEnv.customApiDomainHostedZone,
        domainNameAliasTarget: '',
      },
    );

    new apigateway.BasePathMapping(this, 'CustomBasePathMapping', {
      domainName: customDomain,
      restApi: this.restApi,
      basePath: 'customers',
      stage: this.restApi.deploymentStage,
    });

    // END API GATEWAY

    // LAMBDA's

    // Authorizer
    this.authorizer = this.createAuthorizer();
    this.restApi.root.addMethod('ANY', undefined, {
      authorizer: this.authorizer,
      authorizationType: AuthorizationType.CUSTOM,
    });

    // Retrieves version
    this.createVersion();

    // Resources

    // END LAMBDA's

    this.apiEndpoint = new CfnOutput(this, 'Url', {
      value: this.restApi.url,
    });
  }

  // LAMBDA CONSTRUCTORS

  createAuthorizer(): apigateway.RequestAuthorizer {
    const authorizerLambda = new lambda.Function(this, 'authorizer', {
      ...lambaDefaultProps,
      code: new lambda.AssetCode(path.resolve(__dirname, 'lambda/authorizer')),
      handler: 'authorizer.get',
      environment: {},
    });

    return new apigateway.RequestAuthorizer(this, 'auth', {
      handler: authorizerLambda,
      identitySources: [apigateway.IdentitySource.header('Authorization')],
    });
  }

  createVersion() {
    this.createLambdaIntegration(this, {
      handlerFile: 'common/get.ts',
      handlerName: 'version',
      codePath: './lambda/common',
      name: 'version',
      httpMethod: httpMethods.GET,
    });
  }

  // eslint-disable-next-line class-methods-use-this
  getLambdaFunction(
    scope: cdk.Stack,
    custOptions: CustomOptions,
  ): lambda.Function {
    const options: NodejsFunctionProps = {
      ...lambaDefaultProps,
      entry: `${__dirname}/lambda/${custOptions.handlerFile}`,
      handler: custOptions.handlerName,
      environment: custOptions.envVariables || {},
      vpc: custOptions.vpc,
      securityGroups: custOptions.securityGroups,
    };

    const funct = new NodejsFunction(
      scope,
      `${
        custOptions.httpMethod.toLowerCase()
      }-${
        custOptions.name
      }-${
        custOptions.handlerName
      }`,
      options,
    );

    if (custOptions.dynamoDb) {
      const actions: string[] = [];
      if (custOptions.dynamoDb.read) {
        actions.push('dynamodb:GetItem');
        actions.push('dynamodb:Query');
        actions.push('dynamodb:BatchGetItem');
      }
      if (custOptions.dynamoDb.write) {
        actions.push('dynamodb:UpdateItem');
        actions.push('dynamodb:PutItem');
      }
      funct.addToRolePolicy(
        new PolicyStatement({
          actions,
          resources: [
            `${custOptions.dynamoDb.tableArn}/index/*`,
            custOptions.dynamoDb.tableArn,
          ],
        }),
      );
    }

    if (custOptions.vpc) {
      const actions: string[] = [];
      actions.push('ec2:CreateNetworkInterface');
      actions.push('ec2:DescribeNetworkInterfaces');
      actions.push('ec2:DeleteNetworkInterface');
      funct.addToRolePolicy(
        new PolicyStatement({
          actions,
          resources: ['*'],
        }),
      );
    }
    return funct;
  }

  createLambdaIntegration(
    scope: cdk.Stack,
    custOptions: CustomOptions,
    resource?: Resource,
    model?: apigateway.Model,
  ): void {
    const funct = this.getLambdaFunction(scope, custOptions);

    const apiResource = resource || this.restApi.root.addResource(custOptions.name);
    apiResource.addMethod(
      custOptions.httpMethod,
      new apigateway.LambdaIntegration(funct),
      {
        authorizer: custOptions.authorizer,
        requestValidator: model ? this.myRequestBodyValidator : undefined,
        requestModels: model ? { 'application/json': model } : undefined,
      },
    );
  }

  // END LAMBDA CONSTRUCTORS
}

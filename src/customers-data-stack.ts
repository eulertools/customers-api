import { Construct, Stack, StackProps } from '@aws-cdk/core';
import { AttributeType, BillingMode, Table } from '@aws-cdk/aws-dynamodb';
import { MyEnv } from './interfaces/MyEnv';

export interface DynamoDbStackProps extends StackProps {
  readonly myEnv: MyEnv;
}

export class CustomersDataStack extends Stack {
  constructor(scope: Construct, id: string, props: DynamoDbStackProps) {
    super(scope, id, props);

    const customersTable = new Table(this, 'customer-data', {
      partitionKey: {
        name: 'hash_key',
        type: AttributeType.STRING,
      },
      sortKey: {
        name: 'range_key',
        type: AttributeType.STRING,
      },
      billingMode: BillingMode.PAY_PER_REQUEST,
      tableName: 'customers',
    });
  }
}

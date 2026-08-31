import { APIGatewayProxyResult } from 'aws-lambda';

export const version = async (): Promise<APIGatewayProxyResult> => ({
  statusCode: 200,
  body: JSON.stringify({
    version: process.env.npm_package_version,
    timestamp: new Date().toISOString(),
  }),
});

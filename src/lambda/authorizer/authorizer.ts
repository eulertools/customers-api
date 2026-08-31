import { APIGatewayAuthorizerResult, APIGatewayRequestAuthorizerEvent } from 'aws-lambda';

type Headers = { [key: string]: string };

const authorize = async (
  headers: Headers,
): Promise<boolean> => (!!((headers?.authorization || headers?.Authorization)));

function lowerCaseHeaders(h: Headers | any): Headers {
  const keys = Object.keys(h);
  let n = keys.length;
  const res: Headers = {};
  while (n--) {
    const key = keys[n];
    res[key.toLowerCase()] = h[key];
  }
  return res;
}

// Help function to generate an IAM policy
const generatePolicy = (effect: 'Allow' | 'Deny'): APIGatewayAuthorizerResult => ({
  principalId: 'user',
  policyDocument: {
    Version: '2012-10-17',
    Statement: [{
      Action: 'execute-api:Invoke',
      Effect: effect,
      Resource: '*',
    }],
  },
});

export const handler = async (
  event: APIGatewayRequestAuthorizerEvent,
): Promise<APIGatewayAuthorizerResult> => {
  const isAuthorized = await authorize(lowerCaseHeaders(event.headers || {}));
  if (!isAuthorized) return generatePolicy('Deny');
  return generatePolicy('Allow');
};

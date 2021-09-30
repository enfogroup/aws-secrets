import SSM from 'aws-sdk/clients/SSM';
import { cache } from 'cache';

const client = new SSM({ region: 'eu-west-1' });

// eslint-disable-next-line prefer-const
export let defaultRegion = 'eu-west-1';

const clients: Record<string, SSM> = {};
const getClient = (region: string): SSM => {
  if (!clients[region]) {
    clients[region] = new SSM({ region });
  }
  return clients[region];
};

interface GetParameterRequest {
  name: string;
  ttl?: number;
  region?: string;
}

export const getParameter = async (params: SSM.GetParameterRequest) => {
  return client.getParameter(params).promise();
};

export const getSSMParameter = async (params: GetParameterRequest): Promise<string> => {
  const { name, ttl = -1, region = defaultRegion } = params;
  const cachedValue = cache.get<string>(name);
  if (cachedValue) {
    return cachedValue;
  }
  const client = getClient(region);
  const output = await client.getParameter({
    Name: name,
    WithDecryption: true
  }).promise();

  const value = output.Parameter?.Value;
  if (!value) {
    throw new Error('No value found for parameter');
  }
  cache.set<string>(name, value, ttl);
  return value;
};

import SSM from 'aws-sdk/clients/SSM';
import { cache } from 'cache';

// eslint-disable-next-line prefer-const
export let defaultRegion = 'eu-west-1';

const clients: Record<string, SSM> = {};
const getClient = (region: string = defaultRegion): SSM => {
  if (!clients[region]) {
    clients[region] = new SSM({ region });
  }
  return clients[region];
};

/**
 * Parameters when getting a parameter
 */
interface GetParameterRequest {
  /**
   * Name of SSM parameter
   */
  name: string;
  /**
   * Time to live in seconds. Defaults to caching for as long as the node process lives
   */
  ttl?: number;
  /**
   * Region from which to fetch the parameter. Defaults to defaultRegion
   */
  region?: string;
}

/**
 * Retrieves and caches a parameter from SSM
 * @param params
 * See interface definition
 */
export const getSSMParameter = async (params: GetParameterRequest): Promise<string> => {
  const { name, ttl = -1, region } = params;
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

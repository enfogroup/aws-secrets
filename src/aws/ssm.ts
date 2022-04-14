// istanbul ignore file

import * as SSM from 'aws-sdk/clients/ssm';

import { WrapperFunction } from '@clients/cache';

const clients: Record<string, SSM> = {};
/**
 * Returns an SSM client
 * @param region
 * Region for which the client should make requests
 * @param wrapper
 * Optional wrapper function to execute on all clients
 */
export const getClient = (region: string, wrapper?: WrapperFunction<SSM>): SSM => {
  if (!clients[region]) {
    clients[region] = new SSM({ region });
    if (wrapper) {
      clients[region] = wrapper(clients[region]);
    }
  }
  return clients[region];
};

/**
 * Retrieves a parameter from SSM
 * @param region
 * AWS region
 * @param name
 * Name of parameter
 * @param wrapper
 * Optional wrapper function to execute on all clients
 */
export const getParameter = async (region: string, name: string, wrapper?: WrapperFunction<SSM>): Promise<string | undefined> => {
  const client = getClient(region, wrapper);
  const output = await client.getParameter({ Name: name, WithDecryption: true }).promise();
  return output.Parameter?.Value;
};

// istanbul ignore file

import * as SecretsManager from 'aws-sdk/clients/secretsmanager';

import { WrapperFunction } from '@clients/cache';

const clients: Record<string, SecretsManager> = {};
/**
 * Returns a SecretsManager client
 * @param region
 * Region for which the client should make requests
 * @param wrapper
 * Optional wrapper function to execute on all clients
 */
export const getClient = (region: string, wrapper?: WrapperFunction<SecretsManager>): SecretsManager => {
  if (!clients[region]) {
    clients[region] = new SecretsManager({ region });
    if (wrapper) {
      clients[region] = wrapper(clients[region]);
    }
  }
  return clients[region];
};

/**
 * Retrieves a secret from SecretsManager
 * @param region
 * AWS region
 * @param params
 * See interface definition
 * @param wrapper
 * Optional wrapper function to execute on all clients
 */
export const getSecretValue = async (region: string, params: SecretsManager.GetSecretValueRequest, wrapper?: WrapperFunction<SecretsManager>): Promise<string | undefined> => {
  const client = getClient(region, wrapper);
  const output = await client.getSecretValue(params).promise();
  return output.SecretString;
};

// istanbul ignore file

import * as KMS from 'aws-sdk/clients/kms';

import { WrapperFunction } from '@clients/cache';

const clients: Record<string, KMS> = {};
/**
 * Returns an KMS client
 * @param region
 * Region for which the client should make requests
 * @param wrapper
 * Optional wrapper function to execute on all clients
 */
export const getClient = (region: string, wrapper?: WrapperFunction<KMS>): KMS => {
  if (!clients[region]) {
    clients[region] = new KMS({ region });
    if (wrapper) {
      clients[region] = wrapper(clients[region]);
    }
  }
  return clients[region];
};

/**
 * Decrypts a KMS encrypted value
 * @param region
 * AWS region
 * @param params
 * See interface definition
 * @param wrapper
 * Optional wrapper function to execute on all clients
 */
export const decrypt = async (region: string, params: KMS.DecryptRequest, wrapper?: WrapperFunction<KMS>): Promise<KMS.PlaintextType | undefined> => {
  const client = getClient(region, wrapper);
  const output = await client.decrypt(params).promise();
  return output?.Plaintext;
};

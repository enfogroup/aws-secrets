// istanbul ignore file

import { KMSClient, DecryptCommandInput, DecryptCommand } from '@aws-sdk/client-kms';

const clients: Record<string, KMSClient> = {};
/**
 * Returns an KMS client
 * @param region
 * Region for which the client should make requests
 */
export const getClient = (region: string): KMSClient => {
  if (!clients[region]) {
    clients[region] = new KMSClient({ region });
  }
  return clients[region];
};

/**
 * Decrypts a KMS encrypted value
 * @param region
 * AWS region
 * @param input
 * See interface definition
 */
export const decrypt = async (region: string, input: DecryptCommandInput): Promise<Uint8Array | undefined> => {
  const client = getClient(region);
  const command = new DecryptCommand(input);
  const output = await client.send(command);
  return output?.Plaintext;
};

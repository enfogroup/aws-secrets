// istanbul ignore file
import KMS from 'aws-sdk/clients/kms';

const clients: Record<string, KMS> = {};
/**
 * Returns an KMS client
 * @param region
 * Region for which the client should make requests
 */
export const getClient = (region: string): KMS => {
  if (!clients[region]) {
    clients[region] = new KMS({ region });
  }
  return clients[region];
};

/**
 * Decrypts a KMS encrypted value
 * @param region
 * AWS region
 * @param params
 * See interface definition
 */
export const decrypt = async (region: string, params: KMS.DecryptRequest): Promise<KMS.PlaintextType | undefined> => {
  const client = getClient(region);
  const output = await client.decrypt(params).promise();
  return output?.Plaintext;
};

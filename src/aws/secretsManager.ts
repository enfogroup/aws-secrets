// istanbul ignore file
import SecretsManager from 'aws-sdk/clients/secretsmanager';

const clients: Record<string, SecretsManager> = {};
/**
 * Returns a SecretsManager client
 * @param region
 * Region for which the client should make requests
 */
export const getClient = (region: string): SecretsManager => {
  if (!clients[region]) {
    clients[region] = new SecretsManager({ region });
  }
  return clients[region];
};

/**
 * Retrieves a secret from SecretsManager
 * @param region
 * AWS region
 * @param params
 * See interface definition
 * @returns
 * string or undefined
 */
export const getSecretValue = async (region: string, params: SecretsManager.GetSecretValueRequest): Promise<string | undefined> => {
  const client = getClient(region);
  const output = await client.getSecretValue(params).promise();
  return output.SecretString;
};

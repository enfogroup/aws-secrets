// istanbul ignore file

import { GetSecretValueCommand, GetSecretValueCommandInput, SecretsManagerClient } from '@aws-sdk/client-secrets-manager';

const clients: Record<string, SecretsManagerClient> = {};
/**
 * Returns a SecretsManager client
 * @param region
 * Region for which the client should make requests
 */
export const getClient = (region: string): SecretsManagerClient => {
  if (!clients[region]) {
    clients[region] = new SecretsManagerClient({ region });
  }
  return clients[region];
};

/**
 * Retrieves a secret from SecretsManager
 * @param region
 * AWS region
 * @param input
 * See interface definition
 */
export const getSecretValue = async (region: string, input: GetSecretValueCommandInput): Promise<string | undefined> => {
  const client = getClient(region);
  const command = new GetSecretValueCommand(input);
  const output = await client.send(command);
  return output.SecretString;
};

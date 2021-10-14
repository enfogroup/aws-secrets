// istanbul ignore file
import SSM from 'aws-sdk/clients/ssm';

const clients: Record<string, SSM> = {};
/**
 * Returns an SSM client
 * @param region
 * Region for which the client should make requests
 */
export const getClient = (region: string): SSM => {
  if (!clients[region]) {
    clients[region] = new SSM({ region });
  }
  return clients[region];
};

/**
 * Retrieves a parameter from SSM
 * @param region
 * AWS region
 * @param name
 * Name of parameter
 * @returns
 * string or undefined
 */
export const getParameter = async (region: string, name: string): Promise<string | undefined> => {
  const client = getClient(region);
  const output = await client.getParameter({ Name: name, WithDecryption: true }).promise();
  return output.Parameter?.Value;
};

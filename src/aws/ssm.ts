import SSM from 'aws-sdk/clients/SSM';

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

import SSM from 'aws-sdk/clients/SSM';

const client = new SSM({ region: 'eu-west-1' });

const defaultRegion = 'eu-west-1';
const clients: Record<string, SSM> = {};
const getClient = (region: string): SSM => {
  if (!clients[region]) {
    clients[region] = new SSM({ region });
  }
  return clients[region];
};

interface GetParameterRequest {
  name: string;
  ttl?: number;
  region?: string;
}

export const getParameter = async (params: SSM.GetParameterRequest) => {
  return client.getParameter(params).promise();
};

export const getSSMParameter = async (params: GetParameterRequest): Promise<string> => {
  const { name, ttl = -1, region = defaultRegion } = params;
};

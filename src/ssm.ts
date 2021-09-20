import SSM from 'aws-sdk/clients/SSM';

const client = new SSM({ region: 'eu-west-1' });

export const getParameter = async (params: SSM.GetParameterRequest) => {
  return client.getParameter(params).promise();
};

// istanbul ignore file

import { GetParameterCommand, GetParametersByPathCommand, GetParametersByPathCommandInput, GetParametersByPathCommandOutput, Parameter, SSMClient } from '@aws-sdk/client-ssm';

const clients: Record<string, SSMClient> = {};
/**
 * Returns an SSM client
 * @param region
 * Region for which the client should make requests
 */
export const getClient = (region: string): SSMClient => {
  if (!clients[region]) {
    clients[region] = new SSMClient({ region });
  }
  return clients[region];
};

/**
 * Retrieves a parameter from SSM
 * @param region
 * AWS region
 * @param name
 * Name of parameter
 */
export const getParameter = async (region: string, name: string): Promise<string | undefined> => {
  const client = getClient(region);
  const command = new GetParameterCommand({
    Name: name,
    WithDecryption: true
  });
  const output = await client.send(command);
  return output.Parameter?.Value;
};

/**
 * Retrieves SSM parameters by path
 * @param region
 * AWS region
 * @param input
 * GetParametersByPathRequest object
 */
export const getPaginatedParametersByPath = async (region: string, input: GetParametersByPathCommandInput): Promise<GetParametersByPathCommandOutput> => {
  const client = getClient(region);
  const command = new GetParametersByPathCommand({ WithDecryption: true, ...input });
  return client.send(command);
};

/**
 * Retrieves SSM parameters by path, returns all values
 * @param region
 * AWS region
 * @param input
 * GetParametersByPathRequest object
 */
export const getAllParametersByPath = async (region: string, input: GetParametersByPathCommandInput): Promise<string[]> => {
  const parameters: string[] = [];
  let nextToken: GetParametersByPathCommandOutput['NextToken'];
  do {
    const response = await getPaginatedParametersByPath(region, { NextToken: nextToken, ...input });
    nextToken = response.NextToken;

    const newValues = (response.Parameters ?? [])
      .reduce((aggregator: string[], value: Parameter): string[] => {
        if (value.Value) {
          aggregator.push(value.Value);
        }
        return aggregator;
      }, []);

    parameters.push(...newValues);
  } while (nextToken);
  return parameters;
};

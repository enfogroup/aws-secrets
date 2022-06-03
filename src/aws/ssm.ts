// istanbul ignore file

import * as SSM from 'aws-sdk/clients/ssm';

import { WrapperFunction } from '@clients/cache';

const clients: Record<string, SSM> = {};
/**
 * Returns an SSM client
 * @param region
 * Region for which the client should make requests
 * @param wrapper
 * Optional wrapper function to execute on all clients
 */
export const getClient = (region: string, wrapper?: WrapperFunction<SSM>): SSM => {
  if (!clients[region]) {
    clients[region] = new SSM({ region });
    if (wrapper) {
      clients[region] = wrapper(clients[region]);
    }
  }
  return clients[region];
};

/**
 * Retrieves a parameter from SSM
 * @param region
 * AWS region
 * @param name
 * Name of parameter
 * @param wrapper
 * Optional wrapper function to execute on all clients
 */
export const getParameter = async (region: string, name: string, wrapper?: WrapperFunction<SSM>): Promise<string | undefined> => {
  const client = getClient(region, wrapper);
  const output = await client.getParameter({ Name: name, WithDecryption: true }).promise();
  return output.Parameter?.Value;
};

/**
 * Retrieves SSM parameters by path
 * @param region
 * AWS region
 * @param params
 * GetParametersByPathRequest object
 * @param wrapper
 * Optional wrapper function to execute on all clients
 */
export const getPaginatedParametersByPath = async (region: string, params: SSM.GetParametersByPathRequest, wrapper?: WrapperFunction<SSM>): Promise<SSM.GetParametersByPathResult> => {
  const client = getClient(region, wrapper);
  const output = await client.getParametersByPath({ WithDecryption: true, ...params }).promise();
  return output;
};

/**
 * Retrieves SSM parameters by path, returns all values
 * @param region
 * AWS region
 * @param params
 * GetParametersByPathRequest object
 * @param wrapper
 * Optional wrapper function to execute on all clients
 */
export const getAllParametersByPath = async (region: string, params: SSM.GetParametersByPathRequest, wrapper?: WrapperFunction<SSM>): Promise<string[]> => {
  const parameters: string[] = [];
  let nextToken: SSM.GetParametersByPathResult['NextToken'];
  do {
    const response = await getPaginatedParametersByPath(region, { NextToken: nextToken, ...params }, wrapper);
    nextToken = response.NextToken;

    const newValues = (response.Parameters ?? [])
      .reduce((aggregator: string[], value: SSM.Parameter): string[] => {
        if (value.Value) {
          aggregator.push(value.Value);
        }
        return aggregator;
      }, []);

    parameters.push(...newValues);
  } while (nextToken);
  return parameters;
};

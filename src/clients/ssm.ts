import { GetParameterRequest as SSMGetParameterRequest } from 'aws-sdk/clients/ssm';

import { getParameter } from '@aws/ssm';
import { Cache, CacheParameters } from './cache';

/**
 * Parameters when getting a parameter
 */
export interface GetParameterRequest extends Omit<SSMGetParameterRequest, 'WithDecryption'> {
  /**
   * Key to use for caching. Default: Name
   */
  cacheKey?: string;
  /**
   * Time to live in seconds. Default: ttl set within the SSMCache instance
   */
  ttl?: number;
  /**
   * Region from which to fetch the parameter. Default: region set within the SSMCache instance
   */
  region?: string;
}

/**
 * Parameters used to create a new SSMCache
 */
export type SSMCacheParameters = CacheParameters

/**
 * SSMCache retrieves and caches parameters from SSM
 */
export class SSMCache extends Cache {
  /**
   * Creates a new SSMCache instance
   * @param params
   * See interface definition
   */
  // eslint-disable-next-line no-useless-constructor
  constructor (params: SSMCacheParameters) {
    super(params);
  }

  /**
   * Retrieves and caches a parameter
   * @param params
   * See interface definition
   */
  public async getParameter (params: GetParameterRequest): Promise<string> {
    const { Name, region = this.region, ttl, cacheKey = Name } = params;
    return this.getAndCache({
      cacheKey,
      ttl,
      noValueFoundMessage: 'No value found for parameter',
      fun: () => getParameter(region, Name)
    });
  }
}

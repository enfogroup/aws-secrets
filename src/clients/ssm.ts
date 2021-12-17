import { getParameter } from '@aws/ssm';
import { Cache } from './cache';

/**
 * Parameters when getting a parameter
 */
export interface GetParameterRequest {
  /**
   * Name of SSM parameter
   */
  name: string;
  /**
   * Key to use for caching. Default: name
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
export interface SSMCacheParameters {
  /**
   * Region to be used
   */
  region: string;
  /**
   * Optional default TTL to be used for all requests. Defaults to 0 (infinite caching)
   */
  defaultTTL?: number;
}

/**
 * SSMCache retrieves and caches parameters from SSM
 */
export class SSMCache extends Cache {
  /**
   * Retrieves and caches a parameter
   * @param params
   * See interface definition
   */
  public async getParameter (params: GetParameterRequest): Promise<string> {
    const { name, region = this.region, ttl, cacheKey = name } = params;
    return this.getAndCache({
      cacheKey,
      ttl,
      noValueFoundMessage: 'No value found for parameter',
      fun: () => getParameter(region, name)
    });
  }
}

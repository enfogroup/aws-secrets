/* eslint-disable no-dupe-class-members */
import * as SSM from 'aws-sdk/clients/ssm';

import { getParameter, getPaginatedParametersByPath, getAllParametersByPath } from '@aws/ssm';
import { Cache, CacheParameters } from './cache';

/**
 * Parameters when getting a parameter
 */
export interface GetParameterRequest extends Omit<SSM.GetParameterRequest, 'WithDecryption'> {
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
 * Parameters when getting parameters by path, returning paginated values
 */
export interface GetPaginatedParametersByPathRequest extends Omit<SSM.GetParametersByPathRequest, 'WithDecryption'> {
  /**
   * Key to use for caching. Default: Path + NextToken (if present)
   * This cache key is not optimal since more parameters affect the request. Consider defining your own cache key
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
 * Parameters when getting parameters by path, returning all values
 */
export interface GetAllParametersByPathRequest extends Omit<GetPaginatedParametersByPathRequest, 'NextToken' | 'MaxResults'> {
  /**
   * Key to use for caching. Default: Path
   * This cache key is not optimal since more parameters affect the request. Consider defining your own cache key
   */
  cacheKey?: string;
  /**
   * If present all values will be returned
   */
  getAll: true
}

export type GetParametersByPathRequest = GetPaginatedParametersByPathRequest | GetAllParametersByPathRequest

/**
 * Parameters used to create a new SSMCache
 */
export type SSMCacheParameters = CacheParameters<SSM>

/**
 * SSMCache retrieves and caches parameters from SSM
 */
export class SSMCache extends Cache<SSM> {
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
   * Retrieves and caches a String or SecureString parameter
   * @param params
   * See interface definition
   */
  public async getParameter (params: GetParameterRequest): Promise<string> {
    const { Name, region = this.region, ttl, cacheKey = Name } = params;
    return this.getAndCache({
      cacheKey,
      ttl,
      noValueFoundMessage: 'No value found for parameter',
      fun: () => getParameter(region, Name, this.wrapper)
    });
  }

  /**
   * Retrieves and caches a StringList parameter
   * @param params
   * See interface definition
   */
  public async getStringListParameter (params: GetParameterRequest): Promise<string[]> {
    return this.getParameter(params).then((value) => value.split(','));
  }

  /**
   * Retrieves and caches parameters by path
   * Light wrapper around getParametersByPath from the aws-sdk
   * Returns a paginated response
   * @param params
   * See interface definition
   */
  getParametersByPath(params: GetPaginatedParametersByPathRequest): Promise<SSM.GetParametersByPathResult>;
  /**
   * Retrieves and caches parameters by path
   * Returns all values
   * @param params
   * See interface definition
   */
  getParametersByPath(params: GetAllParametersByPathRequest): Promise<string[]>;

  public async getParametersByPath (params: GetParametersByPathRequest): Promise<SSM.GetParametersByPathResult | string[]> {
    if ('getAll' in params) {
      const { Path, region = this.region, ttl, getAll, ...rest } = params;
      return this.getAndCache({
        cacheKey: params.cacheKey ?? params.Path,
        ttl,
        noValueFoundMessage: 'No parameters found for params',
        fun: () => getAllParametersByPath(region, { Path, ...rest }, this.wrapper)
      });
    } else {
      const { Path, region = this.region, ttl, ...rest } = params;
      return this.getAndCache({
        cacheKey: params.cacheKey ?? (params.Path + params.NextToken),
        ttl,
        noValueFoundMessage: 'No parameters found for params',
        fun: () => getPaginatedParametersByPath(region, { Path, ...rest }, this.wrapper)
      });
    }
  }
}

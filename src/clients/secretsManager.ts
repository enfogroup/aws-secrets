import { GetSecretValueRequest as SMGetSecretValueRequest } from 'aws-sdk/clients/secretsmanager';

import { getSecretValue } from '@aws/secretsManager';
import { Cache, CacheParameters } from './cache';

/**
 * Parameters when getting a secret
 */
export interface GetSecretRequest extends SMGetSecretValueRequest {
  /**
   * Key to use for caching. Default: SecretId
   */
  cacheKey?: string;
  /**
   * Time to live in seconds. Default: ttl set within the SecretsManagerCache instance
   */
  ttl?: number;
  /**
   * Region from which to fetch the secret. Default: region set within the SecretsManagerCache instance
   */
  region?: string;
}

/**
 * Parameters used to create a new SecretsManagerCache
 */
export type SecretsManagerCacheParameters = CacheParameters

/**
 * SecretsManagerCache retrieves and caches secrets from SecretsManager
 */
export class SecretsManagerCache extends Cache {
  /**
   * Creates a new SecretsManagerCache instance
   * @param params
   * See interface definition
   */
  // eslint-disable-next-line no-useless-constructor
  constructor (params: SecretsManagerCacheParameters) {
    super(params);
  }

  /**
   * Retrieves and caches a secret. The value will be returned as string
   * @param params
   * See interface definition
   */
  public async getSecretAsString (params: GetSecretRequest): Promise<string> {
    const { SecretId, region = this.region, ttl, cacheKey = SecretId, ...rest } = params;
    return await this.getAndCache<string>({
      cacheKey,
      noValueFoundMessage: 'No value found for secret',
      ttl,
      fun: () => getSecretValue(region, {
        SecretId,
        ...rest
      })
    });
  }

  /**
   * Retrieves and caches a secret. The value will be parsed as JSON
   * @param params
   * See interface definition
   */
  public async getSecretAsJSON<T> (params: GetSecretRequest): Promise<T> {
    const value = await this.getSecretAsString(params);
    return JSON.parse(value) as T;
  }
}

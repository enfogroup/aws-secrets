import { getSecretValue } from '@aws/secretsManager';
import { Cache } from './cache';

/**
 * Parameters when getting a secret
 */
export interface GetSecretRequest {
  /**
   * ID of SecretsManager secret
   */
  id: string;

  versionId?: string;

  versionStage?: string;
  /**
   * Key to use for caching. Default: name
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
export interface SecretsManagerCacheParameters {
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
 * SecretsManagerCache retrieves and caches secrets from SecretsManager
 */
export class SecretsManagerCache extends Cache {
  /**
   * Retrieves and caches a secret. The value will be returned as string
   * @param params
   * See interface definition
   */
  public async getSecretAsString (params: GetSecretRequest): Promise<string> {
    const { id, versionId, versionStage, region = this.region, ttl = this.defaultTTL, cacheKey = id } = params;
    return await this.getAndCache<string>({
      cacheKey,
      noValueFoundMessage: 'No value found for secret',
      ttl,
      fun: () => getSecretValue(region, {
        SecretId: id,
        VersionId: versionId,
        VersionStage: versionStage
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

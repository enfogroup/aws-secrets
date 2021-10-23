import { getSecretValue } from '@aws/secretsmanager';
import { cache } from '@helpers/cache';

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
export class SecretsManagerCache {
  private region: string;
  private defaultTTL: number
  /**
   * Creates a new SecretsManagerCache instance
   * @param params
   * See interface definition
   */
  constructor (params: SecretsManagerCacheParameters) {
    const { region, defaultTTL = 0 } = params;
    this.region = region;
    this.defaultTTL = defaultTTL;
  }

  /**
   * Retrieves and caches a secret. The value will be returned as string
   * @param params
   * See interface definition
   */
  public async getSecretAsString (params: GetSecretRequest): Promise<string> {
    const { id, versionId, versionStage, region = this.region, ttl = this.defaultTTL, cacheKey = id } = params;
    const cachedValue = cache.get<string>(cacheKey);
    if (cachedValue) {
      return cachedValue;
    }

    const value = await getSecretValue(region, {
      SecretId: id,
      VersionId: versionId,
      VersionStage: versionStage
    });
    if (!value) {
      throw new Error('No value found for secret');
    }
    cache.set<string>(cacheKey, value, ttl);
    return value;
  }

  /**
   * Retrieves and caches a secret. The value will be parsed as JSON
   * @param params
   * See interface definition
   */
  public async getSecretasJSON <T> (params: GetSecretRequest): Promise<T> {
    const value = await this.getSecretAsString(params);
    return JSON.parse(value) as T;
  }

  /**
   * Returns current region
   */
  public getRegion (): string {
    return this.region;
  }

  /**
   * Sets the region
   * @param region
   * Region as string. For example 'eu-west-1'
   */
  public setRegion (region: string): void {
    this.region = region;
  }

  /**
   * Returns the default TTL
   */
  public getDefaultTTL (): number {
    return this.defaultTTL;
  }

  /**
   * Sets the default TTL
   * @param ttl
   * TTL as a number in seconds
   */
  public setDefaultTTL (ttl: number): void {
    this.defaultTTL = ttl;
  }
}

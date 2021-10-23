import { getParameter } from '@aws/ssm';
import { cache } from '@helpers/cache';

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
export class SSMCache {
  private region: string;
  private defaultTTL: number
  /**
   * Creates a new SSMCache instance
   * @param params
   * See interface definition
   */
  constructor (params: SSMCacheParameters) {
    const { region, defaultTTL = 0 } = params;
    this.region = region;
    this.defaultTTL = defaultTTL;
  }

  /**
   * Retrieves and caches a parameter
   * @param params
   * See interface definition
   */
  public async getParameter (params: GetParameterRequest): Promise<string> {
    const { name, region = this.region, ttl = this.defaultTTL, cacheKey = name } = params;
    const cachedValue = cache.get<string>(cacheKey);
    if (cachedValue) {
      return cachedValue;
    }

    const value = await getParameter(region, name);
    if (!value) {
      throw new Error('No value found for parameter');
    }
    cache.set<string>(cacheKey, value, ttl);
    return value;
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

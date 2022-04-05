import { cache } from '@helpers/cache';

/**
 * Wrapper function which returns the same type as it received
 */
export type WrapperFunction<T> = (client: T) => T

/**
 * Parameters used to create a new instance
 */
export interface CacheParameters<T> {
  /**
   * Region to be used
   */
  region: string;
  /**
   * Optional default TTL to be used for all requests. Defaults to 0 (infinite caching)
   */
  defaultTTL?: number;
  /**
   * Wraps any client used to fetch data. Mainly intended for x-ray support
   */
  clientWrapper?: WrapperFunction<T>
}

/**
 * Parameters when getting and caching a value
 */
export interface GetAndCacheParameters<T> {
  /**
   * Key to use for caching
   */
  cacheKey: string
  /**
   * Optional TTL for value, defaults to defaultTTL
   */
  ttl?: number
  /**
   * Error message to throw if no value gets returned
   */
  noValueFoundMessage: string
  /**
   * Function to execute and await if no value is found in cache
   */
  fun: () => Promise<T | undefined>
}

/**
 * Cache returns cached values or awaits a promise to get one
 */
export class Cache<T> {
  protected region: string;
  protected defaultTTL: number;
  protected wrapper: WrapperFunction<T> | undefined;
  /**
   * Creates a new instance
   * @param params
   * See interface definition
   */
  constructor (params: CacheParameters<T>) {
    const { region, defaultTTL = 0, clientWrapper } = params;
    this.region = region;
    this.defaultTTL = defaultTTL;
    this.wrapper = clientWrapper;
  }

  /**
   * Gets and caches a value
   * @param params
   * See interface definition
   */
  protected async getAndCache<T> (params: GetAndCacheParameters<T>): Promise<T> {
    const { ttl = this.defaultTTL, cacheKey, fun, noValueFoundMessage } = params;
    const cachedValue = cache.get<T>(cacheKey);
    if (cachedValue) {
      return cachedValue;
    }

    const value = await fun();
    if (!value) {
      throw new Error(noValueFoundMessage);
    }

    cache.set<T>(cacheKey, value, ttl);
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

import { decrypt } from '@aws/kms';
import { DecryptRequest as KMSDecryptRequest } from 'aws-sdk/clients/kms';
import { Cache, CacheParameters } from './cache';

/**
 * Parameters when getting a parameter
 */
export interface DecryptRequest extends KMSDecryptRequest {
  /**
   * Key to use for caching
   */
  cacheKey: string;
  /**
   * Time to live in seconds. Default: ttl set within the KMSCache instance
   */
  ttl?: number;
  /**
   * Region from which to fetch the parameter. Default: region set within the KMSCache instance
   */
  region?: string;
}

/**
 * Parameters used to create a new SSMCache
 */
export type KMSCacheParameters = CacheParameters

/**
 * SSMCache retrieves and caches parameters from SSM
 */
export class KMSCache extends Cache {
  /**
   * Creates a new KMSCache instance
   * @param params
   * See interface definition
   */
  // eslint-disable-next-line no-useless-constructor
  constructor (params: KMSCacheParameters) {
    super(params);
  }

  /**
   * Decrypts a cipher text blob
   * @param params
   * See interface definition
   */
  public async decrypts (params: DecryptRequest): Promise<string> {
    const { region = this.region, ttl, cacheKey, ...rest } = params;
    return this.getAndCache({
      cacheKey,
      ttl,
      noValueFoundMessage: 'No value found in CiphertextBlob',
      fun: async () => {
        const value = await decrypt(region, {
          ...rest
        });
        if (!value) {
          return value;
        }
        return value.toString();
      }
    });
  }
}

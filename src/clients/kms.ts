import { decrypt } from '@aws/kms';
import { DecryptRequest as KMSDecryptRequest } from 'aws-sdk/clients/kms';
import { Cache, CacheParameters } from './cache';

/**
 * Parameters when getting a parameter
 */
export interface DecryptRequest extends KMSDecryptRequest {
  /**
   * Key to use for caching. Default: string value of CiphertextBlob
   */
  cacheKey?: string;
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
 * Parameters used to create a new KMSCache
 */
export type KMSCacheParameters = CacheParameters

/**
 * KMSCache decrypts and cached data encrypted using KMS
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
   * Decrypts and caches a ciphertext blob
   * @param params
   * See interface definition
   */
  public async decrypt (params: DecryptRequest): Promise<string> {
    const { CiphertextBlob, region = this.region, ttl, cacheKey = CiphertextBlob.toString(), ...rest } = params;
    return this.getAndCache({
      cacheKey,
      ttl,
      noValueFoundMessage: 'No value found in CiphertextBlob',
      fun: async () => {
        const value = await decrypt(region, {
          CiphertextBlob,
          ...rest
        });
        if (!value) {
          return value;
        }
        return value.toString();
      }
    });
  }

  /**
   * Decrypts and caches a ciphertext blob. The value will be parsed as JSON
   * @param params
   * See interface definition
   */
  public async decryptAsJSON<T> (params: DecryptRequest): Promise<T> {
    const value = await this.decrypt(params);
    return JSON.parse(value) as T;
  }
}

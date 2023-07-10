import { DecryptCommandInput } from '@aws-sdk/client-kms';

import { decrypt } from '@aws/kms';
import { Cache, CacheParameters } from './cache';

/**
 * Parameters when getting a parameter
 */
export interface DecryptRequest extends Omit<DecryptCommandInput, 'CiphertextBlob'> {
  /**
   * Ciphertext to be decrypted. The blob includes metadata.
   */
  CiphertextBlob: Uint8Array | string
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
    const blob = typeof params.CiphertextBlob === 'string' ? new TextEncoder().encode(params.CiphertextBlob) : params.CiphertextBlob;
    const { CiphertextBlob: _, region = this.region, ttl, cacheKey = blob.toString(), ...rest } = params;
    return this.getAndCache({
      cacheKey,
      ttl,
      noValueFoundMessage: 'No value found in CiphertextBlob',
      fun: async () => {
        const value = await decrypt(region, {
          CiphertextBlob: blob,
          ...rest
        });
        if (!value) {
          return value;
        }
        return new TextDecoder('utf-8').decode(value);
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

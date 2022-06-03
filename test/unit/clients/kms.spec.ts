// to be tested
import { KMSCache } from '@clients/kms';

// to be mocked
import * as kmsHelper from '@aws/kms';

// tools
import { checkAllMocksCalled } from '@test/tools';

describe('kms', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  // these tests use separate parameter names due to caching reasons
  describe('decrypt', () => {
    it('should return a parameter from eu-west-1', async () => {
      const decryptMock = jest.spyOn(kmsHelper, 'decrypt').mockResolvedValue('my-value-1');
      const instance = new KMSCache({ region: 'eu-west-1', defaultTTL: 1000 });

      const output = await instance.decrypt({ CiphertextBlob: 'my-value-1' });

      expect(output).toEqual('my-value-1');
      expect(decryptMock.mock.calls[0][0]).toEqual('eu-west-1');
      checkAllMocksCalled([decryptMock], 1);
    });

    it('should return cached data', async () => {
      const decryptMock = jest.spyOn(kmsHelper, 'decrypt').mockResolvedValue('ignoreMe!');
      const instance = new KMSCache({ region: 'eu-west-1', defaultTTL: 1000 });

      const output = await instance.decrypt({ CiphertextBlob: 'my-value-1' });

      expect(output).toEqual('my-value-1');
      checkAllMocksCalled([decryptMock], 0);
    });

    it('should respect region parameter', async () => {
      const decryptMock = jest.spyOn(kmsHelper, 'decrypt').mockResolvedValue('my-value-2');
      const instance = new KMSCache({ region: 'eu-west-1', defaultTTL: 1000 });

      const output = await instance.decrypt({ region: 'us-east-2', CiphertextBlob: 'my-value-2' });

      expect(output).toEqual('my-value-2');
      expect(decryptMock.mock.calls[0][0]).toEqual('us-east-2');
      checkAllMocksCalled([decryptMock], 1);
    });

    it('should respect defaultTTL constructor parameter', async () => {
      jest
        .useFakeTimers()
        .setSystemTime(new Date('2020-10-13T12:00:00').getTime());
      const decryptMock = jest.spyOn(kmsHelper, 'decrypt').mockResolvedValue('value-defaultTTL');
      const instance = new KMSCache({ region: 'eu-west-1', defaultTTL: 1000 });

      await instance.decrypt({ cacheKey: 'defaultTTL', CiphertextBlob: 'something' });
      jest // forwards time by 20 minutes. 1200 > 1000
        .useFakeTimers()
        .setSystemTime(new Date('2020-10-13T12:20:00').getTime());
      const output = await instance.decrypt({ CiphertextBlob: 'defaultTTL' });

      expect(output).toEqual('value-defaultTTL');
      checkAllMocksCalled([decryptMock], 2);
    });

    it('should pick TTL parameter over defaultTTL', async () => {
      jest
        .useFakeTimers()
        .setSystemTime(new Date('2020-10-13T12:00:00').getTime());
      const decryptMock = jest.spyOn(kmsHelper, 'decrypt').mockResolvedValue('value-defaultTTL');
      const instance = new KMSCache({ region: 'eu-west-1', defaultTTL: 1000 });

      await instance.decrypt({ ttl: 1300, CiphertextBlob: 'TTL' });
      jest // forwards time by 20 minutes. 1200 < 1300
        .useFakeTimers()
        .setSystemTime(new Date('2020-10-13T12:20:00').getTime());
      const output = await instance.decrypt({ CiphertextBlob: 'TTL' });

      expect(output).toEqual('value-defaultTTL');
      checkAllMocksCalled([decryptMock], 1);
    });

    it('should respect cacheKey parameter', async () => {
      const decryptMock = jest.spyOn(kmsHelper, 'decrypt').mockResolvedValue('my-value-4');
      const instance = new KMSCache({ region: 'eu-west-1', defaultTTL: 1000 });

      const output = await instance.decrypt({ CiphertextBlob: 'sharedCached1', cacheKey: 'cacheMe!' });
      const output2 = await instance.decrypt({ CiphertextBlob: 'sharedCached2', cacheKey: 'cacheMe!' });

      expect(output).toEqual('my-value-4');
      expect(output2).toEqual('my-value-4');
      checkAllMocksCalled([decryptMock], 1);
    });

    it('should throw if no value was returned', async () => {
      const decryptMock = jest.spyOn(kmsHelper, 'decrypt').mockResolvedValue(undefined);
      const instance = new KMSCache({ region: 'eu-west-1', defaultTTL: 1000 });

      await expect(instance.decrypt({ CiphertextBlob: 'throw' })).rejects.toThrow('No value found in CiphertextBlob');
      checkAllMocksCalled([decryptMock], 1);
    });
  });

  describe('decryptAsJSON', () => {
    it('should parse value as JSON', async () => {
      interface Stuff {
        a: number
      }
      const data: Stuff = {
        a: 47
      };
      const decryptMock = jest.spyOn(kmsHelper, 'decrypt').mockResolvedValue(JSON.stringify(data));
      const instance = new KMSCache({ region: 'eu-west-1' });

      const output = await instance.decryptAsJSON<Stuff>({ CiphertextBlob: 'json' });

      expect(output).toEqual(data);
      checkAllMocksCalled([decryptMock], 1);
    });
  });

  describe('enableCiphertextAsKey', () => {

  });
});

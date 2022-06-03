// to be tested
import { SecretsManagerCache } from '@clients/secretsManager';

// to be mocked
import * as smHelper from '@aws/secretsManager';

// tools
import { checkAllMocksCalled } from '@test/tools';

describe('secretsmanager', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  // these tests use separate parameter names due to caching reasons
  describe('getSecretAsString', () => {
    it('should return a secret from eu-west-1', async () => {
      const getSecretMock = jest.spyOn(smHelper, 'getSecretValue').mockResolvedValue('my-value-1');
      const instance = new SecretsManagerCache({ region: 'eu-west-1', defaultTTL: 1000 });

      const output = await instance.getSecretAsString({ SecretId: 'working' });

      expect(output).toEqual('my-value-1');
      expect(getSecretMock.mock.calls[0][0]).toEqual('eu-west-1');
      checkAllMocksCalled([getSecretMock], 1);
    });

    it('should return cached data', async () => {
      const getSecretMock = jest.spyOn(smHelper, 'getSecretValue').mockResolvedValue('ignoreMe!');
      const instance = new SecretsManagerCache({ region: 'eu-west-1', defaultTTL: 1000 });

      const output = await instance.getSecretAsString({ SecretId: 'working' });

      expect(output).toEqual('my-value-1');
      checkAllMocksCalled([getSecretMock], 0);
    });

    it('should respect region parameter', async () => {
      const getSecretMock = jest.spyOn(smHelper, 'getSecretValue').mockResolvedValue('my-value-2');
      const instance = new SecretsManagerCache({ region: 'eu-west-1', defaultTTL: 1000 });

      const output = await instance.getSecretAsString({ SecretId: 'region', region: 'us-east-2' });

      expect(output).toEqual('my-value-2');
      expect(getSecretMock.mock.calls[0][0]).toEqual('us-east-2');
      checkAllMocksCalled([getSecretMock], 1);
    });

    it('should respect defaultTTL constructor parameter', async () => {
      jest
        .useFakeTimers()
        .setSystemTime(new Date('2020-10-13T12:00:00').getTime());
      const getSecretMock = jest.spyOn(smHelper, 'getSecretValue').mockResolvedValue('value-defaultTTL');
      const instance = new SecretsManagerCache({ region: 'eu-west-1', defaultTTL: 1000 });

      await instance.getSecretAsString({ SecretId: 'defaultTTL' });
      jest // forwards time by 20 minutes. 1200 > 1000
        .useFakeTimers()
        .setSystemTime(new Date('2020-10-13T12:20:00').getTime());
      const output = await instance.getSecretAsString({ SecretId: 'defaultTTL' });

      expect(output).toEqual('value-defaultTTL');
      checkAllMocksCalled([getSecretMock], 2);
    });

    it('should pick TTL parameter over defaultTTL', async () => {
      jest
        .useFakeTimers()
        .setSystemTime(new Date('2020-10-13T12:00:00').getTime());
      const getSecretMock = jest.spyOn(smHelper, 'getSecretValue').mockResolvedValue('value-defaultTTL');
      const instance = new SecretsManagerCache({ region: 'eu-west-1', defaultTTL: 1000 });

      await instance.getSecretAsString({ SecretId: 'TTL', ttl: 1300 });
      jest // forwards time by 20 minutes. 1200 < 1300
        .useFakeTimers()
        .setSystemTime(new Date('2020-10-13T12:20:00').getTime());
      const output = await instance.getSecretAsString({ SecretId: 'TTL' });

      expect(output).toEqual('value-defaultTTL');
      checkAllMocksCalled([getSecretMock], 1);
    });

    it('should respect cacheKey parameter', async () => {
      const getSecretMock = jest.spyOn(smHelper, 'getSecretValue').mockResolvedValue('my-value-4');
      const instance = new SecretsManagerCache({ region: 'eu-west-1', defaultTTL: 1000 });

      const output = await instance.getSecretAsString({ SecretId: 'sharedCached1', cacheKey: 'cacheMe!' });
      const output2 = await instance.getSecretAsString({ SecretId: 'sharedCached2', cacheKey: 'cacheMe!' });

      expect(output).toEqual('my-value-4');
      expect(output2).toEqual('my-value-4');
      checkAllMocksCalled([getSecretMock], 1);
    });

    it('should throw if no value was returned', async () => {
      const getSecretMock = jest.spyOn(smHelper, 'getSecretValue').mockResolvedValue(undefined);
      const instance = new SecretsManagerCache({ region: 'eu-west-1', defaultTTL: 1000 });

      await expect(instance.getSecretAsString({ SecretId: 'throw' })).rejects.toThrow('No value found for secret');
      checkAllMocksCalled([getSecretMock], 1);
    });
  });

  describe('getSecretAsJSON', () => {
    it('should parse the returned secret value as JSON', async () => {
      interface Input {
        a: number;
        b: string;
      }
      const input: Input = {
        a: 42,
        b: 'theAnswer'
      };
      const getSecretMock = jest.spyOn(smHelper, 'getSecretValue').mockResolvedValue(JSON.stringify(input));
      const instance = new SecretsManagerCache({ region: 'eu-west-1' });

      const output = await instance.getSecretAsJSON<Input>({ SecretId: 'AsJSON' });

      expect(output).toEqual(input);
      checkAllMocksCalled([getSecretMock], 1);
    });
  });
});

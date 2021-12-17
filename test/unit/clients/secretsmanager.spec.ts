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

      const output = await instance.getSecretAsString({ id: 'working' });

      expect(output).toEqual('my-value-1');
      expect(getSecretMock.mock.calls[0][0]).toEqual('eu-west-1');
      checkAllMocksCalled([getSecretMock], 1);
    });

    it('should return cached data', async () => {
      const getSecretMock = jest.spyOn(smHelper, 'getSecretValue').mockResolvedValue('ignoreMe!');
      const instance = new SecretsManagerCache({ region: 'eu-west-1', defaultTTL: 1000 });

      const output = await instance.getSecretAsString({ id: 'working' });

      expect(output).toEqual('my-value-1');
      checkAllMocksCalled([getSecretMock], 0);
    });

    it('should respect region parameter', async () => {
      const getSecretMock = jest.spyOn(smHelper, 'getSecretValue').mockResolvedValue('my-value-2');
      const instance = new SecretsManagerCache({ region: 'eu-west-1', defaultTTL: 1000 });

      const output = await instance.getSecretAsString({ id: 'region', region: 'us-east-2' });

      expect(output).toEqual('my-value-2');
      expect(getSecretMock.mock.calls[0][0]).toEqual('us-east-2');
      checkAllMocksCalled([getSecretMock], 1);
    });

    it('should respect defaultTTL constructor parameter', async () => {
      jest
        .useFakeTimers('modern')
        .setSystemTime(new Date('2020-10-13T12:00:00').getTime());
      const getSecretMock = jest.spyOn(smHelper, 'getSecretValue').mockResolvedValue('value-defaultTTL');
      const instance = new SecretsManagerCache({ region: 'eu-west-1', defaultTTL: 1000 });

      await instance.getSecretAsString({ id: 'defaultTTL' });
      jest // forwards time by 20 minutes. 1200 > 1000
        .useFakeTimers('modern')
        .setSystemTime(new Date('2020-10-13T12:20:00').getTime());
      const output = await instance.getSecretAsString({ id: 'defaultTTL' });

      expect(output).toEqual('value-defaultTTL');
      checkAllMocksCalled([getSecretMock], 2);
    });

    it('should pick TTL parameter over defaultTTL', async () => {
      jest
        .useFakeTimers('modern')
        .setSystemTime(new Date('2020-10-13T12:00:00').getTime());
      const getSecretMock = jest.spyOn(smHelper, 'getSecretValue').mockResolvedValue('value-defaultTTL');
      const instance = new SecretsManagerCache({ region: 'eu-west-1', defaultTTL: 1000 });

      await instance.getSecretAsString({ id: 'TTL', ttl: 1300 });
      jest // forwards time by 20 minutes. 1200 < 1300
        .useFakeTimers('modern')
        .setSystemTime(new Date('2020-10-13T12:20:00').getTime());
      const output = await instance.getSecretAsString({ id: 'TTL' });

      expect(output).toEqual('value-defaultTTL');
      checkAllMocksCalled([getSecretMock], 1);
    });

    it('should respect cacheKey parameter', async () => {
      const getSecretMock = jest.spyOn(smHelper, 'getSecretValue').mockResolvedValue('my-value-4');
      const instance = new SecretsManagerCache({ region: 'eu-west-1', defaultTTL: 1000 });

      const output = await instance.getSecretAsString({ id: 'sharedCached1', cacheKey: 'cacheMe!' });
      const output2 = await instance.getSecretAsString({ id: 'sharedCached2', cacheKey: 'cacheMe!' });

      expect(output).toEqual('my-value-4');
      expect(output2).toEqual('my-value-4');
      checkAllMocksCalled([getSecretMock], 1);
    });

    it('should throw if no value was returned', async () => {
      const getSecretMock = jest.spyOn(smHelper, 'getSecretValue').mockResolvedValue(undefined);
      const instance = new SecretsManagerCache({ region: 'eu-west-1', defaultTTL: 1000 });

      await expect(instance.getSecretAsString({ id: 'throw' })).rejects.toThrow('No value found for secret');
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

      const output = await instance.getSecretAsJSON<Input>({ id: 'AsJSON' });

      expect(output).toEqual(input);
      checkAllMocksCalled([getSecretMock], 1);
    });
  });

  describe('getRegion', () => {
    it('should return the current region', () => {
      const instance = new SecretsManagerCache({ region: 'us-east-2' });

      const output = instance.getRegion();

      expect(output).toEqual('us-east-2');
    });
  });

  describe('setRegion', () => {
    it('should set the region', () => {
      const instance = new SecretsManagerCache({ region: 'us-east-2' });

      instance.setRegion('eu-west-1');
      const output = instance.getRegion();

      expect(output).toEqual('eu-west-1');
    });
  });

  describe('getDefaultTTL', () => {
    it('should get the default TTL', () => {
      const instance = new SecretsManagerCache({ region: 'eu-west-1', defaultTTL: 123 });

      const output = instance.getDefaultTTL();

      expect(output).toEqual(123);
    });
  });

  describe('setDefaultTTL', () => {
    it('should set the default TTL', () => {
      const instance = new SecretsManagerCache({ region: 'eu-west-1', defaultTTL: 123 });

      instance.setDefaultTTL(456);
      const output = instance.getDefaultTTL();

      expect(output).toEqual(456);
    });
  });
});

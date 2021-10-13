// to be tested
import { SSMCache } from '@clients/ssm';

// to be mocked
import * as ssmHelper from '@aws/ssm';

// tools
import { checkAllMocksCalled } from '@test/tools';

describe('ssm', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  // these tests use separate parameter names due to caching reasons
  describe('getParameter', () => {
    it('should return a parameter from eu-west-1', async () => {
      const getParameterMock = jest.spyOn(ssmHelper, 'getParameter').mockResolvedValue('my-value-1');
      const instance = new SSMCache({ region: 'eu-west-1', defaultTTL: 1000 });

      const output = await instance.getParameter({ name: 'working' });

      expect(output).toEqual('my-value-1');
      expect(getParameterMock.mock.calls[0][0]).toEqual('eu-west-1');
      checkAllMocksCalled([getParameterMock], 1);
    });

    it('should return cached data', async () => {
      const getParameterMock = jest.spyOn(ssmHelper, 'getParameter').mockResolvedValue('ignoreMe!');
      const instance = new SSMCache({ region: 'eu-west-1', defaultTTL: 1000 });

      const output = await instance.getParameter({ name: 'working' });

      expect(output).toEqual('my-value-1');
      checkAllMocksCalled([getParameterMock], 0);
    });

    it('should respect region parameter', async () => {
      const getParameterMock = jest.spyOn(ssmHelper, 'getParameter').mockResolvedValue('my-value-2');
      const instance = new SSMCache({ region: 'eu-west-1', defaultTTL: 1000 });

      const output = await instance.getParameter({ name: 'region', region: 'us-east-2' });

      expect(output).toEqual('my-value-2');
      expect(getParameterMock.mock.calls[0][0]).toEqual('us-east-2');
      checkAllMocksCalled([getParameterMock], 1);
    });

    it('should respect defaultTTL constructor parameter', async () => {
      jest
        .useFakeTimers('modern')
        .setSystemTime(new Date('2020-10-13T12:00:00').getTime());
      const getParameterMock = jest.spyOn(ssmHelper, 'getParameter').mockResolvedValue('value-defaultTTL');
      const instance = new SSMCache({ region: 'eu-west-1', defaultTTL: 1000 });

      await instance.getParameter({ name: 'defaultTTL' });
      jest // forwards time by 20 minutes. 1200 > 1000
        .useFakeTimers('modern')
        .setSystemTime(new Date('2020-10-13T12:20:00').getTime());
      const output = await instance.getParameter({ name: 'defaultTTL' });

      expect(output).toEqual('value-defaultTTL');
      checkAllMocksCalled([getParameterMock], 2);
    });

    it('should pick TTL parameter over defaultTTL', async () => {
      jest
        .useFakeTimers('modern')
        .setSystemTime(new Date('2020-10-13T12:00:00').getTime());
      const getParameterMock = jest.spyOn(ssmHelper, 'getParameter').mockResolvedValue('value-defaultTTL');
      const instance = new SSMCache({ region: 'eu-west-1', defaultTTL: 1000 });

      await instance.getParameter({ name: 'TTL', ttl: 1300 });
      jest // forwards time by 20 minutes. 1200 < 1300
        .useFakeTimers('modern')
        .setSystemTime(new Date('2020-10-13T12:20:00').getTime());
      const output = await instance.getParameter({ name: 'TTL' });

      expect(output).toEqual('value-defaultTTL');
      checkAllMocksCalled([getParameterMock], 1);
    });

    it('should respect cacheKey parameter', async () => {
      const getParameterMock = jest.spyOn(ssmHelper, 'getParameter').mockResolvedValue('my-value-4');
      const instance = new SSMCache({ region: 'eu-west-1', defaultTTL: 1000 });

      const output = await instance.getParameter({ name: 'sharedCached1', cacheKey: 'cacheMe!' });
      const output2 = await instance.getParameter({ name: 'sharedCached2', cacheKey: 'cacheMe!' });

      expect(output).toEqual('my-value-4');
      expect(output2).toEqual('my-value-4');
      checkAllMocksCalled([getParameterMock], 1);
    });

    it('should throw if no value was returned', async () => {
      const getParameterMock = jest.spyOn(ssmHelper, 'getParameter').mockResolvedValue(undefined);
      const instance = new SSMCache({ region: 'eu-west-1', defaultTTL: 1000 });

      await expect(instance.getParameter({ name: 'throw' })).rejects.toThrow('No value found for parameter');
      checkAllMocksCalled([getParameterMock], 1);
    });
  });

  describe('getRegion', () => {
    it('should return the current region', () => {
      const instance = new SSMCache({ region: 'us-east-2' });

      const output = instance.getRegion();

      expect(output).toEqual('us-east-2');
    });
  });

  describe('setRegion', () => {
    it('should set the region', () => {
      const instance = new SSMCache({ region: 'us-east-2' });

      instance.setRegion('eu-west-1');
      const output = instance.getRegion();

      expect(output).toEqual('eu-west-1');
    });
  });

  describe('getDefaultTTL', () => {
    it('should get the default TTL', () => {
      const instance = new SSMCache({ region: 'eu-west-1', defaultTTL: 123 });

      const output = instance.getDefaultTTL();

      expect(output).toEqual(123);
    });
  });

  describe('setDefaultTTL', () => {
    it('should set the default TTL', () => {
      const instance = new SSMCache({ region: 'eu-west-1', defaultTTL: 123 });

      instance.setDefaultTTL(456);
      const output = instance.getDefaultTTL();

      expect(output).toEqual(456);
    });
  });
});
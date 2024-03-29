// to be tested
import { SSMCache } from '@clients/ssm';

// to be mocked
import * as ssmHelper from '@aws/ssm';

// tools
import { checkAllMocksCalled } from '@test/tools';

import { GetParametersByPathCommandOutput } from '@aws-sdk/client-ssm';

describe('ssm', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  // these tests use separate parameter names due to caching reasons
  describe('getParameter', () => {
    it('should return a parameter from eu-west-1', async () => {
      const getParameterMock = jest.spyOn(ssmHelper, 'getParameter').mockResolvedValue('my-value-1');
      const instance = new SSMCache({ region: 'eu-west-1', defaultTTL: 1000 });

      const output = await instance.getParameter({ Name: 'working' });

      expect(output).toEqual('my-value-1');
      expect(getParameterMock.mock.calls[0][0]).toEqual('eu-west-1');
      checkAllMocksCalled([getParameterMock], 1);
    });

    it('should return cached data', async () => {
      const getParameterMock = jest.spyOn(ssmHelper, 'getParameter').mockResolvedValue('ignoreMe!');
      const instance = new SSMCache({ region: 'eu-west-1', defaultTTL: 1000 });

      const output = await instance.getParameter({ Name: 'working' });

      expect(output).toEqual('my-value-1');
      checkAllMocksCalled([getParameterMock], 0);
    });

    it('should respect region parameter', async () => {
      const getParameterMock = jest.spyOn(ssmHelper, 'getParameter').mockResolvedValue('my-value-2');
      const instance = new SSMCache({ region: 'eu-west-1', defaultTTL: 1000 });

      const output = await instance.getParameter({ Name: 'region', region: 'us-east-2' });

      expect(output).toEqual('my-value-2');
      expect(getParameterMock.mock.calls[0][0]).toEqual('us-east-2');
      checkAllMocksCalled([getParameterMock], 1);
    });

    it('should respect defaultTTL constructor parameter', async () => {
      jest
        .useFakeTimers()
        .setSystemTime(new Date('2020-10-13T12:00:00').getTime());
      const getParameterMock = jest.spyOn(ssmHelper, 'getParameter').mockResolvedValue('value-defaultTTL');
      const instance = new SSMCache({ region: 'eu-west-1', defaultTTL: 1000 });

      await instance.getParameter({ Name: 'defaultTTL' });
      jest // forwards time by 20 minutes. 1200 > 1000
        .useFakeTimers()
        .setSystemTime(new Date('2020-10-13T12:20:00').getTime());
      const output = await instance.getParameter({ Name: 'defaultTTL' });

      expect(output).toEqual('value-defaultTTL');
      checkAllMocksCalled([getParameterMock], 2);
    });

    it('should pick TTL parameter over defaultTTL', async () => {
      jest
        .useFakeTimers()
        .setSystemTime(new Date('2020-10-13T12:00:00').getTime());
      const getParameterMock = jest.spyOn(ssmHelper, 'getParameter').mockResolvedValue('value-defaultTTL');
      const instance = new SSMCache({ region: 'eu-west-1', defaultTTL: 1000 });

      await instance.getParameter({ Name: 'TTL', ttl: 1300 });
      jest // forwards time by 20 minutes. 1200 < 1300
        .useFakeTimers()
        .setSystemTime(new Date('2020-10-13T12:20:00').getTime());
      const output = await instance.getParameter({ Name: 'TTL' });

      expect(output).toEqual('value-defaultTTL');
      checkAllMocksCalled([getParameterMock], 1);
    });

    it('should respect cacheKey parameter', async () => {
      const getParameterMock = jest.spyOn(ssmHelper, 'getParameter').mockResolvedValue('my-value-4');
      const instance = new SSMCache({ region: 'eu-west-1', defaultTTL: 1000 });

      const output = await instance.getParameter({ Name: 'sharedCached1', cacheKey: 'cacheMe!' });
      const output2 = await instance.getParameter({ Name: 'sharedCached2', cacheKey: 'cacheMe!' });

      expect(output).toEqual('my-value-4');
      expect(output2).toEqual('my-value-4');
      checkAllMocksCalled([getParameterMock], 1);
    });

    it('should throw if no value was returned', async () => {
      const getParameterMock = jest.spyOn(ssmHelper, 'getParameter').mockResolvedValue(undefined);
      const instance = new SSMCache({ region: 'eu-west-1', defaultTTL: 1000 });

      await expect(instance.getParameter({ Name: 'throw' })).rejects.toThrow('No value found for parameter');
      checkAllMocksCalled([getParameterMock], 1);
    });
  });

  describe('getStringListParameter', () => {
    it('should split on ","', async () => {
      const getParameterMock = jest.spyOn(ssmHelper, 'getParameter').mockResolvedValue('abc,def,ghi');
      const instance = new SSMCache({ region: 'eu-west-1', defaultTTL: 1000 });

      const output = await instance.getStringListParameter({ Name: 'my-list-parameter' });

      expect(output).toEqual(['abc', 'def', 'ghi']);
      expect(getParameterMock.mock.calls[0][0]).toEqual('eu-west-1');
      checkAllMocksCalled([getParameterMock], 1);
    });
  });

  describe('getParametersByPath', () => {
    it('should return paginated results', async () => {
      const getParametersByPathMock = jest.spyOn(ssmHelper, 'getPaginatedParametersByPath').mockResolvedValue({ Parameters: [], NextToken: 'meow' } as unknown as GetParametersByPathCommandOutput);
      const instance = new SSMCache({ region: 'eu-west-1', defaultTTL: 1000 });

      const output = await instance.getParametersByPath({ Path: '/a/b' });

      expect(output).toEqual({ Parameters: [], NextToken: 'meow' });
      expect(getParametersByPathMock.mock.calls[0][0]).toEqual('eu-west-1');
      checkAllMocksCalled([getParametersByPathMock], 1);
    });

    it('should be possible to override cacheKey when getting paginated results', async () => {
      const getParametersByPathMock = jest.spyOn(ssmHelper, 'getPaginatedParametersByPath')
        .mockResolvedValueOnce({ Parameters: [], NextToken: 'meow' } as unknown as GetParametersByPathCommandOutput)
        .mockResolvedValueOnce({ Parameters: [], NextToken: 'banana' } as unknown as GetParametersByPathCommandOutput);
      const instance = new SSMCache({ region: 'eu-west-1', defaultTTL: 1000 });

      await instance.getParametersByPath({ Path: '/a', cacheKey: 'path-paginated' });
      const output = await instance.getParametersByPath({ Path: '/a/b', cacheKey: 'path-paginated' });

      expect(output).toEqual({ Parameters: [], NextToken: 'meow' });
      expect(getParametersByPathMock.mock.calls[0][0]).toEqual('eu-west-1');
      checkAllMocksCalled([getParametersByPathMock], 1);
    });

    it('should return all results', async () => {
      const getParametersByPathMock = jest.spyOn(ssmHelper, 'getPaginatedParametersByPath')
        .mockResolvedValueOnce({ Parameters: [{ Value: 'hello' }, { Value: 'there' }], NextToken: 'meow' } as unknown as GetParametersByPathCommandOutput)
        .mockResolvedValueOnce({ Parameters: [{ Value: 'friend' }] } as unknown as GetParametersByPathCommandOutput);
      const instance = new SSMCache({ region: 'eu-west-1', defaultTTL: 1000 });

      const output = await instance.getParametersByPath({ Path: '/a/b', getAll: true });

      expect(output).toEqual(['hello', 'there', 'friend']);
      expect(getParametersByPathMock.mock.calls[0][0]).toEqual('eu-west-1');
      checkAllMocksCalled([getParametersByPathMock], 2);
    });

    it('should be possible to override cacheKey when getting all results', async () => {
      const getParametersByPathMock = jest.spyOn(ssmHelper, 'getPaginatedParametersByPath')
        .mockResolvedValueOnce({ Parameters: [{ Value: 'first' }] } as unknown as GetParametersByPathCommandOutput)
        .mockResolvedValueOnce({ Parameters: [{ Value: 'nope' }] } as unknown as GetParametersByPathCommandOutput);
      const instance = new SSMCache({ region: 'eu-west-1', defaultTTL: 1000 });

      await instance.getParametersByPath({ Path: '/a', cacheKey: 'path-all', getAll: true });
      const output = await instance.getParametersByPath({ Path: '/a/b', cacheKey: 'path-all', getAll: true });

      expect(output).toEqual(['first']);
      expect(getParametersByPathMock.mock.calls[0][0]).toEqual('eu-west-1');
      checkAllMocksCalled([getParametersByPathMock], 1);
    });
  });
});

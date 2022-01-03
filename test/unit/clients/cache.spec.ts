// to be tested
import { Cache } from '@clients/cache';

describe('cache', () => {
  describe('getRegion', () => {
    it('should return the current region', () => {
      const instance = new Cache({ region: 'us-east-2' });

      const output = instance.getRegion();

      expect(output).toEqual('us-east-2');
    });
  });

  describe('setRegion', () => {
    it('should set the region', () => {
      const instance = new Cache({ region: 'us-east-2' });

      instance.setRegion('eu-west-1');
      const output = instance.getRegion();

      expect(output).toEqual('eu-west-1');
    });
  });

  describe('getDefaultTTL', () => {
    it('should get the default TTL', () => {
      const instance = new Cache({ region: 'eu-west-1', defaultTTL: 123 });

      const output = instance.getDefaultTTL();

      expect(output).toEqual(123);
    });
  });

  describe('setDefaultTTL', () => {
    it('should set the default TTL', () => {
      const instance = new Cache({ region: 'eu-west-1', defaultTTL: 123 });

      instance.setDefaultTTL(456);
      const output = instance.getDefaultTTL();

      expect(output).toEqual(456);
    });
  });
});

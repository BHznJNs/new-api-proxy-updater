import { describe, it, expect } from 'vitest';
import { fetchTopChinaProxies, fetchProxifly } from '../src/proxy-fetcher';

describe('extractHongKongProxies', () => {
  it('should extract Hong Kong proxies', async () => {
	const proxies = await fetchTopChinaProxies();
	expect(proxies.length).toBeGreaterThan(0);
  });
});

describe('fetch-proxifly', () => {
  it('should fetch proxifly proxy ips', async () => {
	const proxies = await fetchProxifly();
	expect(proxies.length).toBeGreaterThan(0);
  });
});

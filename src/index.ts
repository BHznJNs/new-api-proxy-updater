import { fetchProxifly, fetchTopChinaProxies, fetchVakhov, Proxy } from "./proxy-fetcher";

/**
 * 更新指定渠道的代理设置。
 * @param env - 包含 API URL 和凭证的环境变量。
 * @param proxyUrl - 要设置的新代理 URL。
 */
async function updateChannelProxy(env: Env, proxyUrl: string): Promise<void> {
	let channelIds
  try {
    channelIds = JSON.parse(env.CHANNEL_IDS) as number[];
  } catch (error) {
    throw new Error(`无效的 CHANNEL_IDS: ${env.CHANNEL_IDS}`);
  }
  const apiUrl = `${env.BASE_URL.replace(/\/$/, '')}/api/channel/`;
  
  for (const id of channelIds) {
    const updateData = {
      id,
      setting: JSON.stringify({ proxy: proxyUrl }),
    };
    console.log(`正在更新渠道 ${id} 的代理...`);
    const response = await fetch(apiUrl, {
      method: 'PUT',
      headers: {
        'New-Api-User': env.ADMIN_ID,
        'Authorization': `Bearer ${env.ADMIN_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
    });
  
    if (response.ok) {
      console.log("✅ 代理更新成功！");
    } else {
      const errorText = await response.text();
      console.error(`❌ 代理更新失败：HTTP ${response.status}: ${errorText}`);
      // 抛出错误以确保外层 catch 能够捕获到
      throw new Error(`代理更新失败：HTTP ${response.status}: ${errorText}`);
    }
  }
}

// Cloudflare Worker 的主入口点
export default {
  // `scheduled` 函数会在 Cron Trigger 触发时自动执行
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    console.log(`Cron Trigger 触发！开始执行任务：${event.cron}`);

    // 步骤 1: 检查所有必要的环境变量是否已设置
    if (!env.BASE_URL || !env.ADMIN_ID || !env.ADMIN_TOKEN || !env.CHANNEL_IDS) {
      console.error("错误：一个或多个环境变量未设置 (BASE_URL, ADMIN_ID, ADMIN_TOKEN, CHANNEL_IDS)。请在 Cloudflare dashboard 或使用 wrangler secret 设置它们。");
      return; // 提前退出
    }

    try {
      let proxies: Proxy[];
      switch (env.PROXY_SOURCE as string) {
        case 'TopChina':
          proxies = await fetchTopChinaProxies();
          break;
        case 'proxifly/FreeProxyList':
          proxies = await fetchProxifly();
          break;
        case 'vakhov/fresh-proxy-list':
          proxies = await fetchVakhov();
          break;
        default:
          throw new Error(`未知的代理来源：${env.PROXY_SOURCE}`);
      }
      if (proxies.length === 0) {
        console.log("在列表中未找到有效的香港代理。任务结束。");
        return;
      }
      console.log(`找到了 ${proxies.length} 个香港代理。`);

      // 步骤 4: 选择第一个代理并构建代理 URL
      const firstProxy = proxies[0];
      const { ip, username, password } = firstProxy;
      let proxyUrl;
      if (username && password) {
        const encodedUser = encodeURIComponent(username);
        proxyUrl = `http://${encodedUser}:${password}@${ip}`;
      } else {
        proxyUrl = `http://${ip}`;
      }

      console.log(`准备使用代理：${proxyUrl}`);
      // 步骤 5: 调用 New API 更新渠道代理
      await updateChannelProxy(env, proxyUrl);

    } catch (error) {
      // 捕获并记录任何在执行过程中发生的错误
      console.error("任务执行失败：", error instanceof Error ? error.message : String(error));
    }
  },
};

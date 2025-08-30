export interface Proxy {
  ip: string;
  password?: string;
  username?: string;
};

// --- --- --- --- --- ---

function extractHongKongProxies(markdownText: string): Proxy[] {
  const proxies: Proxy[] = [];
  const lines = markdownText.split('\n');
  const ipPortRegex = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}:\d+$/;

  for (const line of lines) {
    // 检查是否为表格数据行
    if (line.startsWith('|') && !line.startsWith('|---')) {
      // 分割列并去除首尾空格
      const columns = line.split('|').map(col => col.trim()).filter(col => col);

      if (columns.length >= 3) {
        const ipPort = columns[0];
        const country = columns[1];
        const user = columns[2];

        // 筛选香港地区且 IP:端口 格式正确的代理
        if (country === "香港" && ipPortRegex.test(ipPort)) {
          proxies.push({ ip: ipPort, username: user, password: '1' });
        }
      }
    }
  }
  return proxies;
}

export async function fetchTopChinaProxies(): Promise<Proxy[]> {
  const response = await fetch("https://raw.githubusercontent.com/TopChina/proxy-list/refs/heads/main/README.md");
  if (!response.ok) {
    throw new Error(`获取代理列表失败，状态码：${response.status}`);
  }
  const markdownText = await response.text();
  console.log("成功获取代理列表 Markdown 文件。");

  // 步骤 3: 解析 Markdown 并提取香港代理
  const proxies = extractHongKongProxies(markdownText);
  return proxies;
}

// --- --- --- --- --- ---

export async function fetchProxifly(): Promise<Proxy[]> {
  const response = await fetch("https://raw.githubusercontent.com/proxifly/free-proxy-list/refs/heads/main/proxies/countries/HK/data.json");
  if (!response.ok) {
    throw new Error(`获取代理列表失败，状态码：${response.status}`);
  }
  const proxyRawList = await response.json<{ ip: string, port: string }[]>();
  console.log("成功获取代理列表 JSON 文件。");
  const result = proxyRawList.map(item => ({ ip: `${item.ip}:${item.port}` }));
  return result;
}

// --- --- --- --- --- ---

export async function fetchVakhov(): Promise<Proxy[]> {
  const response = await fetch("https://vakhov.github.io/fresh-proxy-list/proxylist.json");
  if (!response.ok) {
    throw new Error(`获取代理列表失败，状态码：${response.status}`);
  }
  const proxyRawList = await response.json<{ ip: string, port: string, http: number, country_code: string }[]>();
  console.log("成功获取代理列表 JSON 文件。");
  const result = proxyRawList
    .filter(item => item.http === 1 && item.country_code === "HK")
    .map(item => ({ ip: `${item.ip}:${item.port}` }));
  return result;
}

/**
 * Vercel Serverless Proxy
 * 公式ブログサイトのCORS制限を回避するためのプロキシ
 *
 * Usage: /api/proxy?url=https://www.nogizaka46.com/s/n46/diary/MEMBER/list
 */

const ALLOWED_HOSTS = [
  "www.nogizaka46.com",
  "www.hinatazaka46.com",
  "sakurazaka46.com",
  "blogara.jp",
  // 画像CDN
  "dcimg.awalker.jp",
  "img.nogizaka46.com",
  "cdn.hinatazaka46.com",
  "cdn.sakurazaka46.com",
];

export default async function handler(req, res) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const targetUrl = req.query.url;
  if (!targetUrl) {
    return res.status(400).json({ error: "Missing url parameter" });
  }

  // URL validation
  let parsed;
  try {
    parsed = new URL(targetUrl);
  } catch {
    return res.status(400).json({ error: "Invalid URL" });
  }

  if (!ALLOWED_HOSTS.includes(parsed.hostname)) {
    return res.status(403).json({ error: `Host not allowed: ${parsed.hostname}` });
  }

  try {
    const response = await fetch(targetUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "ja,en-US;q=0.7,en;q=0.3",
        "Referer": `${parsed.origin}/`,
      },
      redirect: "follow",
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      return res.status(response.status).json({
        error: `Upstream returned ${response.status}`,
      });
    }

    const contentType = response.headers.get("content-type") || "text/html";
    const body = await response.text();

    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");
    return res.status(200).send(body);
  } catch (err) {
    return res.status(502).json({ error: `Fetch failed: ${err.message}` });
  }
}

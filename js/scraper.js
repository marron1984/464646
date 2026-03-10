/**
 * マルチソース画像・動画スクレイパー
 *
 * ソース:
 *  1. Google Custom Search API (画像検索)
 *  2. 公式ブログ (CORSプロキシ経由)
 *  3. ファンサイト・まとめサイト (CORSプロキシ経由)
 *  4. Pinterest (CORSプロキシ経由)
 *  5. YouTube Data API
 */

// CORSプロキシのフォールバックリスト
const CORS_PROXIES = [
  "https://corsproxy.io/?",
  "https://api.allorigins.win/raw?url=",
  "https://api.codetabs.com/v1/proxy?quest=",
];

const Scraper = {
  _aborted: false,

  abort() { this._aborted = true; },

  // ============================
  // メイン: 全ソースから画像収集
  // ============================
  async scrapeImages(memberList, sources, onProgress) {
    this._aborted = false;
    const collected = [];
    const totalSteps = memberList.length * sources.length;
    let step = 0;

    for (const member of memberList) {
      if (this._aborted) break;
      const isOshi = Store.isOshi(member.name);
      const groupName = getGroupName(member.group || "nogizaka");
      const tag = isOshi ? "oshi" : "normal";

      for (const source of sources) {
        if (this._aborted) break;
        step++;
        const progress = (step / totalSteps) * 100;

        let items = [];
        try {
          switch (source) {
            case "google":
              onProgress({ type: tag, message: `${isOshi ? "★推し " : ""}Google画像検索: ${member.name}`, progress });
              items = await this._googleImageSearch(member.name, groupName, isOshi);
              break;
            case "blog":
              onProgress({ type: tag, message: `${isOshi ? "★推し " : ""}公式ブログ: ${member.name}`, progress });
              items = await this._scrapeBlog(member);
              break;
            case "fansite":
              onProgress({ type: tag, message: `${isOshi ? "★推し " : ""}まとめサイト: ${member.name}`, progress });
              items = await this._scrapeFanSites(member.name, groupName);
              break;
            case "pinterest":
              onProgress({ type: tag, message: `${isOshi ? "★推し " : ""}Pinterest: ${member.name}`, progress });
              items = await this._scrapePinterest(member.name, groupName);
              break;
          }
        } catch (e) {
          console.warn(`${source} failed for ${member.name}:`, e.message);
        }

        // メンバー情報を付与
        items = items.map(item => ({
          ...item,
          member: member.name,
          group: member.group,
          source,
        }));

        collected.push(...items);

        if (items.length > 0) {
          onProgress({ type: tag, message: `  → ${items.length}件取得 (${source})`, progress });
        }

        await this._sleep(800);
      }
    }

    return collected;
  },

  // ============================
  // YouTube動画検索
  // ============================
  async scrapeYoutube(memberList, onProgress) {
    this._aborted = false;
    const settings = Store.getSettings();
    const apiKey = settings.ytApiKey;
    const collected = [];

    if (!apiKey) {
      onProgress({ type: "err", message: "YouTube APIキーが未設定です（設定タブで入力）", progress: 100 });
      return collected;
    }

    for (let i = 0; i < memberList.length; i++) {
      if (this._aborted) break;
      const member = memberList[i];
      const isOshi = Store.isOshi(member.name);
      const maxResults = isOshi ? 10 : 3;
      const groupName = getGroupName(member.group || "nogizaka");
      const query = `${groupName} ${member.name}`;

      onProgress({
        type: isOshi ? "oshi" : "normal",
        message: `${isOshi ? "★推し " : ""}YouTube検索: ${query}`,
        progress: (i / memberList.length) * 100,
      });

      const videos = await this._searchYoutube(query, apiKey, maxResults);
      const items = videos.map(v => ({
        url: `https://www.youtube.com/watch?v=${v.id}`,
        member: member.name,
        group: member.group,
        type: "video",
        thumbUrl: v.thumbnail,
        title: v.title,
        source: "youtube",
        date: v.publishedAt?.slice(0, 10) || "",
      }));

      collected.push(...items);
      onProgress({
        type: isOshi ? "oshi" : "normal",
        message: `  → ${videos.length}件の動画`,
        progress: ((i + 1) / memberList.length) * 100,
      });

      if (i < memberList.length - 1) await this._sleep(500);
    }
    return collected;
  },

  // ============================
  // 1. Google Custom Search API (画像)
  // ============================
  async _googleImageSearch(memberName, groupName, isOshi) {
    const settings = Store.getSettings();
    const apiKey = settings.googleApiKey;
    const cx = settings.googleCx;

    if (!apiKey || !cx) return [];

    const queries = [
      `${groupName} ${memberName}`,
      `${memberName} グラビア 写真`,
    ];
    // 推しは追加クエリ
    if (isOshi) {
      queries.push(`${memberName} 高画質`);
    }

    const allImages = [];
    for (const q of queries) {
      try {
        const params = new URLSearchParams({
          key: apiKey,
          cx,
          q,
          searchType: "image",
          num: "10",
          imgSize: "large",
          safe: "off",
        });
        const res = await fetch(
          `https://www.googleapis.com/customsearch/v1?${params}`,
          { signal: AbortSignal.timeout(10000) }
        );
        if (!res.ok) continue;
        const data = await res.json();
        for (const item of (data.items || [])) {
          if (this._isValidImage(item.link)) {
            allImages.push({
              url: item.link,
              thumbUrl: item.image?.thumbnailLink || item.link,
              title: item.title || `${memberName} - Google`,
              type: "image",
              date: new Date().toISOString().slice(0, 10),
            });
          }
        }
      } catch (e) {
        console.warn("Google search error:", e.message);
      }
      await this._sleep(300);
    }

    return this._dedup(allImages);
  },

  // ============================
  // 2. 公式ブログ
  // ============================
  async _scrapeBlog(member) {
    const blogUrl = getMemberBlogUrl(member);
    const html = await this._fetchWithProxy(blogUrl);
    if (!html) return [];

    const images = this._extractImageUrls(html, blogUrl);
    return images.map(url => ({
      url,
      thumbUrl: url,
      title: `${member.name} 公式ブログ`,
      type: "image",
      date: new Date().toISOString().slice(0, 10),
    }));
  },

  // ============================
  // 3. ファンサイト・まとめサイト
  // ============================
  async _scrapeFanSites(memberName, groupName) {
    const allImages = [];

    // まとめサイトのURL候補を検索クエリで構築
    const searchTargets = [
      { url: `https://matomedane.jp/search?q=${encodeURIComponent(groupName + " " + memberName)}`, name: "まとめだね" },
      { url: `https://aikru.com/search?q=${encodeURIComponent(memberName)}`, name: "AIKRU" },
    ];

    for (const target of searchTargets) {
      try {
        const html = await this._fetchWithProxy(target.url);
        if (!html) continue;
        const images = this._extractImageUrls(html, target.url);
        for (const url of images.slice(0, 20)) {
          allImages.push({
            url,
            thumbUrl: url,
            title: `${memberName} - ${target.name}`,
            type: "image",
            date: new Date().toISOString().slice(0, 10),
          });
        }
      } catch (e) {
        console.warn(`Fansite ${target.name} failed:`, e.message);
      }
      await this._sleep(500);
    }

    return this._dedup(allImages);
  },

  // ============================
  // 4. Pinterest
  // ============================
  async _scrapePinterest(memberName, groupName) {
    const allImages = [];
    const query = `${groupName} ${memberName}`;
    const pinterestUrl = `https://www.pinterest.com/search/pins/?q=${encodeURIComponent(query)}`;

    try {
      const html = await this._fetchWithProxy(pinterestUrl);
      if (!html) return [];

      // Pinterest HTML内の画像URLを抽出
      // Pinterest は JSON-LD やスクリプト内にデータを埋め込む
      const imgRegex = /https:\/\/i\.pinimg\.com\/[^"'\s]+\.(?:jpg|jpeg|png|webp)/gi;
      const matches = html.match(imgRegex) || [];
      const seen = new Set();

      for (const url of matches) {
        // originals 版に変換（高画質化）
        const highRes = url.replace(/\/\d+x\d*\//, "/originals/").replace(/\/236x\//, "/originals/").replace(/\/474x\//, "/originals/").replace(/\/736x\//, "/originals/");
        if (seen.has(highRes)) continue;
        seen.add(highRes);

        allImages.push({
          url: highRes,
          thumbUrl: url,
          title: `${memberName} - Pinterest`,
          type: "image",
          date: new Date().toISOString().slice(0, 10),
        });
      }
    } catch (e) {
      console.warn("Pinterest scrape failed:", e.message);
    }

    return allImages.slice(0, 30);
  },

  // ============================
  // YouTube Data API
  // ============================
  async _searchYoutube(query, apiKey, maxResults) {
    try {
      const params = new URLSearchParams({
        part: "snippet",
        q: query,
        type: "video",
        maxResults: String(maxResults),
        order: "relevance",
        key: apiKey,
      });
      const res = await fetch(
        `https://www.googleapis.com/youtube/v3/search?${params}`,
        { signal: AbortSignal.timeout(10000) }
      );
      if (!res.ok) return [];
      const data = await res.json();
      return (data.items || []).map(item => ({
        id: item.id.videoId,
        title: item.snippet.title,
        thumbnail: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url || "",
        publishedAt: item.snippet.publishedAt,
      }));
    } catch (e) {
      console.warn("YouTube search failed:", e.message);
      return [];
    }
  },

  // ============================
  // ユーティリティ
  // ============================

  /** CORSプロキシのフォールバック付きfetch */
  async _fetchWithProxy(url) {
    const settings = Store.getSettings();
    const proxies = [
      settings.corsProxy,
      ...CORS_PROXIES,
    ].filter(Boolean);

    // 重複排除
    const uniqueProxies = [...new Set(proxies)];

    for (const proxy of uniqueProxies) {
      try {
        const fetchUrl = `${proxy}${encodeURIComponent(url)}`;
        const res = await fetch(fetchUrl, { signal: AbortSignal.timeout(12000) });
        if (res.ok) {
          return await res.text();
        }
      } catch (e) {
        // 次のプロキシを試行
      }
    }

    // プロキシなしで直接試行
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
      if (res.ok) return await res.text();
    } catch (e) {
      // CORS blocked - expected
    }

    return null;
  },

  /** 画像をblob経由でダウンロード */
  async downloadImage(url) {
    const settings = Store.getSettings();
    const proxies = [settings.corsProxy, ...CORS_PROXIES].filter(Boolean);
    const uniqueProxies = [...new Set(proxies)];

    // まず直接取得を試す
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
      if (res.ok) {
        const contentType = res.headers.get("content-type") || "";
        if (contentType.startsWith("image/")) {
          return await res.blob();
        }
      }
    } catch (e) { /* CORS */ }

    // プロキシ経由
    for (const proxy of uniqueProxies) {
      try {
        const fetchUrl = `${proxy}${encodeURIComponent(url)}`;
        const res = await fetch(fetchUrl, { signal: AbortSignal.timeout(12000) });
        if (res.ok) {
          const blob = await res.blob();
          if (blob.size > 1000) return blob; // 小さすぎるのはエラーページ
        }
      } catch (e) { /* next */ }
    }

    return null;
  },

  /** HTMLから画像URLを抽出 */
  _extractImageUrls(html, baseUrl) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const urls = new Set();

    // 記事内画像
    const selectors = [
      "article img", ".blog-entry img", ".entry img", ".post img",
      ".article-body img", ".content img", ".main img",
      // まとめサイト系
      ".entry-content img", ".post-content img", ".article-content img",
    ];
    let imgs = [];
    for (const sel of selectors) {
      imgs.push(...doc.querySelectorAll(sel));
    }
    if (imgs.length === 0) {
      imgs = [...doc.querySelectorAll("img")];
    }

    for (const img of imgs) {
      const src = img.getAttribute("data-original")
        || img.getAttribute("data-src")
        || img.getAttribute("data-lazy-src")
        || img.getAttribute("src")
        || "";
      if (!src || src.startsWith("data:")) continue;

      try {
        const fullUrl = new URL(src, baseUrl).href;
        if (this._isValidImage(fullUrl)) {
          urls.add(fullUrl);
        }
      } catch (e) { /* invalid URL */ }
    }

    // og:image
    for (const meta of doc.querySelectorAll('meta[property="og:image"]')) {
      const content = meta.getAttribute("content") || "";
      if (content) {
        try { urls.add(new URL(content, baseUrl).href); } catch (e) { /* */ }
      }
    }

    // リンク先画像 (href が画像URLの場合)
    for (const a of doc.querySelectorAll("a[href]")) {
      const href = a.getAttribute("href") || "";
      if (this._isValidImage(href)) {
        try { urls.add(new URL(href, baseUrl).href); } catch (e) { /* */ }
      }
    }

    return [...urls];
  },

  _isValidImage(url) {
    if (!url) return false;
    const lower = url.toLowerCase();
    const validExts = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
    const hasExt = validExts.some(ext => lower.includes(ext));

    const excludes = [
      "icon", "logo", "sprite", "favicon", "emoji",
      "pixel", "spacer", "button", "arrow", "ad_", "1x1",
      "tracking", "badge", "avatar_s", "profile_s",
      "banner_ad", "adsense", "doubleclick",
    ];
    const excluded = excludes.some(p => lower.includes(p));

    return hasExt && !excluded;
  },

  _dedup(items) {
    const seen = new Set();
    return items.filter(item => {
      if (seen.has(item.url)) return false;
      seen.add(item.url);
      return true;
    });
  },

  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },
};

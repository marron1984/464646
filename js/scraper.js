/**
 * ブラウザベースのスクレイパー
 * CORSプロキシ経由でブログ画像取得 + YouTube Data API
 */

const Scraper = {
  _aborted: false,

  abort() { this._aborted = true; },

  /**
   * ブログ画像を収集
   */
  async scrapeBlog(memberList, onProgress) {
    this._aborted = false;
    const settings = Store.getSettings();
    const proxy = settings.corsProxy || "";
    const collected = [];

    for (let i = 0; i < memberList.length; i++) {
      if (this._aborted) break;
      const member = memberList[i];
      const isOshi = Store.isOshi(member.name);

      onProgress({
        type: isOshi ? "oshi" : "normal",
        message: `${isOshi ? "★推し " : ""}${member.name} のブログを取得中...`,
        progress: (i / memberList.length) * 100,
      });

      const blogUrl = getMemberBlogUrl(member);
      const images = await this._fetchBlogImages(blogUrl, proxy);

      const items = images.map(url => ({
        url,
        member: member.name,
        type: "image",
        thumbUrl: url,
        title: `${member.name} ブログ`,
        date: new Date().toISOString().slice(0, 10),
      }));

      collected.push(...items);

      onProgress({
        type: isOshi ? "oshi" : "normal",
        message: `${member.name}: ${images.length}枚の画像を発見`,
        progress: ((i + 1) / memberList.length) * 100,
      });

      // レート制限
      if (i < memberList.length - 1) {
        await this._sleep(1500);
      }
    }

    return collected;
  },

  /**
   * YouTube動画を検索
   */
  async scrapeYoutube(memberList, onProgress) {
    this._aborted = false;
    const settings = Store.getSettings();
    const apiKey = settings.ytApiKey;
    const collected = [];

    if (!apiKey) {
      onProgress({
        type: "err",
        message: "YouTube APIキーが未設定です。設定タブで入力してください。",
        progress: 100,
      });
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
        type: "video",
        thumbUrl: v.thumbnail,
        title: v.title,
        date: v.publishedAt?.slice(0, 10) || "",
      }));

      collected.push(...items);

      onProgress({
        type: isOshi ? "oshi" : "normal",
        message: `${member.name}: ${videos.length}件の動画を発見`,
        progress: ((i + 1) / memberList.length) * 100,
      });

      if (i < memberList.length - 1) {
        await this._sleep(500);
      }
    }

    return collected;
  },

  // --- 内部メソッド ---

  async _fetchBlogImages(blogUrl, proxy) {
    try {
      const fetchUrl = proxy ? `${proxy}${encodeURIComponent(blogUrl)}` : blogUrl;
      const res = await fetch(fetchUrl, { signal: AbortSignal.timeout(15000) });
      if (!res.ok) return [];
      const html = await res.text();
      return this._extractImageUrls(html, blogUrl);
    } catch (e) {
      console.warn("Blog fetch failed:", blogUrl, e.message);
      return [];
    }
  },

  _extractImageUrls(html, baseUrl) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const urls = new Set();

    // 記事内画像
    const selectors = ["article img", ".blog-entry img", ".entry img", ".post img"];
    let imgs = [];
    for (const sel of selectors) {
      imgs.push(...doc.querySelectorAll(sel));
    }
    // フォールバック: 全画像
    if (imgs.length === 0) {
      imgs = [...doc.querySelectorAll("img")];
    }

    for (const img of imgs) {
      const src = img.getAttribute("data-src") || img.getAttribute("src") || "";
      if (!src || src.startsWith("data:")) continue;

      const fullUrl = new URL(src, baseUrl).href;
      if (this._isValidImage(fullUrl)) {
        urls.add(fullUrl);
      }
    }

    return [...urls];
  },

  _isValidImage(url) {
    const lower = url.toLowerCase();
    const validExts = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
    const hasExt = validExts.some(ext => lower.includes(ext));

    const excludes = [
      "icon", "logo", "sprite", "favicon", "emoji",
      "pixel", "spacer", "button", "arrow", "ad_", "1x1", "tracking",
    ];
    const excluded = excludes.some(p => lower.includes(p));

    return hasExt && !excluded;
  },

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
      if (!res.ok) {
        console.warn("YouTube API error:", res.status);
        return [];
      }
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

  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },
};

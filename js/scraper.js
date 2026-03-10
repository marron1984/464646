/**
 * マルチソース画像・動画スクレイパー
 *
 * 方式:
 *  - 検索リンク生成（即座・確実）: Google画像検索 / Pinterest / まとめサイト / 公式ブログ
 *  - API取得（設定要）: Google Custom Search API / YouTube Data API
 */

const CORS_PROXIES = [
  "https://corsproxy.io/?",
  "https://api.allorigins.win/raw?url=",
  "https://api.codetabs.com/v1/proxy?quest=",
];

const Scraper = {
  _aborted: false,
  abort() { this._aborted = true; },

  // ============================
  // メイン: 検索リンク生成 + API取得
  // ============================
  async scrapeImages(memberList, sources, onProgress) {
    this._aborted = false;
    const collected = [];
    let step = 0;
    const totalSteps = memberList.length;

    for (const member of memberList) {
      if (this._aborted) break;
      step++;
      const isOshi = Store.isOshi(member.name);
      const groupName = getGroupName(member.group || "nogizaka");
      const tag = isOshi ? "oshi" : "normal";
      const progress = (step / totalSteps) * 100;

      onProgress({ type: tag, message: `${isOshi ? "★推し " : ""}${member.name} のリンクを生成中...`, progress });

      // --- 検索リンク生成（即座） ---
      if (sources.includes("google")) {
        collected.push(...this._googleSearchLinks(member.name, groupName));
      }
      if (sources.includes("pinterest")) {
        collected.push(...this._pinterestSearchLinks(member.name, groupName));
      }
      if (sources.includes("fansite")) {
        collected.push(...this._fansiteSearchLinks(member.name, groupName));
      }
      if (sources.includes("blog")) {
        collected.push(this._blogLink(member));
      }

      // --- Google Custom Search API（設定済みの場合） ---
      if (sources.includes("google")) {
        const apiItems = await this._googleApiSearch(member.name, groupName, isOshi);
        collected.push(...apiItems);
        if (apiItems.length > 0) {
          onProgress({ type: tag, message: `  → API: ${apiItems.length}枚取得`, progress });
        }
      }

      onProgress({ type: tag, message: `  → ${member.name} 完了`, progress });
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
      // APIキーなし → YouTube検索リンクを生成
      for (const member of memberList) {
        const groupName = getGroupName(member.group || "nogizaka");
        const q = `${groupName} ${member.name}`;
        collected.push({
          url: `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`,
          member: member.name,
          type: "link",
          thumbUrl: "",
          title: `${member.name} - YouTube検索`,
          source: "youtube",
          linkIcon: "yt",
          date: new Date().toISOString().slice(0, 10),
        });
      }
      onProgress({ type: "normal", message: "YouTube APIキー未設定 → 検索リンクを生成", progress: 100 });
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
  // 検索リンク生成（即座・CORS不要）
  // ============================

  _googleSearchLinks(memberName, groupName) {
    const queries = [
      `${groupName} ${memberName} 高画質`,
      `${memberName} グラビア 写真`,
      `${memberName} 画像`,
    ];
    return queries.map(q => ({
      url: `https://www.google.com/search?q=${encodeURIComponent(q)}&tbm=isch`,
      member: memberName,
      type: "link",
      thumbUrl: "",
      title: `Google画像: ${q}`,
      source: "google",
      linkIcon: "google",
      date: new Date().toISOString().slice(0, 10),
    }));
  },

  _pinterestSearchLinks(memberName, groupName) {
    const queries = [
      `${groupName} ${memberName}`,
      `${memberName} 乃木坂 日向坂 櫻坂`,
    ];
    return queries.map(q => ({
      url: `https://www.pinterest.com/search/pins/?q=${encodeURIComponent(q)}`,
      member: memberName,
      type: "link",
      thumbUrl: "",
      title: `Pinterest: ${q}`,
      source: "pinterest",
      linkIcon: "pinterest",
      date: new Date().toISOString().slice(0, 10),
    }));
  },

  _fansiteSearchLinks(memberName, groupName) {
    const sites = [
      { name: "Twitter/X", url: `https://x.com/search?q=${encodeURIComponent(groupName + " " + memberName + " filter:images")}&f=image`, icon: "x" },
      { name: "まとめだね", url: `https://matomedane.jp/search?q=${encodeURIComponent(groupName + " " + memberName)}`, icon: "matome" },
      { name: "AIKRU", url: `https://aikru.com/search?q=${encodeURIComponent(memberName)}`, icon: "matome" },
      { name: "Bing画像", url: `https://www.bing.com/images/search?q=${encodeURIComponent(groupName + " " + memberName)}`, icon: "bing" },
    ];
    return sites.map(s => ({
      url: s.url,
      member: memberName,
      type: "link",
      thumbUrl: "",
      title: `${s.name}: ${memberName}`,
      source: "fansite",
      linkIcon: s.icon,
      date: new Date().toISOString().slice(0, 10),
    }));
  },

  _blogLink(member) {
    const blogUrl = getMemberBlogUrl(member);
    return {
      url: blogUrl,
      member: member.name,
      type: "link",
      thumbUrl: "",
      title: `${member.name} 公式ブログ`,
      source: "blog",
      linkIcon: "blog",
      date: new Date().toISOString().slice(0, 10),
    };
  },

  // ============================
  // Google Custom Search API（任意）
  // ============================
  async _googleApiSearch(memberName, groupName, isOshi) {
    const settings = Store.getSettings();
    const apiKey = settings.googleApiKey;
    const cx = settings.googleCx;
    if (!apiKey || !cx) return [];

    const queries = [`${groupName} ${memberName}`];
    if (isOshi) queries.push(`${memberName} 高画質`);

    const allImages = [];
    for (const q of queries) {
      try {
        const params = new URLSearchParams({
          key: apiKey, cx, q,
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
          allImages.push({
            url: item.link,
            thumbUrl: item.image?.thumbnailLink || item.link,
            title: item.title || `${memberName} - Google`,
            member: memberName,
            type: "image",
            source: "google-api",
            date: new Date().toISOString().slice(0, 10),
          });
        }
      } catch (e) {
        console.warn("Google API error:", e.message);
      }
      await this._sleep(300);
    }
    return allImages;
  },

  // ============================
  // YouTube Data API
  // ============================
  async _searchYoutube(query, apiKey, maxResults) {
    try {
      const params = new URLSearchParams({
        part: "snippet", q: query, type: "video",
        maxResults: String(maxResults), order: "relevance", key: apiKey,
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
  // 画像ダウンロード（blob経由）
  // ============================
  async downloadImage(url) {
    const settings = Store.getSettings();
    const proxies = [settings.corsProxy, ...CORS_PROXIES].filter(Boolean);
    const uniqueProxies = [...new Set(proxies)];

    // 直接取得
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
      if (res.ok) {
        const ct = res.headers.get("content-type") || "";
        if (ct.startsWith("image/")) return await res.blob();
      }
    } catch (e) { /* CORS */ }

    // プロキシ経由
    for (const proxy of uniqueProxies) {
      try {
        const fetchUrl = `${proxy}${encodeURIComponent(url)}`;
        const res = await fetch(fetchUrl, { signal: AbortSignal.timeout(12000) });
        if (res.ok) {
          const blob = await res.blob();
          if (blob.size > 1000) return blob;
        }
      } catch (e) { /* next */ }
    }
    return null;
  },

  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },
};

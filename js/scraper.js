/**
 * マルチソース画像スクレイパー
 *
 * 画像を実際に取得するソース:
 *  1. 公式ブログ一覧ページ（グループ単位 → CORSプロキシ経由）
 *  2. blogara.jp（ブログまとめ → CORSプロキシ経由）
 *  3. Google Custom Search API（任意・APIキー要）
 *  4. YouTube Data API（APIキー要）
 *
 * 検索リンク生成（クリックで新タブ）:
 *  - Google画像検索 / Pinterest / X / Bing / まとめサイト
 */

// 外部CORSプロキシ（自前プロキシ失敗時のフォールバック）
const CORS_PROXIES = [
  "https://corsproxy.io/?",
  "https://api.allorigins.win/raw?url=",
  "https://api.codetabs.com/v1/proxy?quest=",
];

// 自前Vercelプロキシ（最優先）
function getSelfProxyUrl(targetUrl) {
  return `/api/proxy?url=${encodeURIComponent(targetUrl)}`;
}

const Scraper = {
  _aborted: false,
  abort() { this._aborted = true; },

  // ============================
  // メイン
  // ============================
  async scrapeImages(memberList, sources, onProgress) {
    this._aborted = false;
    const collected = [];
    const targetGroups = [...new Set(memberList.map(m => m.group || "nogizaka"))];
    const memberNames = new Set(memberList.map(m => m.name));

    let step = 0;
    const totalSteps = targetGroups.length * 2 + memberList.length; // blog+blogara per group + links per member

    // --- 1a. グループ一覧ページから画像スクレイピング ---
    if (sources.includes("blog")) {
      for (const group of targetGroups) {
        if (this._aborted) break;
        step++;
        const groupName = getGroupName(group);
        onProgress({ type: "oshi", message: `${groupName} 公式ブログ一覧を取得中...`, progress: (step / totalSteps) * 100 });

        const blogUrl = getGroupBlogListUrl(group);
        const blogImages = await this._scrapePage(blogUrl, groupName, memberList.filter(m => m.group === group));
        collected.push(...blogImages);

        onProgress({
          type: blogImages.length > 0 ? "done" : "err",
          message: blogImages.length > 0 ? `  → ${groupName}: ${blogImages.length}枚の画像を取得` : `  → ${groupName}: 画像なし（サイトがブロック or 構造変更の可能性）`,
          progress: (step / totalSteps) * 100,
        });
        await this._sleep(500);
      }

      // --- 1b. 推しメンバーのブログ記事から画像取得 ---
      const oshiWithCt = memberList.filter(m => Store.isOshi(m.name) && m.ct);
      for (const member of oshiWithCt) {
        if (this._aborted) break;

        onProgress({ type: "oshi", message: `★推し ${member.name} のブログを取得中...`, progress: (step / totalSteps) * 100 });

        let memberImages = [];

        // 方法1: JSON API（乃木坂・櫻坂で利用可能）
        memberImages = await this._scrapeViaApi(member, onProgress);

        // 方法2: HTML一覧ページ（APIが使えない場合 / 日向坂）
        if (memberImages.length === 0) {
          memberImages = await this._scrapeHtmlPages(member);
        }

        if (memberImages.length > 0) {
          collected.push(...memberImages);
          onProgress({
            type: "done",
            message: `  → ${member.name}: ${memberImages.length}枚の画像を発見`,
            progress: (step / totalSteps) * 100,
          });
        } else {
          onProgress({ type: "err", message: `  → ${member.name}: 取得失敗`, progress: (step / totalSteps) * 100 });
        }
        await this._sleep(500);
      }
    }

    // --- 2. blogara.jp（ブログまとめサイト）---
    if (sources.includes("fansite")) {
      for (const group of targetGroups) {
        if (this._aborted) break;
        step++;
        const groupName = getGroupName(group);
        onProgress({ type: "oshi", message: `blogara.jp (${groupName}) を取得中...`, progress: (step / totalSteps) * 100 });

        const blogaraUrl = getGroupBlogaraUrl(group);
        const blogaraImages = await this._scrapePage(blogaraUrl, `blogara - ${groupName}`, memberList.filter(m => m.group === group));
        collected.push(...blogaraImages);

        onProgress({
          type: blogaraImages.length > 0 ? "done" : "err",
          message: blogaraImages.length > 0 ? `  → blogara: ${blogaraImages.length}枚` : `  → blogara: 取得失敗`,
          progress: (step / totalSteps) * 100,
        });
        await this._sleep(500);
      }
    }

    // --- 3. Google Custom Search API（設定済みなら）---
    if (sources.includes("google")) {
      const settings = Store.getSettings();
      if (settings.googleApiKey) {
        for (const member of memberList) {
          if (this._aborted) break;
          const isOshi = Store.isOshi(member.name);
          const groupName = getGroupName(member.group || "nogizaka");
          onProgress({ type: isOshi ? "oshi" : "normal", message: `Google API: ${member.name}`, progress: (step / totalSteps) * 100 });

          const apiItems = await this._googleApiSearch(member.name, groupName, isOshi);
          collected.push(...apiItems.map(i => ({ ...i, member: member.name })));

          if (apiItems.length > 0) {
            onProgress({ type: "done", message: `  → ${apiItems.length}枚`, progress: (step / totalSteps) * 100 });
          }
          await this._sleep(400);
        }
      }
    }

    // --- 4. 検索リンク生成（即座・確実）---
    for (const member of memberList) {
      if (this._aborted) break;
      step++;
      const isOshi = Store.isOshi(member.name);
      const groupName = getGroupName(member.group || "nogizaka");

      const links = this._generateSearchLinks(member.name, groupName, sources);
      collected.push(...links.map(l => ({ ...l, member: member.name })));
    }

    onProgress({ type: "done", message: `検索リンク: ${memberList.length}人分生成`, progress: (step / totalSteps) * 100 });

    return collected;
  },

  // ============================
  // YouTube
  // ============================
  async scrapeYoutube(memberList, onProgress) {
    this._aborted = false;
    const settings = Store.getSettings();
    const apiKey = settings.ytApiKey;
    const collected = [];

    // APIキーなし → 検索リンク
    if (!apiKey) {
      for (const member of memberList) {
        const groupName = getGroupName(member.group || "nogizaka");
        const q = `${groupName} ${member.name}`;
        collected.push({
          url: `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`,
          member: member.name,
          type: "link",
          thumbUrl: "",
          title: `YouTube: ${member.name}`,
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
        message: `${isOshi ? "★推し " : ""}YouTube: ${member.name}`,
        progress: (i / memberList.length) * 100,
      });

      const videos = await this._searchYoutube(query, apiKey, maxResults);
      collected.push(...videos.map(v => ({
        url: `https://www.youtube.com/watch?v=${v.id}`,
        member: member.name,
        type: "video",
        thumbUrl: v.thumbnail,
        title: v.title,
        source: "youtube",
        date: v.publishedAt?.slice(0, 10) || "",
      })));

      onProgress({
        type: isOshi ? "oshi" : "normal",
        message: `  → ${videos.length}件`,
        progress: ((i + 1) / memberList.length) * 100,
      });

      if (i < memberList.length - 1) await this._sleep(500);
    }
    return collected;
  },

  // ============================
  // JSON API経由ブログ画像取得
  // ============================
  async _scrapeViaApi(member, onProgress) {
    const apiUrl = getMemberBlogApiUrl(member, 5); // 最新5記事
    if (!apiUrl) return [];

    try {
      const json = await this._fetchJson(apiUrl);
      if (!json || !json.data) {
        console.warn(`[API] No data from ${apiUrl}`);
        return [];
      }

      const posts = json.data || [];
      console.log(`[API] ${member.name}: ${posts.length} posts found`);

      const allImages = [];

      for (const post of posts.slice(0, 5)) {
        if (this._aborted) break;

        // 記事詳細ページURL構築
        const postLink = post.link || "";
        if (!postLink) continue;

        // 記事ページのHTMLから画像を抽出
        const fullUrl = postLink.startsWith("http") ? postLink : `https://${this._getGroupDomain(member.group)}${postLink}`;
        const html = await this._fetchWithProxy(fullUrl);
        if (!html) continue;

        const images = this._extractBlogPostImages(html, fullUrl);
        const postDate = post.pubdate?.slice(0, 10) || new Date().toISOString().slice(0, 10);

        for (const imgUrl of images) {
          allImages.push({
            url: imgUrl,
            thumbUrl: imgUrl,
            title: `${member.name} - ${post.title || "ブログ"}`,
            member: member.name,
            type: "image",
            source: "blog-api",
            date: postDate,
          });
        }

        await this._sleep(300);
      }

      return allImages;
    } catch (e) {
      console.warn(`[API] Error for ${member.name}:`, e.message);
      return [];
    }
  },

  /** HTML一覧ページから画像取得（日向坂等、APIなしグループ用） */
  async _scrapeHtmlPages(member) {
    const memberBlogUrl = getMemberBlogUrl(member);
    if (!memberBlogUrl) return [];

    const allImages = [];
    // 最大2ページ取得
    for (let page = 0; page < 2; page++) {
      if (this._aborted) break;
      const pageUrl = page === 0 ? memberBlogUrl : `${memberBlogUrl}&page=${page}`;
      const html = await this._fetchWithProxy(pageUrl);
      if (!html) break;

      const images = this._extractBlogPostImages(html, pageUrl);
      if (images.length === 0) break; // これ以上ページがない

      for (const imgUrl of images) {
        allImages.push({
          url: imgUrl,
          thumbUrl: imgUrl,
          title: `${member.name} - ブログ`,
          member: member.name,
          type: "image",
          source: "blog",
          date: new Date().toISOString().slice(0, 10),
        });
      }
      await this._sleep(500);
    }
    return allImages;
  },

  _getGroupDomain(group) {
    const domains = {
      nogizaka: "www.nogizaka46.com",
      hinatazaka: "www.hinatazaka46.com",
      sakurazaka: "sakurazaka46.com",
    };
    return domains[group] || domains.nogizaka;
  },

  /** JSON APIフェッチ（プロキシ経由） */
  async _fetchJson(url) {
    // 自前プロキシ優先
    try {
      const res = await fetch(getSelfProxyUrl(url), {
        signal: AbortSignal.timeout(15000),
        headers: { "Accept": "application/json,*/*" },
      });
      if (res.ok) {
        const text = await res.text();
        try { return JSON.parse(text); } catch { /* not JSON */ }
      }
    } catch (e) {
      console.warn(`[fetchJson] Self-proxy failed:`, e.message);
    }

    // 外部プロキシ
    const settings = Store.getSettings();
    const proxies = [settings.corsProxy, ...CORS_PROXIES].filter(Boolean);
    for (const proxy of [...new Set(proxies)]) {
      try {
        const res = await fetch(`${proxy}${encodeURIComponent(url)}`, {
          signal: AbortSignal.timeout(12000),
          headers: { "Accept": "application/json,*/*" },
        });
        if (res.ok) {
          const text = await res.text();
          try { return JSON.parse(text); } catch { /* not JSON */ }
        }
      } catch (e) { /* next */ }
    }
    return null;
  },

  /** ブログ記事詳細ページから画像URLを抽出（確認済みセレクタ使用） */
  _extractBlogPostImages(html, baseUrl) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const urls = new Set();

    // 確認済みセレクタ（グループ別に最適なものを順番に試す）
    const entrySelectors = [
      // 乃木坂46（旧サイト互換 + 新サイト）
      ".entrybody",
      // 日向坂46
      ".c-blog-article__text",
      // 櫻坂46 / 共通
      ".p-blog-article__text",
      ".bd-blog-detail__content",
      // フォールバック
      "article",
      ".content",
    ];

    // コンテナ要素を特定
    let containers = [];
    for (const sel of entrySelectors) {
      try {
        const found = doc.querySelectorAll(sel);
        if (found.length > 0) {
          containers = [...found];
          break;
        }
      } catch (e) { /* */ }
    }

    // コンテナ内から画像を抽出
    for (const container of containers) {
      // 1. リンク先が画像の場合、高画質版を優先取得（a[href] → img[src]）
      for (const a of container.querySelectorAll("a[href]")) {
        const href = a.getAttribute("href") || "";
        if (this._isValidImage(href)) {
          try {
            urls.add(new URL(href, baseUrl).href);
          } catch (e) { /* */ }
          continue; // リンク先が画像なら、中のimgは取らない（サムネだから）
        }
        // リンク先が画像でない場合、中のimgを取る
        for (const img of a.querySelectorAll("img")) {
          this._addImgSrc(img, baseUrl, urls);
        }
      }

      // 2. リンクに包まれていないimg
      for (const img of container.querySelectorAll("img")) {
        if (img.closest("a")) continue; // 上で処理済み
        this._addImgSrc(img, baseUrl, urls);
      }
    }

    // コンテナが見つからない場合は全imgフォールバック
    if (containers.length === 0) {
      for (const img of doc.querySelectorAll("img")) {
        this._addImgSrc(img, baseUrl, urls);
      }
    }

    return [...urls];
  },

  /** img要素からsrcを取得してSetに追加 */
  _addImgSrc(img, baseUrl, urls) {
    const src = img.getAttribute("data-original")
      || img.getAttribute("data-src")
      || img.getAttribute("data-lazy-src")
      || img.getAttribute("src")
      || "";
    if (!src || src.startsWith("data:")) return;
    try {
      const fullUrl = new URL(src, baseUrl).href;
      if (this._isValidImage(fullUrl)) {
        urls.add(fullUrl);
      }
    } catch (e) { /* */ }
  },

  // ============================
  // ページスクレイピング（CORSプロキシ経由）
  // ============================
  async _scrapePage(url, sourceName, memberList, onProgress) {
    const html = await this._fetchWithProxy(url);
    if (!html) {
      console.warn(`[scrapePage] No HTML returned for ${url}`);
      return [];
    }
    console.log(`[scrapePage] Got ${html.length} bytes from ${url}`);

    const images = this._extractImageUrls(html, url);
    console.log(`[scrapePage] Extracted ${images.length} images from ${sourceName}`);
    const memberNameSet = new Set(memberList.map(m => m.name));

    return images.map(imgUrl => {
      // 画像周辺のHTMLからメンバー名を推定
      const guessedMember = this._guessImageMember(html, imgUrl, memberList) || "";

      return {
        url: imgUrl,
        thumbUrl: imgUrl,
        title: `${guessedMember || "?"} - ${sourceName}`,
        member: guessedMember || sourceName,
        type: "image",
        source: "blog",
        date: new Date().toISOString().slice(0, 10),
      };
    });
  },

  /** HTMLからメンバー名を推測（画像URL周辺のテキストから） */
  _guessImageMember(html, imgUrl, memberList) {
    // imgUrl周辺のテキスト ±500文字を取得
    const imgIdx = html.indexOf(imgUrl.split("/").pop()); // ファイル名で検索
    if (imgIdx === -1) return memberList[0]?.name || "";

    const context = html.substring(Math.max(0, imgIdx - 500), imgIdx + 500);

    for (const m of memberList) {
      if (context.includes(m.name)) return m.name;
      // 名前の一部でもマッチ
      const parts = m.name.split(/\s/);
      for (const p of parts) {
        if (p.length >= 2 && context.includes(p)) return m.name;
      }
    }

    return memberList[0]?.name || "";
  },

  // ============================
  // HTML画像URL抽出（一覧ページ用）
  // ============================
  _extractImageUrls(html, baseUrl) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const urls = new Set();

    // コンテナセレクタ（記事ブロック単位で探す）
    const containerSelectors = [
      // 坂道公式: 記事ブロック
      ".p-blog-article",
      ".entrybody",
      ".c-blog-article__text",
      ".bd-blog-detail__content",
      // blogara
      ".t-body", ".article-image",
      // 汎用
      "article", ".blog-entry", ".entry", ".post",
    ];

    let containers = [];
    for (const sel of containerSelectors) {
      try {
        const found = doc.querySelectorAll(sel);
        if (found.length > 0) {
          containers = [...found];
          break;
        }
      } catch (e) { /* */ }
    }

    // コンテナ内の画像を取得（リンク先高画質版を優先）
    const processContainer = (container) => {
      // リンク先が画像のa要素
      for (const a of container.querySelectorAll("a[href]")) {
        const href = a.getAttribute("href") || "";
        if (this._isValidImage(href)) {
          try { urls.add(new URL(href, baseUrl).href); } catch (e) { /* */ }
          continue;
        }
        for (const img of a.querySelectorAll("img")) {
          this._addImgSrc(img, baseUrl, urls);
        }
      }
      // リンクなしimg
      for (const img of container.querySelectorAll("img")) {
        if (img.closest("a")) continue;
        this._addImgSrc(img, baseUrl, urls);
      }
    };

    if (containers.length > 0) {
      for (const c of containers) processContainer(c);
    } else {
      // フォールバック: 全img
      for (const img of doc.querySelectorAll("img")) {
        this._addImgSrc(img, baseUrl, urls);
      }
    }

    // og:image
    for (const meta of doc.querySelectorAll('meta[property="og:image"]')) {
      const content = meta.getAttribute("content") || "";
      if (content) {
        try { urls.add(new URL(content, baseUrl).href); } catch (e) { /* */ }
      }
    }

    // background-image in style属性
    for (const el of doc.querySelectorAll("[style]")) {
      const style = el.getAttribute("style") || "";
      const m = style.match(/url\(['"]?([^'")\s]+)['"]?\)/);
      if (m && this._isValidImage(m[1])) {
        try { urls.add(new URL(m[1], baseUrl).href); } catch (e) { /* */ }
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
      "banner_ad", "adsense", "doubleclick", "analytics",
      "1px", "blank.", "transparent.",
    ];
    const excluded = excludes.some(p => lower.includes(p));

    return hasExt && !excluded;
  },

  // ============================
  // 検索リンク生成
  // ============================
  _generateSearchLinks(memberName, groupName, sources) {
    const links = [];
    const today = new Date().toISOString().slice(0, 10);

    if (sources.includes("google")) {
      links.push({
        url: `https://www.google.com/search?q=${encodeURIComponent(groupName + " " + memberName + " 画像")}&tbm=isch`,
        type: "link", thumbUrl: "", title: `Google画像: ${memberName}`,
        source: "google", linkIcon: "google", date: today,
      });
    }
    if (sources.includes("pinterest")) {
      links.push({
        url: `https://www.pinterest.com/search/pins/?q=${encodeURIComponent(groupName + " " + memberName)}`,
        type: "link", thumbUrl: "", title: `Pinterest: ${memberName}`,
        source: "pinterest", linkIcon: "pinterest", date: today,
      });
    }
    if (sources.includes("fansite")) {
      links.push(
        {
          url: `https://x.com/search?q=${encodeURIComponent(groupName + " " + memberName + " filter:images")}&f=image`,
          type: "link", thumbUrl: "", title: `X画像: ${memberName}`,
          source: "fansite", linkIcon: "x", date: today,
        },
        {
          url: `https://www.bing.com/images/search?q=${encodeURIComponent(groupName + " " + memberName)}`,
          type: "link", thumbUrl: "", title: `Bing画像: ${memberName}`,
          source: "fansite", linkIcon: "bing", date: today,
        },
      );
    }
    return links;
  },

  // ============================
  // Google Custom Search API
  // ============================
  async _googleApiSearch(memberName, groupName, isOshi) {
    const settings = Store.getSettings();
    const apiKey = settings.googleApiKey;
    const cx = settings.googleCx || "41221bcf36b6e4848";
    if (!apiKey) return [];

    const queries = [`${groupName} ${memberName}`];
    if (isOshi) queries.push(`${memberName} 高画質`);

    const allImages = [];
    for (const q of queries) {
      try {
        const params = new URLSearchParams({
          key: apiKey, cx, q,
          searchType: "image", num: "10", imgSize: "large", safe: "off",
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
  // CORSプロキシ付きfetch（フォールバック）
  // ============================
  async _fetchWithProxy(url) {
    // 1. 自前Vercelプロキシ（最優先・最速・最も確実）
    try {
      const selfUrl = getSelfProxyUrl(url);
      const res = await fetch(selfUrl, {
        signal: AbortSignal.timeout(20000),
        headers: { "Accept": "text/html,*/*" },
      });
      if (res.ok) {
        const text = await res.text();
        if (text.length > 200 && (text.includes("<") || text.includes("img"))) {
          console.log(`Self-proxy OK for ${url} (${text.length} bytes)`);
          return text;
        }
      }
    } catch (e) {
      console.warn(`Self-proxy failed for ${url}:`, e.message);
    }

    // 2. ユーザー設定 + 外部CORSプロキシ（フォールバック）
    const settings = Store.getSettings();
    const proxies = [settings.corsProxy, ...CORS_PROXIES].filter(Boolean);
    const uniqueProxies = [...new Set(proxies)];

    for (const proxy of uniqueProxies) {
      try {
        const fetchUrl = `${proxy}${encodeURIComponent(url)}`;
        const res = await fetch(fetchUrl, {
          signal: AbortSignal.timeout(15000),
          headers: { "Accept": "text/html,*/*" },
        });
        if (res.ok) {
          const text = await res.text();
          if (text.length > 200 && (text.includes("<") || text.includes("img"))) {
            console.log(`External proxy OK: ${proxy} for ${url}`);
            return text;
          }
        }
      } catch (e) {
        console.warn(`Proxy ${proxy} failed for ${url}:`, e.message);
      }
    }

    // 3. 直接試行（同一オリジンの場合のみ）
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
      if (res.ok) return await res.text();
    } catch (e) { /* CORS */ }

    return null;
  },

  /** 画像をblob経由でダウンロード */
  async downloadImage(url) {
    // 直接
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
      if (res.ok) {
        const ct = res.headers.get("content-type") || "";
        if (ct.startsWith("image/")) return await res.blob();
      }
    } catch (e) { /* CORS */ }

    // 自前プロキシ
    try {
      const res = await fetch(getSelfProxyUrl(url), { signal: AbortSignal.timeout(15000) });
      if (res.ok) {
        const blob = await res.blob();
        if (blob.size > 1000) return blob;
      }
    } catch (e) { /* next */ }

    // 外部プロキシ
    const settings = Store.getSettings();
    const proxies = [settings.corsProxy, ...CORS_PROXIES].filter(Boolean);
    for (const proxy of [...new Set(proxies)]) {
      try {
        const res = await fetch(`${proxy}${encodeURIComponent(url)}`, { signal: AbortSignal.timeout(12000) });
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

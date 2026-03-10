/**
 * localStorage ベースのデータストア
 * 推し設定・収集データ・設定を永続化
 */

const STORE_KEYS = {
  OSHI: "nogi_oshi",
  SETTINGS: "nogi_settings",
  GALLERY: "nogi_gallery",
};

const Store = {
  // --- 推し設定 ---
  getOshi() {
    const raw = localStorage.getItem(STORE_KEYS.OSHI);
    return raw ? JSON.parse(raw) : {
      members: [],
      collectNonOshi: true,
      oshiYoutube: true,
    };
  },

  saveOshi(data) {
    localStorage.setItem(STORE_KEYS.OSHI, JSON.stringify(data));
  },

  isOshi(name) {
    return this.getOshi().members.includes(name);
  },

  addOshi(name) {
    const oshi = this.getOshi();
    if (!oshi.members.includes(name)) {
      oshi.members.push(name);
      this.saveOshi(oshi);
    }
    return oshi;
  },

  removeOshi(name) {
    const oshi = this.getOshi();
    oshi.members = oshi.members.filter(n => n !== name);
    this.saveOshi(oshi);
    return oshi;
  },

  reorderOshi(newOrder) {
    const oshi = this.getOshi();
    oshi.members = newOrder;
    this.saveOshi(oshi);
    return oshi;
  },

  getOshiRank(name) {
    return this.getOshi().members.indexOf(name);
  },

  // --- 設定 ---
  getSettings() {
    const raw = localStorage.getItem(STORE_KEYS.SETTINGS);
    return raw ? JSON.parse(raw) : {
      ytApiKey: "",
      googleApiKey: "",
      googleCx: "",
      corsProxy: "https://corsproxy.io/?",
    };
  },

  saveSettings(data) {
    localStorage.setItem(STORE_KEYS.SETTINGS, JSON.stringify(data));
  },

  // --- ギャラリー (IndexedDB風だがlocalStorageで簡易実装) ---
  // 画像はblob URLなのでセッション間では保持不可 → メタデータ+URLのみ保存
  getGallery() {
    const raw = localStorage.getItem(STORE_KEYS.GALLERY);
    return raw ? JSON.parse(raw) : [];
  },

  addToGallery(item) {
    // item: { url, member, type: "image"|"video", thumbUrl, title, date }
    const gallery = this.getGallery();
    // 重複チェック
    if (gallery.some(g => g.url === item.url)) return gallery;
    gallery.unshift(item);
    // 最大2000件に制限
    if (gallery.length > 2000) gallery.length = 2000;
    localStorage.setItem(STORE_KEYS.GALLERY, JSON.stringify(gallery));
    return gallery;
  },

  addBatchToGallery(items) {
    const gallery = this.getGallery();
    const existingUrls = new Set(gallery.map(g => g.url));
    const newItems = items.filter(i => !existingUrls.has(i.url));
    gallery.unshift(...newItems);
    if (gallery.length > 2000) gallery.length = 2000;
    localStorage.setItem(STORE_KEYS.GALLERY, JSON.stringify(gallery));
    return gallery;
  },

  clearGallery() {
    localStorage.removeItem(STORE_KEYS.GALLERY);
  },

  // --- エクスポート/インポート ---
  exportAll() {
    return JSON.stringify({
      oshi: this.getOshi(),
      settings: this.getSettings(),
      gallery: this.getGallery(),
      exportDate: new Date().toISOString(),
    }, null, 2);
  },

  importAll(jsonStr) {
    const data = JSON.parse(jsonStr);
    if (data.oshi) this.saveOshi(data.oshi);
    if (data.settings) this.saveSettings(data.settings);
    if (data.gallery) {
      localStorage.setItem(STORE_KEYS.GALLERY, JSON.stringify(data.gallery));
    }
  },
};

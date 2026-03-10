/**
 * ギャラリー表示 & ライトボックス
 */

const Gallery = {
  _currentItems: [],
  _currentIndex: 0,

  render(filterMember, filterType) {
    let items = Store.getGallery();
    const oshiMembers = Store.getOshi().members;

    if (filterMember === "oshi") {
      items = items.filter(i => oshiMembers.includes(i.member));
    } else if (["nogizaka", "hinatazaka", "sakurazaka"].includes(filterMember)) {
      const groupMembers = MEMBERS.filter(m => m.group === filterMember).map(m => m.name);
      items = items.filter(i => groupMembers.includes(i.member));
    }
    if (filterType === "image") {
      items = items.filter(i => i.type === "image");
    } else if (filterType === "video") {
      items = items.filter(i => i.type === "video");
    }

    this._currentItems = items;

    const grid = document.getElementById("gallery-grid");
    const empty = document.getElementById("gallery-empty");

    if (items.length === 0) {
      grid.innerHTML = "";
      empty.style.display = "block";
      return;
    }
    empty.style.display = "none";

    grid.innerHTML = items.map((item, idx) => {
      const isOshi = oshiMembers.includes(item.member);
      const cls = [
        "gallery-item",
        item.type === "video" ? "video" : "",
        isOshi ? "is-oshi-item" : "",
      ].filter(Boolean).join(" ");

      return `
        <div class="${cls}" data-index="${idx}">
          <img src="${this._escHtml(item.thumbUrl)}" alt="${this._escHtml(item.title)}" loading="lazy"
               onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 1 1%22><rect fill=%22%231a1829%22 width=%221%22 height=%221%22/></svg>'">
          <div class="member-tag">${this._escHtml(item.member)}</div>
        </div>
      `;
    }).join("");

    grid.querySelectorAll(".gallery-item").forEach(el => {
      el.addEventListener("click", () => {
        const idx = parseInt(el.dataset.index);
        this.openLightbox(idx);
      });
    });
  },

  openLightbox(index) {
    this._currentIndex = index;
    const item = this._currentItems[index];
    if (!item) return;

    const lb = document.getElementById("lightbox");
    const img = document.getElementById("lb-img");
    const memberEl = document.getElementById("lb-member");
    const dlBtn = document.getElementById("lb-download");

    if (item.type === "video") {
      // 動画はYouTubeリンクを開く
      window.open(item.url, "_blank");
      return;
    }

    img.src = item.thumbUrl;
    memberEl.textContent = `${item.member} - ${item.title}`;
    dlBtn.href = item.url;
    dlBtn.download = `${item.member}_${Date.now()}.jpg`;

    lb.style.display = "flex";
  },

  closeLightbox() {
    document.getElementById("lightbox").style.display = "none";
  },

  navigate(direction) {
    let newIndex = this._currentIndex + direction;
    // 画像のみナビゲート
    const imageItems = this._currentItems
      .map((item, i) => ({ ...item, _idx: i }))
      .filter(i => i.type === "image");

    const currentPos = imageItems.findIndex(i => i._idx === this._currentIndex);
    let newPos = currentPos + direction;
    if (newPos < 0) newPos = imageItems.length - 1;
    if (newPos >= imageItems.length) newPos = 0;

    if (imageItems[newPos]) {
      this.openLightbox(imageItems[newPos]._idx);
    }
  },

  _escHtml(str) {
    const d = document.createElement("div");
    d.textContent = str || "";
    return d.innerHTML;
  },

  /**
   * 収集結果をプレビューグリッドに表示
   */
  renderPreview(items, containerId) {
    const grid = document.getElementById(containerId);
    if (!grid) return;

    grid.innerHTML = items.slice(0, 50).map((item, idx) => {
      const cls = item.type === "video" ? "result-thumb video" : "result-thumb";
      return `
        <div class="${cls}" title="${this._escHtml(item.title)}">
          <img src="${this._escHtml(item.thumbUrl)}" loading="lazy"
               onerror="this.parentElement.style.display='none'">
        </div>
      `;
    }).join("");
  },

  /**
   * ZIP一括ダウンロード（画像をfetchしてblob化）
   */
  async downloadAllAsZip(items, onProgress) {
    // 動的にJSZipを読み込み
    if (!window.JSZip) {
      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
      document.head.appendChild(script);
      await new Promise((resolve, reject) => {
        script.onload = resolve;
        script.onerror = reject;
      });
    }

    const zip = new JSZip();
    const imageItems = items.filter(i => i.type === "image");
    let done = 0;

    for (const item of imageItems) {
      try {
        const settings = Store.getSettings();
        const proxy = settings.corsProxy || "";
        const fetchUrl = proxy ? `${proxy}${encodeURIComponent(item.url)}` : item.url;

        const res = await fetch(fetchUrl, { signal: AbortSignal.timeout(10000) });
        if (!res.ok) continue;
        const blob = await res.blob();
        const ext = item.url.match(/\.(jpe?g|png|gif|webp)/i)?.[0] || ".jpg";
        const filename = `${item.member}/${done + 1}${ext}`;
        zip.file(filename, blob);
        done++;
        if (onProgress) onProgress(done, imageItems.length);
      } catch (e) {
        console.warn("Download failed:", item.url);
      }
    }

    if (done === 0) return null;

    const content = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(content);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nogizaka46_${new Date().toISOString().slice(0, 10)}.zip`;
    a.click();
    URL.revokeObjectURL(url);
    return done;
  },
};

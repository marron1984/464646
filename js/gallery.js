/**
 * ギャラリー表示 & ライトボックス
 */

// 検索リンクのアイコン
const LINK_ICONS = {
  google: "&#128269;",
  pinterest: "&#128204;",
  x: "&#120143;",
  matome: "&#128240;",
  bing: "&#128270;",
  blog: "&#128221;",
  yt: "&#9654;",
  default: "&#128279;",
};

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
    } else if (filterType === "link") {
      items = items.filter(i => i.type === "link");
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

      if (item.type === "link") {
        return this._renderLinkCard(item, idx, isOshi);
      }

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
          ${item.type === "image" ? `<button class="dl-btn" data-index="${idx}" title="保存">&#8615;</button>` : ""}
        </div>
      `;
    }).join("");

    // イベント
    grid.querySelectorAll(".gallery-item").forEach(el => {
      el.addEventListener("click", (e) => {
        if (e.target.classList.contains("dl-btn")) return;
        const idx = parseInt(el.dataset.index);
        this.openLightbox(idx);
      });
    });

    grid.querySelectorAll(".link-card").forEach(el => {
      el.addEventListener("click", () => {
        const url = el.dataset.url;
        if (url) window.open(url, "_blank", "noopener");
      });
    });

    grid.querySelectorAll(".dl-btn").forEach(btn => {
      btn.addEventListener("click", async (e) => {
        e.stopPropagation();
        const idx = parseInt(btn.dataset.index);
        const item = this._currentItems[idx];
        if (!item) return;
        btn.textContent = "...";
        const blob = await Scraper.downloadImage(item.url);
        if (blob) {
          const ext = item.url.match(/\.(jpe?g|png|gif|webp)/i)?.[0] || ".jpg";
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `${item.member}_${Date.now()}${ext}`;
          a.click();
          URL.revokeObjectURL(url);
          btn.textContent = "\u2713";
        } else {
          window.open(item.url, "_blank");
          btn.textContent = "\u2197";
        }
        setTimeout(() => { btn.textContent = "\u2193"; }, 2000);
      });
    });
  },

  _renderLinkCard(item, idx, isOshi) {
    const icon = LINK_ICONS[item.linkIcon] || LINK_ICONS.default;
    const cls = ["link-card", isOshi ? "is-oshi-item" : ""].filter(Boolean).join(" ");
    return `
      <div class="${cls}" data-index="${idx}" data-url="${this._escHtml(item.url)}">
        <div class="link-icon">${icon}</div>
        <div class="link-title">${this._escHtml(item.title)}</div>
        <div class="link-member">${this._escHtml(item.member)}</div>
      </div>
    `;
  },

  openLightbox(index) {
    this._currentIndex = index;
    const item = this._currentItems[index];
    if (!item) return;

    const lb = document.getElementById("lightbox");
    const img = document.getElementById("lb-img");
    const memberEl = document.getElementById("lb-member");
    const dlBtn = document.getElementById("lb-download");

    if (item.type === "video" || item.type === "link") {
      window.open(item.url, "_blank");
      return;
    }

    img.src = item.url;
    img.onerror = () => { img.src = item.thumbUrl; };
    memberEl.textContent = `${item.member} - ${item.title}`;

    dlBtn.onclick = async (e) => {
      e.preventDefault();
      dlBtn.textContent = "保存中...";
      const blob = await Scraper.downloadImage(item.url);
      if (blob) {
        const ext = item.url.match(/\.(jpe?g|png|gif|webp)/i)?.[0] || ".jpg";
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = `${item.member}_${Date.now()}${ext}`;
        a.click();
        URL.revokeObjectURL(blobUrl);
        dlBtn.textContent = "保存完了";
      } else {
        window.open(item.url, "_blank");
        dlBtn.textContent = "新タブで開く";
      }
      setTimeout(() => { dlBtn.textContent = "保存"; }, 2000);
    };
    dlBtn.textContent = "保存";

    lb.style.display = "flex";
  },

  closeLightbox() {
    document.getElementById("lightbox").style.display = "none";
  },

  navigate(direction) {
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

  renderPreview(items, containerId) {
    const grid = document.getElementById(containerId);
    if (!grid) return;

    grid.innerHTML = items.slice(0, 60).map((item) => {
      if (item.type === "link") {
        const icon = LINK_ICONS[item.linkIcon] || LINK_ICONS.default;
        return `
          <div class="result-link" title="${this._escHtml(item.title)}"
               onclick="window.open('${this._escHtml(item.url)}','_blank')">
            <span class="result-link-icon">${icon}</span>
            <span class="result-link-label">${this._escHtml(item.title)}</span>
          </div>
        `;
      }
      const cls = item.type === "video" ? "result-thumb video" : "result-thumb";
      return `
        <div class="${cls}" title="${this._escHtml(item.title)}">
          <img src="${this._escHtml(item.thumbUrl)}" loading="lazy"
               onerror="this.parentElement.style.display='none'">
        </div>
      `;
    }).join("");
  },

  async downloadAllAsZip(items, onProgress) {
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
        const blob = await Scraper.downloadImage(item.url);
        if (!blob) continue;
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
    a.download = `sakamichi_${new Date().toISOString().slice(0, 10)}.zip`;
    a.click();
    URL.revokeObjectURL(url);
    return done;
  },
};

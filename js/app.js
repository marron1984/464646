/**
 * メインアプリケーション
 */

// ===== タブ切り替え =====
document.querySelectorAll(".tab").forEach(tab => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));
    tab.classList.add("active");
    document.getElementById(`tab-${tab.dataset.tab}`).classList.add("active");

    // ギャラリータブ切替時に再描画
    if (tab.dataset.tab === "gallery") refreshGallery();
    if (tab.dataset.tab === "collect") updateOshiQuick();
  });
});

// ===== 推し設定 =====
let currentGen = "all";

function renderOshiList() {
  const oshi = Store.getOshi();
  const list = document.getElementById("oshi-list");
  const empty = document.getElementById("no-oshi");

  if (!oshi.members.length) {
    list.innerHTML = "";
    empty.style.display = "block";
    return;
  }
  empty.style.display = "none";

  list.innerHTML = oshi.members.map((name, i) => {
    const m = MEMBERS.find(x => x.name === name);
    const gen = m ? `${m.gen}期` : "";
    return `
      <div class="oshi-item" draggable="true" data-name="${name}" data-index="${i}">
        <span class="oshi-rank">${i + 1}</span>
        <span class="oshi-name">${name}</span>
        ${gen ? `<span class="oshi-gen">${gen}</span>` : ""}
        <button class="oshi-remove" data-name="${name}">&times;</button>
      </div>
    `;
  }).join("");

  // ドラッグ&ドロップ
  list.querySelectorAll(".oshi-item").forEach(item => {
    item.addEventListener("dragstart", e => {
      e.dataTransfer.setData("text/plain", item.dataset.index);
      item.classList.add("dragging");
    });
    item.addEventListener("dragend", () => item.classList.remove("dragging"));
    item.addEventListener("dragover", e => e.preventDefault());
    item.addEventListener("drop", e => {
      e.preventDefault();
      const from = parseInt(e.dataTransfer.getData("text/plain"));
      const to = parseInt(item.dataset.index);
      if (from === to) return;
      const arr = [...Store.getOshi().members];
      const [moved] = arr.splice(from, 1);
      arr.splice(to, 0, moved);
      Store.reorderOshi(arr);
      renderOshiList();
      renderMemberGrid();
    });
  });

  // 削除ボタン
  list.querySelectorAll(".oshi-remove").forEach(btn => {
    btn.addEventListener("click", e => {
      e.stopPropagation();
      Store.removeOshi(btn.dataset.name);
      renderOshiList();
      renderMemberGrid();
    });
  });
}

function renderMemberGrid() {
  const query = document.getElementById("member-search").value;
  const members = searchMembers(query, currentGen);
  const oshi = Store.getOshi();
  const grid = document.getElementById("member-grid");

  grid.innerHTML = members.map(m => {
    const isOshi = oshi.members.includes(m.name);
    const rank = oshi.members.indexOf(m.name);
    return `
      <div class="member-card ${isOshi ? "is-oshi" : ""}" data-name="${m.name}">
        ${isOshi ? `<span class="oshi-badge">&#11088; ${rank + 1}</span>` : ""}
        <div class="name">${m.name}</div>
        <div class="kana">${m.kana}</div>
      </div>
    `;
  }).join("");

  grid.querySelectorAll(".member-card").forEach(card => {
    card.addEventListener("click", () => {
      const name = card.dataset.name;
      if (Store.isOshi(name)) {
        Store.removeOshi(name);
      } else {
        Store.addOshi(name);
      }
      renderOshiList();
      renderMemberGrid();
    });
  });
}

// 世代フィルタ
document.querySelectorAll(".gen-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".gen-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentGen = btn.dataset.gen;
    renderMemberGrid();
  });
});

// メンバー検索
let searchTimer;
document.getElementById("member-search").addEventListener("input", e => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => renderMemberGrid(), 150);
});

// 推し設定保存
document.getElementById("save-oshi-settings").addEventListener("click", () => {
  const oshi = Store.getOshi();
  oshi.collectNonOshi = document.getElementById("collect-non-oshi").checked;
  oshi.oshiYoutube = document.getElementById("oshi-youtube").checked;
  Store.saveOshi(oshi);
  toast("推し設定を保存しました");
});

function loadOshiForm() {
  const oshi = Store.getOshi();
  document.getElementById("collect-non-oshi").checked = oshi.collectNonOshi !== false;
  document.getElementById("oshi-youtube").checked = oshi.oshiYoutube !== false;
}

// ===== 収集タブ =====
let selectedMode = "blog";

function updateOshiQuick() {
  const oshi = Store.getOshi();
  const container = document.getElementById("oshi-quick-list");
  if (!oshi.members.length) {
    container.innerHTML = '<span style="color:var(--text-sub);font-size:0.8rem">推し未設定 - 全メンバーを均等に収集します</span>';
    return;
  }
  container.innerHTML = oshi.members.map((name, i) =>
    `<div class="oshi-chip"><span class="rank">#${i + 1}</span> ${name}</div>`
  ).join("");
}

document.querySelectorAll(".mode-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".mode-btn").forEach(b => b.classList.remove("selected"));
    btn.classList.add("selected");
    selectedMode = btn.dataset.mode;
  });
});

// 収集開始
document.getElementById("start-collect").addEventListener("click", async () => {
  const btn = document.getElementById("start-collect");
  btn.disabled = true;
  btn.textContent = "収集中...";

  const progressCard = document.getElementById("progress-card");
  const progressLog = document.getElementById("progress-log");
  const progressBar = document.getElementById("progress-bar");
  const resultCard = document.getElementById("result-preview");

  progressCard.style.display = "block";
  resultCard.style.display = "none";
  progressLog.innerHTML = "";
  progressBar.style.width = "0%";

  const oshi = Store.getOshi();
  let targetMembers = [];

  // 推しメンバーを先頭に
  const oshiMemberData = oshi.members
    .map(name => MEMBERS.find(m => m.name === name))
    .filter(Boolean);

  if (oshi.collectNonOshi !== false) {
    const otherMembers = MEMBERS.filter(m => !oshi.members.includes(m.name));
    targetMembers = [...oshiMemberData, ...otherMembers];
  } else {
    targetMembers = oshiMemberData;
  }

  if (targetMembers.length === 0) {
    targetMembers = MEMBERS;
  }

  // YouTube の場合は推しのみ or 少人数
  let ytTargets = targetMembers;
  if (oshi.oshiYoutube !== false && oshi.members.length > 0) {
    ytTargets = oshiMemberData.length ? oshiMemberData : targetMembers.slice(0, 5);
  }

  const allCollected = [];

  const onProgress = ({ type, message, progress }) => {
    const div = document.createElement("div");
    div.className = type;
    div.textContent = message;
    progressLog.appendChild(div);
    progressLog.scrollTop = progressLog.scrollHeight;
    if (progress !== undefined) {
      progressBar.style.width = `${Math.min(progress, 100)}%`;
    }
  };

  try {
    if (selectedMode === "blog" || selectedMode === "all") {
      onProgress({ type: "oshi", message: "--- ブログ画像収集開始 ---" });
      const blogItems = await Scraper.scrapeBlog(targetMembers, onProgress);
      allCollected.push(...blogItems);
      onProgress({ type: "done", message: `ブログ: ${blogItems.length}件収集完了` });
    }

    if (selectedMode === "youtube" || selectedMode === "all") {
      onProgress({ type: "oshi", message: "--- YouTube動画検索開始 ---" });
      const ytItems = await Scraper.scrapeYoutube(ytTargets, onProgress);
      allCollected.push(...ytItems);
      onProgress({ type: "done", message: `YouTube: ${ytItems.length}件収集完了` });
    }

    // ギャラリーに保存
    Store.addBatchToGallery(allCollected);

    // 結果表示
    onProgress({
      type: "done",
      message: `=== 収集完了: 合計 ${allCollected.length}件 ===`,
      progress: 100,
    });

    if (allCollected.length > 0) {
      resultCard.style.display = "block";
      document.getElementById("result-stats").textContent =
        `画像: ${allCollected.filter(i => i.type === "image").length}枚 / 動画: ${allCollected.filter(i => i.type === "video").length}件`;
      Gallery.renderPreview(allCollected, "result-grid");
    }

  } catch (err) {
    onProgress({ type: "err", message: `エラー: ${err.message}` });
  }

  btn.disabled = false;
  btn.textContent = "収集開始";
});

// ZIP ダウンロード
document.getElementById("download-all").addEventListener("click", async () => {
  const items = Store.getGallery().filter(i => i.type === "image");
  if (!items.length) {
    toast("ダウンロードする画像がありません");
    return;
  }
  const btn = document.getElementById("download-all");
  btn.disabled = true;
  btn.textContent = "ZIP作成中...";
  const count = await Gallery.downloadAllAsZip(items, (done, total) => {
    btn.textContent = `ZIP作成中... (${done}/${total})`;
  });
  btn.disabled = false;
  btn.textContent = "一括ダウンロード (ZIP)";
  if (count) toast(`${count}枚の画像をZIPに保存しました`);
});

// ===== ギャラリー =====
function refreshGallery() {
  const filter = document.getElementById("gallery-filter").value;
  const type = document.getElementById("gallery-type").value;
  Gallery.render(filter, type);
}

document.getElementById("gallery-filter").addEventListener("change", refreshGallery);
document.getElementById("gallery-type").addEventListener("change", refreshGallery);

document.getElementById("clear-gallery").addEventListener("click", () => {
  if (confirm("ギャラリーのデータを全て削除しますか？")) {
    Store.clearGallery();
    refreshGallery();
    toast("ギャラリーを削除しました");
  }
});

// ライトボックス
document.querySelector(".lb-close").addEventListener("click", () => Gallery.closeLightbox());
document.querySelector(".lb-prev").addEventListener("click", () => Gallery.navigate(-1));
document.querySelector(".lb-next").addEventListener("click", () => Gallery.navigate(1));
document.getElementById("lightbox").addEventListener("click", e => {
  if (e.target.id === "lightbox") Gallery.closeLightbox();
});
document.addEventListener("keydown", e => {
  if (document.getElementById("lightbox").style.display === "none") return;
  if (e.key === "Escape") Gallery.closeLightbox();
  if (e.key === "ArrowLeft") Gallery.navigate(-1);
  if (e.key === "ArrowRight") Gallery.navigate(1);
});

// ===== 設定 =====
function loadSettings() {
  const s = Store.getSettings();
  document.getElementById("yt-api-key").value = s.ytApiKey || "";
  document.getElementById("cors-proxy").value = s.corsProxy || "https://corsproxy.io/?";
}

document.getElementById("save-settings").addEventListener("click", () => {
  Store.saveSettings({
    ytApiKey: document.getElementById("yt-api-key").value.trim(),
    corsProxy: document.getElementById("cors-proxy").value.trim(),
  });
  toast("設定を保存しました");
});

// エクスポート
document.getElementById("export-data").addEventListener("click", () => {
  const json = Store.exportAll();
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `nogizaka_scraper_backup_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  toast("データをエクスポートしました");
});

// インポート
document.getElementById("import-data").addEventListener("change", e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      Store.importAll(reader.result);
      toast("データをインポートしました");
      init();
    } catch (err) {
      toast("インポートに失敗しました");
    }
  };
  reader.readAsText(file);
});

// ===== Toast =====
function toast(message) {
  let el = document.querySelector(".toast");
  if (!el) {
    el = document.createElement("div");
    el.className = "toast";
    document.body.appendChild(el);
  }
  el.textContent = message;
  el.classList.add("show");
  setTimeout(() => el.classList.remove("show"), 2500);
}

// ===== 初期化 =====
function init() {
  renderOshiList();
  renderMemberGrid();
  loadOshiForm();
  loadSettings();
  updateOshiQuick();
}

init();

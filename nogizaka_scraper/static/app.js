// ===== 乃木坂46 メディアスクレイパー - フロントエンド =====

const API = {
  async get(url) {
    const res = await fetch(url);
    return res.json();
  },
  async post(url, data) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return res.json();
  },
};

// --- State ---
let oshiConfig = { oshi_members: [] };
let members = [];
let selectedMode = "blog";

// --- Tab Navigation ---
document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach((c) => c.classList.remove("active"));
    tab.classList.add("active");
    document.getElementById(`tab-${tab.dataset.tab}`).classList.add("active");
  });
});

// --- Load Data ---
async function loadOshi() {
  oshiConfig = await API.get("/api/oshi");
  renderOshiList();
  updateOshiFormValues();
  updateScrapeTargets();
}

async function loadMembers(query = "", gen = "all") {
  const params = query ? `?q=${encodeURIComponent(query)}` : "";
  members = await API.get(`/api/members${params}`);
  if (gen !== "all") {
    members = members.filter((m) => m.generation === parseInt(gen));
  }
  renderMemberGrid();
}

// --- Oshi List (Drag & Drop) ---
function renderOshiList() {
  const list = document.getElementById("oshi-list");
  const empty = document.getElementById("no-oshi");

  if (!oshiConfig.oshi_members.length) {
    list.innerHTML = "";
    empty.style.display = "block";
    return;
  }
  empty.style.display = "none";

  list.innerHTML = oshiConfig.oshi_members
    .map((name, i) => {
      const member = members.find((m) => m.name === name);
      const gen = member ? `${member.generation}期` : "";
      return `
        <div class="oshi-item" draggable="true" data-name="${name}" data-index="${i}">
          <span class="oshi-rank">${i + 1}</span>
          <span class="oshi-name">${name}</span>
          ${gen ? `<span class="oshi-gen">${gen}</span>` : ""}
          <button class="oshi-remove" data-name="${name}" title="推しから外す">&times;</button>
        </div>
      `;
    })
    .join("");

  // Drag events
  list.querySelectorAll(".oshi-item").forEach((item) => {
    item.addEventListener("dragstart", (e) => {
      e.dataTransfer.setData("text/plain", item.dataset.index);
      item.classList.add("dragging");
    });
    item.addEventListener("dragend", () => item.classList.remove("dragging"));
    item.addEventListener("dragover", (e) => e.preventDefault());
    item.addEventListener("drop", async (e) => {
      e.preventDefault();
      const fromIdx = parseInt(e.dataTransfer.getData("text/plain"));
      const toIdx = parseInt(item.dataset.index);
      if (fromIdx === toIdx) return;
      const arr = [...oshiConfig.oshi_members];
      const [moved] = arr.splice(fromIdx, 1);
      arr.splice(toIdx, 0, moved);
      oshiConfig.oshi_members = arr;
      await API.post("/api/oshi/reorder", { oshi_members: arr });
      renderOshiList();
      renderMemberGrid();
      updateScrapeTargets();
    });
  });

  // Remove buttons
  list.querySelectorAll(".oshi-remove").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      e.stopPropagation();
      await API.post("/api/oshi/remove", { name: btn.dataset.name });
      await loadOshi();
      renderMemberGrid();
    });
  });
}

// --- Member Grid ---
function renderMemberGrid() {
  const grid = document.getElementById("member-grid");
  grid.innerHTML = members
    .map((m) => {
      const isOshi = oshiConfig.oshi_members.includes(m.name);
      return `
        <div class="member-card ${isOshi ? "is-oshi" : ""}" data-name="${m.name}">
          ${isOshi ? `<span class="oshi-badge">&#11088; ${m.oshi_rank + 1}</span>` : ""}
          <div class="name">${m.name}</div>
          <div class="kana">${m.name_kana}</div>
        </div>
      `;
    })
    .join("");

  grid.querySelectorAll(".member-card").forEach((card) => {
    card.addEventListener("click", async () => {
      const name = card.dataset.name;
      const isOshi = oshiConfig.oshi_members.includes(name);
      if (isOshi) {
        await API.post("/api/oshi/remove", { name });
      } else {
        await API.post("/api/oshi/add", { name });
      }
      await loadOshi();
      renderMemberGrid();
    });
  });
}

// --- Generation Filters ---
let currentGen = "all";
document.querySelectorAll(".gen-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".gen-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    currentGen = btn.dataset.gen;
    const query = document.getElementById("member-search").value;
    loadMembers(query, currentGen);
  });
});

// --- Member Search ---
let searchTimeout;
document.getElementById("member-search").addEventListener("input", (e) => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => loadMembers(e.target.value, currentGen), 200);
});

// --- Oshi Settings Form ---
function updateOshiFormValues() {
  document.getElementById("oshi-max-pages").value = oshiConfig.oshi_max_pages || 20;
  document.getElementById("collect-non-oshi").checked = oshiConfig.collect_non_oshi !== false;
  document.getElementById("non-oshi-max-pages").value = oshiConfig.non_oshi_max_pages || 2;
  document.getElementById("oshi-youtube-search").checked = oshiConfig.oshi_youtube_search !== false;
}

document.getElementById("collect-non-oshi").addEventListener("change", (e) => {
  document.getElementById("non-oshi-pages-group").style.display = e.target.checked ? "block" : "none";
});

document.getElementById("save-oshi-settings").addEventListener("click", async () => {
  const data = {
    ...oshiConfig,
    oshi_max_pages: parseInt(document.getElementById("oshi-max-pages").value),
    collect_non_oshi: document.getElementById("collect-non-oshi").checked,
    non_oshi_max_pages: parseInt(document.getElementById("non-oshi-max-pages").value),
    oshi_youtube_search: document.getElementById("oshi-youtube-search").checked,
  };
  await API.post("/api/oshi", data);
  await loadOshi();
  showToast("推し設定を保存しました");
});

// --- Mode Selection ---
document.querySelectorAll(".mode-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".mode-btn").forEach((b) => b.classList.remove("selected"));
    btn.classList.add("selected");
    selectedMode = btn.dataset.mode;
    document.getElementById("url-input-card").style.display =
      selectedMode === "images" ? "block" : "none";
    updateScrapeTargets();
  });
});

// --- Scrape Targets Display ---
function updateScrapeTargets() {
  const container = document.getElementById("scrape-targets");
  if (selectedMode === "images") {
    container.innerHTML = '<p class="hint">上のURL入力欄に対象URLを入力してください</p>';
    return;
  }

  const oshiNames = oshiConfig.oshi_members || [];
  let html = "";

  if (oshiNames.length) {
    html += oshiNames
      .map(
        (name) =>
          `<div class="target-item"><span class="star">&#11088;</span> <strong>${name}</strong>（推し・優先収集）</div>`
      )
      .join("");
  }

  if (oshiConfig.collect_non_oshi !== false) {
    html += `<div class="target-item" style="color:var(--text-sub)">+ 他のメンバー（${oshiConfig.non_oshi_max_pages || 2}ページまで）</div>`;
  }

  if (!oshiNames.length) {
    html = '<p class="hint">推しが未設定のため全メンバーを均等に収集します</p>';
  }

  container.innerHTML = html;
}

// --- Start Scrape ---
document.getElementById("start-scrape").addEventListener("click", async () => {
  const btn = document.getElementById("start-scrape");
  btn.disabled = true;
  btn.textContent = "収集中...";

  const progressCard = document.getElementById("progress-card");
  const progressLog = document.getElementById("progress-log");
  const progressResult = document.getElementById("progress-result");
  const progressBar = document.getElementById("progress-bar");

  progressCard.style.display = "block";
  progressLog.innerHTML = "";
  progressResult.style.display = "none";
  progressResult.className = "progress-result";
  progressBar.style.width = "0%";

  let targets = [];
  if (selectedMode === "images") {
    targets = document
      .getElementById("target-urls")
      .value.split("\n")
      .map((u) => u.trim())
      .filter(Boolean);
  }

  try {
    const result = await API.post("/api/scrape/start", {
      mode: selectedMode,
      targets,
    });

    if (result.error) {
      addLog(result.error, "error");
      btn.disabled = false;
      btn.textContent = "\u25B6 収集開始";
      return;
    }

    // SSE で進捗を監視
    const evtSource = new EventSource(`/api/scrape/events/${result.job_id}`);
    let processedCount = 0;

    evtSource.addEventListener("progress", (e) => {
      const data = JSON.parse(e.data);
      const cls = data.is_oshi ? "log-oshi" : "log-normal";
      addLog(data.message, cls);
      processedCount++;
      progressBar.style.width = `${Math.min(processedCount * 5, 95)}%`;
    });

    evtSource.addEventListener("status", (e) => {
      const data = JSON.parse(e.data);
      addLog(data.message, "log-normal");
    });

    evtSource.addEventListener("complete", (e) => {
      const data = JSON.parse(e.data);
      progressBar.style.width = "100%";
      progressResult.textContent = data.message;
      progressResult.className = "progress-result success";
    });

    evtSource.addEventListener("error", (e) => {
      try {
        const data = JSON.parse(e.data);
        addLog(data.message, "log-error");
        progressResult.textContent = data.message;
        progressResult.className = "progress-result error";
      } catch {
        // SSE connection error
      }
    });

    evtSource.addEventListener("done", () => {
      evtSource.close();
      btn.disabled = false;
      btn.textContent = "\u25B6 収集開始";
    });
  } catch (err) {
    addLog(`エラー: ${err.message}`, "log-error");
    btn.disabled = false;
    btn.textContent = "\u25B6 収集開始";
  }
});

function addLog(message, cls = "log-normal") {
  const log = document.getElementById("progress-log");
  const div = document.createElement("div");
  div.className = cls;
  div.textContent = message;
  log.appendChild(div);
  log.scrollTop = log.scrollHeight;
}

// --- Settings ---
document.getElementById("save-config").addEventListener("click", async () => {
  await API.post("/api/config", {
    download_dir: document.getElementById("download-dir").value,
    request_delay: parseFloat(document.getElementById("request-delay").value),
    youtube_download_quality: document.getElementById("youtube-quality").value,
    skip_existing: document.getElementById("skip-existing").checked,
  });
  showToast("設定を保存しました");
});

async function loadConfig() {
  const config = await API.get("/api/config");
  document.getElementById("download-dir").value = config.download_dir || "./downloads";
  document.getElementById("request-delay").value = config.request_delay || 2;
  document.getElementById("youtube-quality").value = config.youtube_download_quality || "720p";
  document.getElementById("skip-existing").checked = config.skip_existing !== false;
}

// --- Toast ---
function showToast(message) {
  let toast = document.getElementById("toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast";
    toast.style.cssText = `
      position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
      background: var(--success); color: #fff; padding: 10px 24px;
      border-radius: 8px; font-size: 0.85rem; font-weight: 600;
      z-index: 999; opacity: 0; transition: opacity 0.3s;
    `;
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.style.opacity = "1";
  setTimeout(() => (toast.style.opacity = "0"), 2000);
}

// --- Init ---
async function init() {
  await Promise.all([loadOshi(), loadMembers(), loadConfig()]);
  updateScrapeTargets();
}

init();

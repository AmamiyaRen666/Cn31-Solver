// Educational Cybersecurity measures purposes: sanitized for safe sharing, review, and classroom-style inspection of the code here.
const icons = {
  shield: '<svg viewBox="0 0 24 24"><path d="M12 3 19 6v5c0 4.8-2.9 8.2-7 10-4.1-1.8-7-5.2-7-10V6l7-3Z"/><path d="m9 12 2 2 4-5"/></svg>',
  network: '<svg viewBox="0 0 24 24"><path d="M12 3v5M5 8l4 3M19 8l-4 3M5 17l4-3M19 17l-4-3M12 16v5"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="3" r="1.5"/><circle cx="5" cy="8" r="1.5"/><circle cx="19" cy="8" r="1.5"/><circle cx="5" cy="17" r="1.5"/><circle cx="19" cy="17" r="1.5"/><circle cx="12" cy="21" r="1.5"/></svg>',
  layers: '<svg viewBox="0 0 24 24"><path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m4 12 8 4.5 8-4.5M4 16l8 4.5 8-4.5"/></svg>',
  refresh: '<svg viewBox="0 0 24 24"><path d="M20 12a8 8 0 1 1-2.3-5.7"/><path d="M20 4v6h-6"/></svg>',
  inbox: '<svg viewBox="0 0 24 24"><path d="M4 13 7 5h10l3 8"/><path d="M4 13h5l2 3h2l2-3h5v6H4v-6Z"/></svg>',
  send: '<svg viewBox="0 0 24 24"><path d="M21 3 10 14"/><path d="m21 3-7 18-4-7-7-4 18-7Z"/></svg>',
  clock: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><path d="M12 8v5l3 2"/></svg>'
};

function setText(id, value) {
  const node = document.getElementById(id);
  if (!node) return;
  if (node.textContent !== value) {
    node.textContent = value;
    node.classList.remove("bump");
    void node.offsetWidth;
    node.classList.add("bump");
  }
}

function formatUptime(seconds) {
  const safe = Number(seconds || 0);
  const minutes = Math.floor(safe / 60);
  const hours = Math.floor(minutes / 60);
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${Math.floor(safe % 60)}s`;
  return `${Math.floor(safe)}s`;
}

function formatTimestamp(value) {
  if (!value) return "--";
  const date = new Date(value);
  if (isNaN(date.getTime())) return String(value);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function setBar(id, percent) {
  const bar = document.getElementById(id);
  if (!bar) return;
  const clamped = Math.max(0, Math.min(100, percent));
  bar.style.width = `${clamped}%`;
}

function setRing(percent) {
  const ring = document.getElementById("ring-arc");
  if (!ring) return;
  const clamped = Math.max(0, Math.min(100, percent));
  ring.style.strokeDashoffset = String(251 - (clamped / 100) * 251);
}

function updateClock() {
  const node = document.getElementById("clock");
  if (!node) return;
  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  node.textContent = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
}

function refreshDashboard() {
  return fetch("/stats", { cache: "no-store" })
    .then((response) => {
      if (!response.ok) throw new Error("status failed");
      return response.json();
    })
    .then((data) => {
      const queue = data.queue_size || 0;
      const peak = data.peak_queue || 0;
      const received = data.total_received || 0;
      const served = data.total_served || 0;
      const expired = data.total_expired || 0;
      const dupes = data.total_duplicates || 0;
      const workers = data.workers_active || 0;
      const rate = data.tokens_per_minute || 0;

      setText("poolSize", String(queue));
      setText("tokensGenerated", String(received));
      setText("tokensServed", String(served));
      setText("tokensExpired", String(expired));
      setText("duplicatesRejected", String(dupes));
      setText("singleRequests", Number(rate).toFixed(1));
      setText("peakQueue", String(peak));
      setText("activeWorkers", String(workers));

      setText("bv-pool", `${queue} / ${peak} peak`);
      setText("bv-served", `${served} / ${received}`);
      setBar("bar-pool", peak ? (queue / peak) * 100 : 0);
      setBar("bar-served", received ? (served / received) * 100 : 0);

      setText("totalReqPill", Number(rate).toFixed(1));
      setText("peakPill", String(peak));

      const uptime = data.uptime_seconds ?? 0;
      setText("uptimePill", formatUptime(uptime));
      setText("ringUptime", (uptime / 60).toFixed(1));
      setRing((uptime / (uptime + 60)) * 100);

      setText("lastReceived", formatTimestamp(data.last_received));
      setText("lastServed", formatTimestamp(data.last_served));

      const label = document.getElementById("statusBadge");
      if (label) {
        label.textContent = "Online";
        label.classList.remove("is-offline", "is-error");
      }
    })
    .catch(() => {
      const label = document.getElementById("statusBadge");
      if (label) {
        label.textContent = "Offline";
        label.classList.add("is-error");
      }
    });
}

function getToken() {
  const button = document.getElementById("getTokenButton");
  const btnSingle = document.getElementById("btnSingle");
  const result = document.getElementById("resultSection");
  const value = document.getElementById("tokenValue");
  const disable = (btn, text) => {
    if (!btn) return;
    btn.disabled = true;
    btn.querySelector("span:last-child") && (btn.querySelector("span:last-child").textContent = text);
    btn.textContent = text;
  };
  const enable = (btn, text) => {
    if (!btn) return;
    btn.disabled = false;
    btn.querySelector("span:last-child") && (btn.querySelector("span:last-child").textContent = text);
    btn.textContent = text;
  };
  if (button) disable(button, "Fetching...");
  if (btnSingle) disable(btnSingle, "Fetching...");

  return fetch("/get-token", { cache: "no-store" })
    .then((response) => response.json())
    .then((data) => {
      const label = document.getElementById("statusBadge");
      if (data && data.token) {
        if (result) result.hidden = false;
        if (value) value.textContent = data.token;
        if (label) {
          label.textContent = "Dispensed";
          label.classList.remove("is-offline", "is-error");
        }
      } else {
        if (result) result.hidden = true;
        if (value) value.textContent = "";
        if (label) {
          label.textContent = data && data.error ? "Empty queue" : "No token";
          label.classList.add("is-error");
        }
      }
      return refreshDashboard();
    })
    .catch(() => {
      const label = document.getElementById("statusBadge");
      if (label) {
        label.textContent = "Fetch failed";
        label.classList.add("is-error");
      }
    })
    .finally(() => {
      if (button) enable(button, "Get Token");
      if (btnSingle) enable(btnSingle, "Get Token");
    });
}

async function copyToken() {
  const value = document.getElementById("tokenValue");
  if (!value || !value.textContent) return;
  try {
    await navigator.clipboard.writeText(value.textContent);
    const btn = document.getElementById("copyTokenButton");
    if (btn) btn.classList.add("copied");
    setTimeout(() => btn && btn.classList.remove("copied"), 1200);
  } catch {
    const range = document.createRange();
    range.selectNodeContents(value);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  }
}

document.querySelectorAll("[data-icon]").forEach((node) => {
  node.innerHTML = icons[node.dataset.icon] || "";
});

document.querySelectorAll(".card, .section, .action-card, .ts-strip, .footer, .topbar").forEach((node, index) => {
  node.style.animationDelay = `${index * 60}ms`;
});

document.getElementById("refreshButton")?.addEventListener("click", refreshDashboard);
document.getElementById("getTokenButton")?.addEventListener("click", getToken);
document.getElementById("btnSingle")?.addEventListener("click", getToken);
document.getElementById("copyTokenButton")?.addEventListener("click", copyToken);

/* ---- theme system: light / dark / system ---- */

const themeIcons = {
  light: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"></path></svg>',
  dark: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>',
  system: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="2" y="3" width="20" height="14" rx="2"></rect><path d="M8 21h8M12 17v4"></path></svg>'
};

const themeToggle = document.getElementById("themeToggle");
const themeMenu = document.getElementById("themeMenu");
const themeIcon = document.getElementById("themeIcon");
const systemMedia = window.matchMedia ? window.matchMedia("(prefers-color-scheme: light)") : null;

function resolveTheme(pref) {
  if (pref === "system") return systemMedia && systemMedia.matches ? "light" : "dark";
  return pref;
}

function setTheme(pref, persist = true) {
  const resolved = resolveTheme(pref);
  document.documentElement.setAttribute("data-theme", resolved);
  if (persist) localStorage.setItem("cn31-theme", pref);
  document.querySelectorAll(".theme-opt").forEach((opt) => {
    const active = opt.dataset.theme === pref;
    opt.classList.toggle("active", active);
    opt.setAttribute("aria-pressed", String(active));
  });
  if (themeToggle) {
    themeToggle.setAttribute("aria-label", `Current theme: ${resolved}`);
  }
  if (themeIcon) {
    themeIcon.innerHTML = themeIcons[pref] || themeIcons.dark;
  }
}

function closeThemeMenu() {
  if (!themeMenu) return;
  themeMenu.classList.remove("open");
  if (themeToggle) themeToggle.setAttribute("aria-expanded", "false");
}

function toggleThemeMenu() {
  if (!themeMenu) return;
  const open = themeMenu.classList.toggle("open");
  if (themeToggle) themeToggle.setAttribute("aria-expanded", String(open));
}

const storedTheme = localStorage.getItem("cn31-theme") || "dark";
setTheme(storedTheme, false);

themeToggle?.addEventListener("click", (e) => {
  e.stopPropagation();
  toggleThemeMenu();
});

themeMenu?.addEventListener("click", (e) => {
  const opt = e.target.closest(".theme-opt");
  if (!opt) return;
  setTheme(opt.dataset.theme);
  closeThemeMenu();
});

if (systemMedia) {
  systemMedia.addEventListener("change", () => {
    if ((localStorage.getItem("cn31-theme") || "dark") === "system") {
      setTheme("system", false);
    }
  });
}

document.addEventListener("click", (e) => {
  if (!themeMenu || themeMenu.classList.contains("open")) {
    if (!e.target.closest(".theme-btn") && !e.target.closest(".theme-menu")) {
      closeThemeMenu();
    }
  }
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeThemeMenu();
});

refreshDashboard();
window.setInterval(refreshDashboard, 3000);
updateClock();
window.setInterval(updateClock, 1000);

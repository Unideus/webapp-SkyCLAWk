// js/events-renderer.js
// Category-filtered event markers INSIDE the screw SVG.
// Right-side buttons -> select a category -> SVG markers pin to year positions in scrollGroup.

const EventsRenderer = {
  CATEGORIES: [
    { id: "science",        label: "Science & Discovery",        abbr: "Sci",  color: "#00BCD4" },
    { id: "warfare",        label: "Warfare & Conflict",         abbr: "War",  color: "#F44336" },
    { id: "government",     label: "Government Expansion",       abbr: "Gov",  color: "#1976D2" },
    { id: "empire",         label: "Empire & Territory",         abbr: "Emp",  color: "#4CAF50" },
    { id: "technology",     label: "Technology & Infrastructure",abbr: "Tech", color: "#FF9800" },
    { id: "economics",      label: "Economic Crisis & Reform",   abbr: "Econ", color: "#FF5722" },
    { id: "social",         label: "Social Movements",           abbr: "Soc",  color: "#E040FB" },
    { id: "politics",       label: "Political Realignment",      abbr: "Pol",  color: "#9C27B0" },
    { id: "disaster",       label: "Pandemic & Disaster",        abbr: "Nat",  color: "#795548" },
    { id: "culture",        label: "Cultural Milestones",        abbr: "Cul",  color: "#FFD700" },
  ],

  activeCategory: null,
  eventsByCategory: {},

  init() {
    this.groupEvents();
    this.buildCategoryBar();
    this.renderMarkers();
    // Re-render when screw rebuilds
    window.addEventListener("zy:screwBuilt", () => this.renderMarkers());

    // Wire category bar collapse/expand toggle
    const wrap = document.getElementById("categoryBarWrap");
    if (wrap) {
      // Click to expand when collapsed, click outside to collapse
      wrap.addEventListener("click", (e) => {
        if (wrap.classList.contains("collapsed")) {
          e.stopPropagation();
          wrap.classList.remove("collapsed");
          wrap.classList.remove("hover-peek");
        }
      });

      document.addEventListener("click", (e) => {
        if (!wrap.classList.contains("collapsed") && !wrap.contains(e.target)) {
          wrap.classList.add("collapsed");
          wrap.classList.remove("hover-peek");
        }
      });

      // Mouseover/enter on collapsed bar reveals it (peek)
      wrap.addEventListener("mouseenter", () => {
        if (wrap.classList.contains("collapsed")) {
          wrap.classList.add("hover-peek");
        }
      });
      wrap.addEventListener("mouseleave", () => {
        setTimeout(() => {
          if (wrap && !wrap.matches(":hover")) {
            wrap.classList.remove("hover-peek");
          }
        }, 400);
      });
    }
  },

  groupEvents() {
    this.eventsByCategory = {};
    this.CATEGORIES.forEach(cat => { this.eventsByCategory[cat.id] = []; });
    if (window.HISTORICAL_EVENTS) {
      window.HISTORICAL_EVENTS.forEach(ev => {
        const c = ev.category || "other";
        if (!this.eventsByCategory[c]) this.eventsByCategory[c] = [];
        this.eventsByCategory[c].push(ev);
      });
    }
    if (window.ERA_HISTORY_EVENTS) {
      window.ERA_HISTORY_EVENTS.forEach(ev => {
        const c = ev.category || "other";
        if (!this.eventsByCategory[c]) this.eventsByCategory[c] = [];
        this.eventsByCategory[c].push(ev);
      });
    }
    Object.keys(this.eventsByCategory).forEach(k => {
      this.eventsByCategory[k].sort((a,b) => (a.year || a.startYear) - (b.year || b.startYear));
    });
  },

  buildCategoryBar() {
    const bar = document.getElementById("categoryBar");
    if (!bar) return;
    bar.innerHTML = "";

    // On personal scale, add Life Events button first
    const isPersonal = new URLSearchParams(window.location.search).get("variant") === "personal";
    if (isPersonal) {
      // Natal data button (above Life Events)
      const natalBtn = document.createElement("button");
      natalBtn.id = "natalBtn";
      natalBtn.className = "cat-btn natal-btn";
      natalBtn.title = "Natal Data";
      natalBtn.innerHTML = "<span class=\"cat-btn-dot\" style=\"background:#FFD700;font-size:9px;\">✦</span><span class=\"cat-btn-label\">Natal Data</span>";
      natalBtn.addEventListener("click", () => {
        if (typeof PersonalLife !== "undefined" && PersonalLife.openNatalModal) PersonalLife.openNatalModal();
      });
      bar.appendChild(natalBtn);

      const lifeBtn = document.createElement("button");
      lifeBtn.id = "lifeEventsBtn";
      lifeBtn.className = "cat-btn life-events-btn";
      lifeBtn.title = "Life Events";
      lifeBtn.innerHTML = "<span class=\"cat-btn-dot\" style=\"background:#FFD700;font-size:9px;\">✦</span><span class=\"cat-btn-label\">Life Events</span>";
      lifeBtn.addEventListener("click", () => {
        if (typeof PersonalLife !== "undefined" && PersonalLife.openEventModal) PersonalLife.openEventModal();
      });
      bar.appendChild(lifeBtn);

      // Local History button (personal scale only)
      const localHistBtn = document.createElement("button");
      localHistBtn.id = "localHistoryBtn";
      localHistBtn.className = "cat-btn life-events-btn";
      localHistBtn.title = "Local History";
      localHistBtn.innerHTML = '<span class="cat-btn-dot" style="background:#FFD700;font-size:9px;">✦</span><span class="cat-btn-label">Local History</span>';
      localHistBtn.addEventListener("click", () => {
        if (typeof PersonalLife !== "undefined" && PersonalLife.openLocalHistoryModal) PersonalLife.openLocalHistoryModal();
      });
      bar.appendChild(localHistBtn);
    }
    this.CATEGORIES.forEach(cat => {
      const b = document.createElement("button");
      b.className = "cat-btn";
      b.dataset.category = cat.id;
      b.title = cat.label;
      b.innerHTML = "<span class=\"cat-btn-dot\" style=\"background:" + cat.color + "\"></span><span class=\"cat-btn-label\">" + cat.label + "</span>";
      b.addEventListener("click", () => this.selectCategory(cat.id));
      bar.appendChild(b);
    });
    const n = document.createElement("button");
    n.className = "cat-btn";
    n.dataset.category = "";
    n.title = "Clear";
    n.innerHTML = "<span class=\"cat-btn-dot\" style=\"background:rgba(255,255,255,.3);font-size:9px;\">x</span><span class=\"cat-btn-label\">Clear</span>";
    n.addEventListener("click", () => this.selectCategory(null));
    bar.appendChild(n);
  },

  selectCategory(catId) {
    if (this.activeCategory === catId) catId = null;
    this.activeCategory = catId;
    document.querySelectorAll(".cat-btn").forEach(b => {
      b.classList.toggle("active", b.dataset.category === (catId || ""));
    });
    this.renderMarkers();
  },

  renderMarkers() {
    const group = document.getElementById("eventsGroup");
    if (!group) return;
    group.innerHTML = "";
    if (!this.activeCategory) return;
    const events = this.eventsByCategory[this.activeCategory] || [];
    if (events.length === 0) return;
    const catDef = this.CATEGORIES.find(c => c.id === this.activeCategory);
    const baseColor = catDef ? catDef.color : "#888";
    const clipMaxY = 1500;

    // On personal scale, cap historical events above the lifeline
    const isPersonalScale = new URLSearchParams(window.location.search).get("variant") === "personal";
    const LIFELINE_Y = 380;
    const lifelineClipMaxY = isPersonalScale ? (LIFELINE_Y - 50) : clipMaxY;

    const ns = "http://www.w3.org/2000/svg";
    const CHAR_W = 8;
    const PAD = 15;
    const BASE_Y = 240;
    const SPACING = 28;

    function textW(t) { return ((t || "").length * CHAR_W) + PAD * 2; }

    function addToPool(pool, x0, x1) {
      for (let li = 0; li < pool.length; li++) {
        let free = true;
        for (const r of pool[li]) {
          if (x0 < r.x1 && x1 > r.x0) { free = false; break; }
        }
        if (free) { pool[li].push({ x0, x1 }); return li; }
      }
      pool.push([{ x0, x1 }]);
      return pool.length - 1;
    }

    // TWO POOLS: era bars pack in top lanes, point events fill gaps between them
    const eraPool = [];
    const ptPool = [];
    let eraMaxLane = 0;

    // Pass 1: era bars only
    events.forEach(ev => {
      if (!ev.era) return;
      let x1 = yearToScrewX(ev.startYear);
      let x2 = yearToScrewX(ev.endYear);
      if (x2 <= x1) return;
      const w = Math.max(x2 - x1, 4);
      const bw = textW(ev.title);
      const cx = (x1 + x2) / 2;
      const collideX0 = Math.min(x1, cx - bw/2);
      const collideX1 = Math.max(x2, cx + bw/2);
      const lane = addToPool(eraPool, collideX0, collideX1);
      if (lane > eraMaxLane) eraMaxLane = lane;
      const barY = BASE_Y + lane * SPACING;
      if (barY > lifelineClipMaxY) return;
      const bar = document.createElementNS(ns, "rect");
      bar.setAttribute("x", x1);
      bar.setAttribute("y", barY);
      bar.setAttribute("width", w);
      bar.setAttribute("height", "6");
      bar.setAttribute("fill", baseColor);
      bar.setAttribute("opacity", "0.5");
      bar.setAttribute("rx", "2");
      const t = document.createElementNS(ns, "title");
      t.textContent = ev.title + " (" + ev.startYear + "-" + ev.endYear + ")";
      bar.appendChild(t);
      group.appendChild(bar);
      const l = document.createElementNS(ns, "text");
      l.setAttribute("x", x1 + w/2);
      l.setAttribute("y", barY + 14);
      l.setAttribute("text-anchor", "middle");
      l.setAttribute("fill", "rgba(255,255,255,.9)");
      l.setAttribute("font-size", "11");
      l.setAttribute("font-weight", "700");
      l.setAttribute("opacity", "0.95");
      l.textContent = ev.title;
      group.appendChild(l);
      attachTooltip(bar, ev);
      attachTooltip(l, ev);
    });

    // Pass 2: point events — try era lanes first, fall through to pt lanes below
    // Helper: check if (x0,x1) overlaps any rect in a lane
    function overlapsAny(laneRects, x0, x1) {
      for (const r of laneRects) {
        if (x0 < r.x1 && x1 > r.x0) return true;
      }
      return false;
    }
    const ptBaseY = BASE_Y + (eraMaxLane + 1) * SPACING;
    events.forEach(ev => {
      if (ev.era) return;
      const x = yearToScrewX(ev.year);
      const label = ev.year + " " + (ev.title || "");
      const lw = textW(label) + 20;
      const ptX0 = x - 1;
      const ptX1 = x + lw;
      // Try era lanes first — pick the first one where point doesn't overlap any era bar
      let lane = -1;
      let barY = 0;
      for (let li = 0; li < eraPool.length; li++) {
        if (!overlapsAny(eraPool[li], ptX0, ptX1)) {
          lane = li;
          barY = BASE_Y + lane * SPACING;
          break;
        }
      }
      if (lane === -1) {
        // No gap in era lanes — go to point pool below
        lane = addToPool(ptPool, ptX0, ptX1);
        barY = ptBaseY + lane * SPACING;
      } else {
        // Register in era lane so subsequent point events see the slot taken
        eraPool[lane].push({ x0: ptX0, x1: ptX1 });
      }
      if (barY > lifelineClipMaxY) return;
      const rect = document.createElementNS(ns, "rect");
      rect.setAttribute("x", x - 1);
      rect.setAttribute("y", barY);
      rect.setAttribute("width", "3");
      rect.setAttribute("height", "12");
      rect.setAttribute("fill", baseColor);
      rect.setAttribute("opacity", "0.85");
      rect.setAttribute("rx", "1");
      rect.dataset.year = ev.year;
      const t = document.createElementNS(ns, "title");
      t.textContent = ev.year + " " + (ev.title || "");
      rect.appendChild(t);
      rect.style.cursor = "pointer";
      rect.addEventListener("click", () => {
        const d = new Date(Date.UTC(ev.year, 6, 1));
        if (typeof timeState !== "undefined") {
          if (typeof timeState.goToYear === "function") { timeState.goToYear(ev.year); return; }
          if (typeof dateToScrollX === "function") { timeState.scrollX = dateToScrollX(d); timeState.dateUTC = d; }
        }
      });
      group.appendChild(rect);
      const l = document.createElementNS(ns, "text");
      l.setAttribute("x", x + 5);
      l.setAttribute("y", barY + 9);
      l.setAttribute("text-anchor", "start");
      l.setAttribute("fill", "rgba(255,255,255,.85)");
      l.setAttribute("font-size", "10");
      l.setAttribute("font-weight", "600");
      l.setAttribute("opacity", "0.85");
      l.textContent = ev.year + " " + (ev.title || "");
      group.appendChild(l);
      attachTooltip(rect, ev);
      attachTooltip(l, ev);
    });
  }
};

// ---- Wikipedia tooltip system ----

// Keep tooltip open when hovering it (so user can click links)
if (typeof document !== "undefined") {
  document.addEventListener("DOMContentLoaded", () => {
    const tip = document.getElementById("eventTooltip");
    if (tip) {
      tip.addEventListener("mouseenter", () => cancelHideTooltip());
      tip.addEventListener("mouseleave", () => hideTooltip());
    }
  });
}
const tooltipCache = {};

function showTooltip(ev, mouseX, mouseY) {
  const el = document.getElementById("eventTooltip");
  if (!el) return;
  const titleEl = document.getElementById("tooltipTitle");
  const descEl = document.getElementById("tooltipDesc");
  const thumbEl = document.getElementById("tooltipThumb");
  const anchor = document.getElementById("tooltipAnchor");
  if (!titleEl || !descEl || !anchor) return;

  // Show subtitle immediately (no network dependency)
  const yearStr = ev.year || ev.startYear || "";
  const dateStr = ev.date || "";
  let titlePrefix = yearStr ? yearStr + " " : "";
  if (dateStr) {
    const d = new Date(dateStr + "T00:00:00Z");
    if (!isNaN(d.getTime())) {
      titlePrefix = d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }) + " ";
    }
  }
  titleEl.textContent = titlePrefix + ev.title;
  
  // Use subtitle as instant summary, or fall back to subtitle-like info
  descEl.textContent = ev.subtitle || ev.description || "";
  
  // Always clear thumbnail first — no stale images between events
  thumbEl.innerHTML = "";
  
  // Try Wikipedia as background enrichment (silent, never blocks)
  const wiki = ev.wiki || ev.title.replace(/[^a-zA-Z0-9 ]/g, "").replace(/ /g, "_");
  anchor.href = "https://en.wikipedia.org/wiki/" + wiki;
  
  if (tooltipCache[wiki]) {
    const data = tooltipCache[wiki];
    const thumbUrl = typeof data.thumbnail === "string" ? data.thumbnail :
                     (data.thumbnail && data.thumbnail.source) ? data.thumbnail.source : null;
    if (thumbUrl) {
      thumbEl.innerHTML = '<img src="' + thumbUrl + '" alt="" loading="lazy" />';
    }
  } else {
    // Try Wikipedia summary API first, fall back to search if 404
    fetchSummary(wiki);
  }
  
  function fetchSummary(title) {
    fetch("https://en.wikipedia.org/api/rest_v1/page/summary/" + encodeURIComponent(title))
      .then(r => r.ok ? r.json() : Promise.reject({status: r.status, title: title}))
      .then(data => {
        tooltipCache[title] = data;
        const thumbUrl = data.thumbnail && data.thumbnail.source ? data.thumbnail.source : null;
        if (thumbUrl) {
          thumbEl.innerHTML = '<img src="' + thumbUrl + '" alt="" loading="lazy" />';
        }
      })
      .catch(err => {
        if (err.status === 404) {
          // Title not found — search Wikipedia for the event title (without year)
          const searchTerm = ev.title.replace(/[,;:!?]/g, "");
          const searchUrl = "https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=" +
            encodeURIComponent(searchTerm) + "&format=json&origin=*&srlimit=1";
          fetch(searchUrl)
            .then(r => r.json())
            .then(data => {
              const pages = data.query && data.query.search;
              if (pages && pages.length > 0) {
                const realTitle = pages[0].title;
                tooltipCache[wiki] = { realTitle: realTitle };
                // Now fetch the real page summary
                return fetch("https://en.wikipedia.org/api/rest_v1/page/summary/" + encodeURIComponent(realTitle));
              }
            })
            .then(r => r && r.ok ? r.json() : null)
            .then(data => {
              if (data) {
                tooltipCache[data.title] = data;
                const thumbUrl = data.thumbnail && data.thumbnail.source ? data.thumbnail.source : null;
                if (thumbUrl) {
                  thumbEl.innerHTML = '<img src="' + thumbUrl + '" alt="" loading="lazy" />';
                }
              }
            })
            .catch(() => {});
        }
      });
  }
  
  // Position near mouse but keep in viewport
  let left = mouseX + 16;
  let top = mouseY - 10;
  const w = 380;
  const vw = window.innerWidth;
  if (left + w > vw - 20) left = mouseX - w - 16;
  if (left < 10) left = 10;
  if (top + 300 > window.innerHeight) top = window.innerHeight - 310;
  if (top < 10) top = 10;
  
  el.style.left = left + "px";
  el.style.top = top + "px";
  el.style.display = "block";
}

let hideTooltipTimer = null;

function hideTooltip() {
  // Short delay so the user can move mouse from the marker to the tooltip
  if (hideTooltipTimer) clearTimeout(hideTooltipTimer);
  hideTooltipTimer = setTimeout(() => {
    const el = document.getElementById("eventTooltip");
    if (el) el.style.display = "none";
  }, 150);
}

function cancelHideTooltip() {
  if (hideTooltipTimer) {
    clearTimeout(hideTooltipTimer);
    hideTooltipTimer = null;
  }
}

function attachTooltip(el, ev) {
  if (!el || !ev) return;
  el.addEventListener("mouseenter", (e) => showTooltip(ev, e.clientX, e.clientY));
  // No mousemove tracking — tooltip stays fixed in place so user can click links
  el.addEventListener("mouseleave", () => hideTooltip());
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => EventsRenderer.init());
} else {
  EventsRenderer.init();
}

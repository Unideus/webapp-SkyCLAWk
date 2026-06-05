/* conjunction-selector.js — UI for selecting a planetary ☌ cycle
   =========================================================
   Phase 1 (this patch):
   • Adds a small popout to choose Planet 1 + Planet 2
   • Persists choice in localStorage
   • Updates labels: top cycle button + prev/next conjunction nav buttons
   • Does NOT yet rebuild the timeline cycle graphics (next step)
   ========================================================= */
(function () {
  const cycleModal = document.getElementById("cycleModal");
  const cycleFab   = document.getElementById("cycleFab");
  const cycleClose = document.getElementById("cycleClose");
  const cycleApply = document.getElementById("cycleApply");
  const p1Sel      = document.getElementById("cyclePlanet1");
  const p2Sel      = document.getElementById("cyclePlanet2");

  if (!cycleModal || !cycleFab || !cycleClose || !cycleApply || !p1Sel || !p2Sel) {
    console.warn("[cycle] modal DOM not found; conjunction selector disabled.");
    return;
  }

  // Move cycleModal out of wheelModal so it opens independently
  if (cycleModal.parentElement && cycleModal.parentElement.id === "wheelModal") {
    document.body.appendChild(cycleModal);
  }

  const cycleCardEl = cycleModal.querySelector(".zyModalCard");
  const cycleBackdropEl = cycleModal.querySelector(".zyModalBackdrop");

    const PLANETS = [
        { id: "Mercury", label: "Mercury ☿", glyph: "☿", outer: true },
        { id: "Venus",   label: "Venus ♀",   glyph: "♀", outer: true },
        { id: "Mars",    label: "Mars ♂",    glyph: "♂", outer: true },
        { id: "Jupiter", label: "Jupiter ♃", glyph: "♃", outer: true },
        { id: "Saturn",  label: "Saturn ♄",  glyph: "♄", outer: true },
        { id: "Uranus",  label: "Uranus ♅",  glyph: "♅", outer: true },
        { id: "Neptune", label: "Neptune ♆", glyph: "♆", outer: true },
        { id: "Pluto",   label: "Pluto ♇",   glyph: "♇", outer: true },
    ];

  const planetById = new Map(PLANETS.map(p => [p.id, p]));

  function getScale() {
    // Read from URL variant, window global, or localStorage (fallback)
    const url = new URLSearchParams(window.location.search).get("variant");
    if (/^(generational|personal)$/.test(url)) return url;
    if (typeof window.TIMELINE_SCALE === "string" && /^(generational|personal)$/.test(window.TIMELINE_SCALE)) return window.TIMELINE_SCALE;
    return localStorage.getItem("zy_timeline_scale") || "generational";
  }

  function fillSelect(sel) {
    sel.innerHTML = "";
    const isPersonal = (getScale() === "personal");
    for (const p of PLANETS) {
      const opt = document.createElement("option");
      opt.value = p.id;
      opt.textContent = p.label;
      opt.disabled = (!isPersonal && !p.outer);
      if (opt.disabled) opt.style.opacity = "0.35";
      sel.appendChild(opt);
    }
  }

  function getGlyph(id) {
    const p = planetById.get(id);
    return p ? p.glyph : "?";
  }

  function parseEventOrdinal(t) {
    const m = String(t || "").match(/^([+-]?\d+)-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?Z$/);
    if (!m) return NaN;
    const y = parseInt(m[1], 10);
    const mon = parseInt(m[2], 10);
    const day = parseInt(m[3], 10);
    const hh = parseInt(m[4], 10);
    const mm = parseInt(m[5], 10);
    const ss = parseInt(m[6] || "0", 10);
    return (y * 365.2425) + ((mon - 1) * 30.436875) + day + (hh / 24) + (mm / 1440) + (ss / 86400);
  }

  function getCycleLengthLabel(p1, p2) {
    const map = window.CONJUNCTION_DATASETS || {};
    const ds = map[`${p1}|${p2}`] || map[`${p2}|${p1}`];
    const events = (ds && Array.isArray(ds.events)) ? ds.events : [];
    const gaps = [];
    for (let i = 0; i < events.length - 1; i++) {
      const a = parseEventOrdinal(events[i]?.t);
      const b = parseEventOrdinal(events[i + 1]?.t);
      const gapDays = b - a;
      if (Number.isFinite(gapDays) && gapDays > 0) gaps.push(gapDays);
    }
    if (!gaps.length) return "";
    gaps.sort((a, b) => a - b);
    const mid = Math.floor(gaps.length / 2);
    const days = gaps.length % 2 ? gaps[mid] : (gaps[mid - 1] + gaps[mid]) / 2;
    if (days < 730) {
      const months = Math.max(1, Math.round(days / 30.436875));
      return `≈${months} mo`;
    }
    const years = days / 365.2425;
    const rounded = years < 30 ? (Math.round(years * 10) / 10) : Math.round(years);
    return `≈${String(rounded).replace(/\.0$/, "")} yr`;
  }

  function setCycleSelection(p1, p2, persist = true) {
    // Defaults now that Jupiter is removed from the modal:
    if (!planetById.has(p1)) p1 = "Saturn";
    if (!planetById.has(p2)) p2 = "Neptune";

    // If same planet chosen, pick a sane alternate that exists in PLANETS
    if (p1 === p2) {
      // prefer Neptune unless p1 is Neptune, then use Uranus
      p2 = (p1 === "Neptune") ? "Uranus" : "Neptune";
      // if still somehow invalid, hard fallback
      if (!planetById.has(p2)) p2 = "Uranus";
    }

    if (persist) {
      localStorage.setItem("zy_cycle_p1", p1);
      localStorage.setItem("zy_cycle_p2", p2);
    }

    // Global anchor for next step (cycle renderer swap)
    window.CycleSelection = { p1, p2 };

    // Global helper: active conjunction list for the currently selected pair
    window.getActiveConjunctionEvents = function () {
    const sel = window.CycleSelection || { p1: "Saturn", p2: "Neptune" };
    const key = `${sel.p1}|${sel.p2}`;

    const map = window.CONJUNCTION_DATASETS || {};
    const ds = map[key] || map[`${sel.p2}|${sel.p1}`];

    // Fallback: legacy Saturn–Jupiter dataset
    if (!ds || !Array.isArray(ds.events) || ds.events.length < 2) {
        return window.CONJUNCTION_DATA || [];
    }
    return ds.events;
    };

    const g1 = getGlyph(p1);
    const g2 = getGlyph(p2);
    const pair = `${g1} ☌ ${g2}`;
    const pairHtml = `<span style="font-size:1.28em">${g1}</span> ☌ <span style="font-size:1.28em">${g2}</span>`;
    const lengthLabel = getCycleLengthLabel(p1, p2);
    const pairWithLengthHtml = lengthLabel
      ? `${pairHtml} <span style="font-size:0.78em;opacity:0.82;margin-left:4px;white-space:nowrap;">${lengthLabel}</span>`
      : pairHtml;
    const textSpan = cycleFab.querySelector('.cycleFabText');
    if (textSpan) {
      textSpan.textContent = "Choose Planetary Conjunction Cycle";
    }

    // Keep the conj nav buttons consistent with the chosen pair
    const prevConjBtn = document.getElementById("prevConjBtn");
    const nextConjBtn = document.getElementById("nextConjBtn");
    if (prevConjBtn) prevConjBtn.innerHTML = `← ${pairWithLengthHtml}`;
    if (nextConjBtn) nextConjBtn.innerHTML = `${pairWithLengthHtml} →`;
  }

  function openCycle() {
    // Refresh options in case scale changed since init
    fillSelect(p1Sel);
    fillSelect(p2Sel);

    // Validate current selection against new scale
    const isPersonal = (getScale() === "personal");
    const currentSel = window.CycleSelection || {};
    if (!isPersonal) {
      const p1 = planetById.get(currentSel.p1);
      const p2 = planetById.get(currentSel.p2);
      if ((p1 && !p1.outer) || (p2 && !p2.outer)) {
        // Fallback to Jupiter–Saturn (always valid)
        setCycleSelection("Jupiter", "Saturn", true);
      }
    }

    cycleModal.setAttribute("aria-hidden", "false");

    // Click-through modal: only the card captures input (matches wheel behavior)
    cycleModal.style.pointerEvents = "none";
    if (cycleBackdropEl) cycleBackdropEl.style.pointerEvents = "none";
    if (cycleCardEl) cycleCardEl.style.pointerEvents = "auto";

    // Anchor card BELOW the Cycle button (viewport coords)
    const r = cycleFab.getBoundingClientRect();

    const margin = 8;
    const desiredLeft = r.left;
    const desiredTop  = r.bottom + 4; // 4px gap below button

    // Clamp so it never renders off-screen
    const cardW = cycleCardEl.offsetWidth || 360;
    const cardH = cycleCardEl.offsetHeight || 220;

    const maxLeft = Math.max(margin, window.innerWidth - cardW - margin);
    const maxTop  = Math.max(margin, window.innerHeight - cardH - margin);

    const left = Math.min(Math.max(desiredLeft, margin), maxLeft);
    const top  = Math.min(Math.max(desiredTop,  margin), maxTop);

    cycleCardEl.style.left = `${left}px`;
    cycleCardEl.style.top  = `${top}px`;

    // Sync selects to current selection
    const selection = window.CycleSelection || {};
    if (selection.p1) p1Sel.value = selection.p1;
    if (selection.p2) p2Sel.value = selection.p2;
    }

  function closeCycle() {
    cycleModal.setAttribute("aria-hidden", "true");

    // reset (safe)
    cycleModal.style.pointerEvents = "";
    if (cycleBackdropEl) cycleBackdropEl.style.pointerEvents = "";
    if (cycleCardEl) cycleCardEl.style.pointerEvents = "";
  }

  // init
  fillSelect(p1Sel);
  fillSelect(p2Sel);

  const savedP1 = localStorage.getItem("zy_cycle_p1") || "Saturn";
  const savedP2 = localStorage.getItem("zy_cycle_p2") || "Neptune";
  setCycleSelection(savedP1, savedP2, false);

  closeCycle();

  // wiring
  cycleFab.addEventListener("click", openCycle);
  cycleClose.addEventListener("click", closeCycle);

  cycleApply.addEventListener("click", () => {
    setCycleSelection(p1Sel.value, p2Sel.value, true);
    closeCycle();

    // Hook for next step (renderer swap)
    window.dispatchEvent(new CustomEvent("zy:cyclechange", { detail: window.CycleSelection }));

    // Force rebuild immediately (covers cases where listeners attach late)
    try {
    if (typeof window.rebuildConjunctionCycleBand === "function") window.rebuildConjunctionCycleBand();
    else if (typeof window.buildElementalCycle === "function") window.buildElementalCycle();
    } catch (e) {
    console.warn("[cycle] immediate rebuild failed", e);
    }
  });

  cycleModal.addEventListener("click", (ev) => {
    const t = ev.target;
    if (t && t.getAttribute && t.getAttribute("data-close") === "cycle") closeCycle();
  });

  window.addEventListener("keydown", (ev) => {
    if (ev.key === "Escape" && cycleModal.getAttribute("aria-hidden") === "false") closeCycle();
  });
})();
// js/main.js — Vite entry point
// Boots Swiss Ephemeris via the npm library's load() function
// which resolves the correct WASM from @fusionstrings/swiss-eph

import { Constants, SwissEph, load } from "@fusionstrings/swiss-eph/wasi";
import { initSWE, computeChart, formatChart, PLANET_NAMES, PLANET_SYMBOLS, SIGN_NAMES } from "./astro-engine.js";
import { TOPICS, scoreMoment, findBestTime } from "./rules-engine.js";

async function boot() {
  try {
    // Use the npm library's load() which resolves the bundled WASM
    // This gives us the full Swiss Ephemeris (1.27MB) with ephe data embedded
    const eph = await load();

    const swe = {
      swe_calc_ut: (jd_ut, ipl, iflag) => {
        try { return eph.swe_calc_ut(jd_ut, ipl, iflag); }
        catch(e) { return null; }
      },
      swe_julday: (y, m, d, hr, greg) => eph.swe_julday(y, m, d, hr, greg),
      swe_houses: (jd_ut, lat, lon, hsys) => eph.swe_houses_ex2(jd_ut, lat, lon, hsys),
      swe_set_ephe_path: (p) => {
        if (typeof eph.set_ephe_path === "function") eph.set_ephe_path(p);
      },
    };

    initSWE(swe, Constants);
    console.log("[SWE] ready");
    const st = document.getElementById("sweStatus");
    if (st) { st.style.display = "block"; st.style.background = "rgba(74,222,128,0.12)"; st.style.border = "1px solid #4ade80"; st.style.color = "#4ade80"; st.textContent = "\u2713 Swiss Ephemeris loaded"; }
  } catch(err) {
    console.warn("[SWE] init failed, using fallback ephemeris:", err);
    const st = document.getElementById("sweStatus");
    if (st) { st.style.display = "block"; st.style.background = "rgba(249,113,113,0.12)"; st.style.border = "1px solid #f87171"; st.style.color = "#f87171"; st.textContent = "\u26a0 Swiss Ephemeris failed to load. Calculations use approximate positions and may be unreliable."; }
  }

  window.TOPICS = TOPICS;
  window.scoreMoment = scoreMoment;
  window.findBestTime = findBestTime;
  window.PLANET_NAMES = PLANET_NAMES;
  window.PLANET_SYMBOLS = PLANET_SYMBOLS;
  window.SIGN_NAMES = SIGN_NAMES;
  window.formatChart = formatChart;

  ['topic-find','topic-check'].forEach(id => {
    const sel = document.getElementById(id);
    if (sel) {
      sel.innerHTML = Object.entries(TOPICS).map(([k,v]) => `<option value="${k}">${v.label}</option>`).join('');
    }
  });

  window.dispatchEvent(new Event("auspicious-ready"));
}

boot().catch(err => console.error("[Auspicious] boot failed:", err));
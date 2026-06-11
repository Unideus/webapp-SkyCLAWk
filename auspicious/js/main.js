// js/main.js — Vite entry point
// Boots Swiss Ephemeris from local WASM copy

import { Constants, SwissEph, load } from "../../node_modules/@fusionstrings/swiss-eph/src/main.js";
import { initSWE, computeChart, formatChart, PLANET_NAMES, PLANET_SYMBOLS, SIGN_NAMES } from "./astro-engine.js";
import { TOPICS, scoreMoment, findBestTime } from "./rules-engine.js";

async function boot() {
  try {
    // WASM is copied to /wasm/swiss_eph.wasm (via public/ directory, served by Vite)
    const wasmUrl = new URL("/auspicious/wasm/swiss_eph.wasm", window.location.origin);
    const resp = await fetch(wasmUrl);
    if (!resp.ok) throw new Error("WASM fetch failed: " + resp.status);
    const wasmModule = await WebAssembly.compile(await resp.arrayBuffer());
    const eph = new SwissEph(wasmModule);

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

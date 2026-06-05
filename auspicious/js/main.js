// js/main.js — Vite entry point
// Boots Swiss Ephemeris using the full WASI class API (same approach as Timeline app)
// The @fusionstrings/swiss-eph/wasi-loader provides instantiate() which returns
// a SwissEph class instance with swe_julday, swe_calc_ut, swe_houses_ex2, etc.
import { Constants } from "@fusionstrings/swiss-eph/wasi";
import { instantiate } from "@fusionstrings/swiss-eph/wasi-loader";
import { initSWE, computeChart, formatChart, PLANET_NAMES, PLANET_SYMBOLS, SIGN_NAMES } from './astro-engine.js';
import { TOPICS, scoreMoment, findBestTime } from './rules-engine.js';

async function boot() {
  try {
    // Load the WASM binary and instantiate SwissEph
    const eph = await instantiate();

    // Build the swe wrapper object that astro-engine's initSWE expects.
    // The astro-engine checks for swe_calc_ut / swe_julday / swe_houses_ex2
    // so we wrap the SwissEph class methods.
    const swe = {
      swe_calc_ut: (jd_ut, ipl, iflag) => {
        try {
          return eph.swe_calc_ut(jd_ut, ipl, iflag);
        } catch(e) {
          return null;
        }
      },
      swe_julday: (y, m, d, hr, greg) => eph.swe_julday(y, m, d, hr, greg),
      swe_houses: (jd_ut, lat, lon, hsys) => eph.swe_houses_ex2(jd_ut, lat, lon, hsys),
      swe_set_ephe_path: (p) => {
        if (typeof eph.swe_set_ephe_path === 'function') eph.swe_set_ephe_path(p);
      },
    };

    initSWE(swe, Constants);
    console.log("[SWE] ready");
  } catch(err) {
    console.warn("[SWE] init failed, using fallback ephemeris:", err);
  }

  // Expose globals that index.html inline scripts reference
  window.TOPICS = TOPICS;
  window.scoreMoment = scoreMoment;
  window.findBestTime = findBestTime;
  window.PLANET_NAMES = PLANET_NAMES;
  window.PLANET_SYMBOLS = PLANET_SYMBOLS;
  window.SIGN_NAMES = SIGN_NAMES;
  window.formatChart = formatChart;

  // Populate topic dropdowns
  ['topic-find','topic-check'].forEach(id => {
    const sel = document.getElementById(id);
    if (sel) {
      sel.innerHTML = Object.entries(TOPICS).map(([k,v]) => `<option value="${k}">${v.label}</option>`).join('');
    }
  });

  window.dispatchEvent(new Event('auspicious-ready'));
}

boot().catch(err => console.error("[Auspicious] boot failed:", err));
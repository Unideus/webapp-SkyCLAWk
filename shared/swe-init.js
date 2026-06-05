// js/swe-init.js
// Initializes Swiss Ephemeris (WASM/WASI)
// This file is bundled by Vite for production (resolves bare imports)

window.SWE_READY = false;

async function initSwiss() {
  try {
    const { Constants, load } = await import("../node_modules/@fusionstrings/swiss-eph/src/main.js");
    const eph = await load();

    const SWE = {
      ...Constants,
      julday: (y, m, d, hour, gregflag) => eph.swe_julday(y, m, d, hour, gregflag),
      calc_ut: (jd_ut, bodyId, flags) => {
        const out = eph.swe_calc_ut(jd_ut, bodyId, flags);
        if (out && out.error && !out.error.includes("not found")) {
          console.warn("[SWE] swe_calc_ut:", out.error);
        }
        return out;
      },
      houses_ex2: (...args) => eph.swe_houses_ex2?.(...args),
      fixstar2_ut: (star, tjd_ut, iflag) => {
        if (!eph.swe_fixstar2_ut) return undefined;
        return eph.swe_fixstar2_ut(star, tjd_ut, iflag);
      },
      swe_set_ephe_path: (p) => eph.set_ephe_path?.(p),  // delegates to set_ephe_path (heap-allocates string)
      swe_set_ephe_path_utf8: (p) => eph.swe_set_ephe_path_utf8?.(p),
      mount: (path, content) => eph.mount?.(path, content),
      eph,
    };

    window.SWE = SWE;
    window.SWE_CONST = Constants;

    // Mount fixed star catalog into WASM virtual filesystem BEFORE setting READY
    // fixstar2_ut reads sefstars.txt for star J2000 positions and proper motions.
    // Without it, only Spica (the ecliptic reference star) returns a valid position.
    const sefstars = "/ephe/sefstars.txt";
    try {
      const resp = await fetch(sefstars);
      if (resp.ok) {
        const buf = new Uint8Array(await resp.arrayBuffer());
        eph.mount("sefstars.txt", buf);
        // Set path so SwissEph finds files in virtual filesystem
        try { eph.set_ephe_path("."); } catch (e) {}
        console.log("[SWE] mounted sefstars.txt for fixed star positions");
      } else {
        console.warn("[SWE] could not fetch", sefstars, resp.status);
      }
    } catch (e) {
      console.warn("[SWE] could not mount star catalog:", e.message);
    }

    window.SWE_READY = true;
    console.log("[SWE] ready");
  } catch (err) {
    console.warn("[SWE] init failed (wheel will fall back to astronomy-engine).", err);
    window.SWE_READY = false;
  }
}

window.SWE_READY_PROMISE = initSwiss();

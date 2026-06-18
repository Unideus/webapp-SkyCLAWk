/* astronomy-adapter.js — ephemeris adapter layer */
/* =========================================================
   PLANET LONGITUDES ADAPTER
   Geocentric apparent ecliptic longitudes (retrograde-capable)
   + Smooth Mean Lunar Nodes (☊/☋)
   ========================================================= */

	// Simple time-based cache: only recompute when date changes
	let _lastLonCache = { date: null, result: null };
	
	function getPlanetLongitudes(dateUTC) {
	  // Check cache — same date (rounded to 30s) = same result
	  const dateKey = (dateUTC instanceof Date && Number.isFinite(dateUTC.getTime()))
	    ? Math.round(dateUTC.getTime() / 30000)
	    : null;
	  if (_lastLonCache.date !== null && _lastLonCache.date === dateKey && _lastLonCache.result) {
	    return _lastLonCache.result;
	  }
	  // Normalize degrees to [0, 360)
	  const norm = (deg) => ((deg % 360) + 360) % 360;
	  
	  	// If caller supplies a date (natal), use it; otherwise use live engine time.
		const useDate = (dateUTC instanceof Date) ? dateUTC : AstroEngine.dateUTC;

		// Simple Date -> Julian Day (UTC) for fallback mode
		const jdFromDateUTC = (d) => {
			const y = d.getUTCFullYear();
			const m = d.getUTCMonth() + 1;
			const day =
				d.getUTCDate() +
				(d.getUTCHours() + (d.getUTCMinutes() + (d.getUTCSeconds() / 60)) / 60) / 24;

			let Y = y;
			let M = m;
			if (M <= 2) { Y -= 1; M += 12; }

			const A = Math.floor(Y / 100);
			const B = 2 - A + Math.floor(A / 4);

			const jd =
				Math.floor(365.25 * (Y + 4716)) +
				Math.floor(30.6001 * (M + 1)) +
				day + B - 1524.5;

			return jd;
		};


	  // Mean lunar ascending node longitude (smooth regression), degrees
	  // Ω = 125.04452 − 1934.136261*T + 0.0020708*T^2 + T^3/450000
	  // where T = Julian centuries since J2000.0
	  const meanAscendingNodeLon = (jd) => {
		const T = (jd - 2451545.0) / 36525.0;
		const omega =
		  125.04452
		  - 1934.136261 * T
		  + 0.0020708 * T * T
		  + (T * T * T) / 450000;
		return norm(omega);
	  };

	  // Always available (from your engine)
	  const jd = jdFromDateUTC(useDate);

	  // Always compute nodes smoothly (even in fallback)
	  const nodeA = meanAscendingNodeLon(jd);       // ☊
	  const nodeD = norm(nodeA + 180);              // ☋ (locked opposite)

	// ---------------------------------------------------------
	// PRIMARY (preferred): Swiss Ephemeris (WASM) if available
	// ---------------------------------------------------------
	const canSwiss = !!(
	window.SWE_READY &&
	window.SWE &&
	(typeof window.SWE.calc_ut === "function" || typeof window.SWE.swe_calc_ut === "function")
	);

	
	if (canSwiss) {
	const swe = window.SWE;

	// constants may live on window.Constants (from your swe-init) or on the module wrapper
	const C = window.SWE_CONST || window.Constants || swe;

	const getConst = (name, fallback = 0) =>
		(typeof C?.[name] !== "undefined") ? C[name] :
		(typeof swe?.[name] !== "undefined") ? swe[name] :
		fallback;

	const gregFlag = getConst("SE_GREG_CAL", 1);

	// Prefer swe_julday/julday if exposed; otherwise keep incoming jd
	let jdSwe = jd;
	try {
		const hour =
		useDate.getUTCHours() +
		useDate.getUTCMinutes() / 60 +
		useDate.getUTCSeconds() / 3600 +
		useDate.getUTCMilliseconds() / 3600000;

		// swe_julday_ut takes UTC hour; fall back to swe_julday (local time) if not available
		const juldayFn =
		(typeof swe.swe_julday_ut === "function") ? swe.swe_julday_ut :
		(typeof swe.swe_julday === "function") ? swe.swe_julday :
		(typeof swe.julday === "function") ? swe.julday :
		null;

		if (juldayFn) {
		jdSwe = juldayFn(
			useDate.getUTCFullYear(),
			useDate.getUTCMonth() + 1,
			useDate.getUTCDate(),
			hour,
			gregFlag
		);
		}
	} catch (e) {
		// keep jdSwe = jd
	}

	// Call calc in whichever shape exists
	const calcFn =
		(typeof swe.swe_calc_ut === "function") ? swe.swe_calc_ut :
		(typeof swe.calc_ut === "function") ? swe.calc_ut :
		null;

	// Force Moshier: stop SwissEph from trying to load .se1 files
	// (setting empty path + SEFLG_MOSEPH forces built-in Moshier ephemeris, no file I/O)
	try {
	  if (typeof swe.swe_set_ephe_path === 'function') {
	    swe.swe_set_ephe_path('.');
	  }
	} catch (e) { /* ignore */ }

	// Robust longitude extractor:
	// supports: {xx: Float64Array}, {xx: number[]}, Float64Array, number[], [xx, retflag], etc.
	const extractLon = (out) => {
		if (out == null) return NaN;

		// If it’s an object with xx/data, use that
		let xx =
		(out && typeof out === "object" && out.xx != null) ? out.xx :
		(out && typeof out === "object" && out.data != null) ? out.data :
		out;

		// If it’s [xx, ...] (some wrappers), take first
		if (Array.isArray(xx) && xx.length && (Array.isArray(xx[0]) || (xx[0] && typeof xx[0].length === "number"))) {
		xx = xx[0];
		}

		// TypedArray / array-like -> array
		if (xx && typeof xx === "object" && typeof xx.length === "number" && !Array.isArray(xx)) {
		xx = Array.from(xx);
		}

		const lon = Array.isArray(xx) ? Number(xx[0]) : Number(xx);
		return lon;
	};

	// Prefer Moshier (built-in ephemeris data, no external files needed).
	// SEFLG_MOSEPH=4, SEFLG_SWIEPH=2, SEFLG_SPEED=256 (from SwissEph API)
	const flagsMoshier = 4 | 256;   // Moshier + speed
	const flagsSwiss   = 2 | 256;   // File-based + speed (requires .se1 files)

	const swissLon = (pid) => {
		// 1) Try Moshier first (quiet + fileless)
		let out = calcFn(jdSwe, pid, flagsMoshier);
		let lon = extractLon(out);

		// 2) If needed, try Swiss file-based
		if (!Number.isFinite(lon)) {
			out = calcFn(jdSwe, pid, flagsSwiss);
			lon = extractLon(out);
		}

		if (!Number.isFinite(lon)) throw new Error("SwissEph calc_ut returned non-finite longitude");
		return norm(lon);
	};

	try {
		const pid = (name) => getConst(name, null);

		const result = {
		sun:     swissLon(pid("SE_SUN")),
		moon:    swissLon(pid("SE_MOON")),
		mercury: swissLon(pid("SE_MERCURY")),
		venus:   swissLon(pid("SE_VENUS")),
		mars:    swissLon(pid("SE_MARS")),
		jupiter: swissLon(pid("SE_JUPITER")),
		saturn:  swissLon(pid("SE_SATURN")),
		uranus:  swissLon(pid("SE_URANUS")),
		neptune: swissLon(pid("SE_NEPTUNE")),
		pluto:   swissLon(pid("SE_PLUTO")),

		// Asteroids (Chiron, Ceres, Pallas, Juno, Vesta, Eros 433)
		// Use fallback if Swiss Eph doesn't have the data
		chiron:  (() => { const p = pid("SE_CHIRON"); const l = p ? swissLon(p) : 0; return l || norm(214.0 + ((jd - 2451545.0) / 365.25 * 360 / 50.7)); })(),
		ceres:   (() => { const p = pid("SE_CERES"); const l = p ? swissLon(p) : 0; return l || norm(117.0 + ((jd - 2451545.0) / 365.25 * 360 / 4.61)); })(),
		pallas:  (() => { const p = pid("SE_AST_OFFSET"); const l = p ? swissLon(p + 2) : 0; return l || norm(312.0 + ((jd - 2451545.0) / 365.25 * 360 / 4.62)); })(),
		juno:    (() => { const p = pid("SE_AST_OFFSET"); const l = p ? swissLon(p + 3) : 0; return l || norm(245.0 + ((jd - 2451545.0) / 365.25 * 360 / 4.36)); })(),
		vesta:   (() => { const p = pid("SE_AST_OFFSET"); const l = p ? swissLon(p + 7) : 0; return l || norm(150.0 + ((jd - 2451545.0) / 365.25 * 360 / 3.63)); })(),
		eros:    (() => { const p = pid("SE_AST_OFFSET"); const l = p ? swissLon(p + 433) : 0; return l || norm(11.0 + ((jd - 2451545.0) / 365.25 * 360 / 1.76)); })(),

		// nodes default (smooth mean regression)
		northNode: nodeA,
		southNode: nodeD
		};

		// Prefer TRUE node; only fall back to MEAN if TRUE is not available
		let nodePid = null;

		if (typeof swe.SE_TRUE_NODE !== "undefined") {
			nodePid = swe.SE_TRUE_NODE;
		if (!window.__SWE_NODE_LOGGED__) {
			console.log("[SWE] Using TRUE node");
			window.__SWE_NODE_LOGGED__ = true;
		}
		} else if (typeof swe.SE_MEAN_NODE !== "undefined") {
			nodePid = swe.SE_MEAN_NODE;
			console.warn("[SWE] TRUE node not available; using MEAN node (SE_MEAN_NODE)");
		}

		_lastLonCache = { date: dateKey, result: result };
		return result;
	} catch (err) {
		console.warn("[SWE] Swiss calc failed; falling back.", err);
		// continue into vendor/fallback branches below
	}
	}

	  // ---------------------------------------------------------
	  // FALLBACK: vendor library missing (keep wheel alive)
	  // ---------------------------------------------------------
	  if (typeof Astronomy === "undefined") {
		const days = (jd - 2451545.0);
		const years = days / 365.2425;

		return {
		  sun:     norm((270 + days * 0.985647) % 360),
		  moon:    norm((90  + days * (360 / 27.321661)) % 360),
		  mercury: norm((60  + days * (360 / 87.969))  % 360),
		  venus:   norm((180 + days * (360 / 224.701)) % 360),
		  mars:    norm((23 + years * (360 / 1.88))   % 360),
		  jupiter: norm((300 + days * (360 / (11.86 * 365.25))) % 360),
		  saturn:  norm((300 + days * (360 / (29.45 * 365.25))) % 360),
		  uranus:  norm((36 + years * (360 / 84.01))  % 360),
		  neptune: norm((348 + years * (360 / 164.8)) % 360),
		  pluto:   norm((293 + years * (360 / 248.0)) % 360),

		  // ☊ / ☋ (smooth + perfectly opposite)
		  northNode: nodeA,
		  southNode: nodeD
		};
	  }

	  // ---------------------------------------------------------
	  // PRIMARY: Astronomy Engine present
	  // ---------------------------------------------------------
	  try {
		// authoritative UTC instant -> Astronomy Time
		const t = Astronomy.MakeTime(useDate);

		// apparent geocentric ecliptic longitude
		const geoLon = (body) => {
		  const vec = Astronomy.GeoVector(body, t, true);
		  const ecl = Astronomy.Ecliptic(vec);
		  return norm(ecl.elon);
		};

		return {
		  sun:     geoLon(Astronomy.Body.Sun),
		  moon:    geoLon(Astronomy.Body.Moon),
		  mercury: geoLon(Astronomy.Body.Mercury),
		  venus:   geoLon(Astronomy.Body.Venus),
		  mars:    geoLon(Astronomy.Body.Mars),
		  jupiter: geoLon(Astronomy.Body.Jupiter),
		  saturn:  geoLon(Astronomy.Body.Saturn),
		  uranus:  geoLon(Astronomy.Body.Uranus),
		  neptune: geoLon(Astronomy.Body.Neptune),
		  pluto:   geoLon(Astronomy.Body.Pluto),

		  // ☊ / ☋ (smooth + perfectly opposite)
		  northNode: nodeA,
		  southNode: nodeD
		};
	  } catch (err) {
		console.warn("Astronomy Engine geocentric longitude calc failed; falling back.", err);

		// same fallback as above (but vendor exists yet failed on something)
		const days = (jd - 2451545.0);
		const years = days / 365.2425;

		return {
		  sun:     norm((270 + days * 0.985647) % 360),
		  moon:    norm((90  + days * (360 / 27.321661)) % 360),
		  mercury: norm((60  + days * (360 / 87.969))  % 360),
		  venus:   norm((180 + days * (360 / 224.701)) % 360),
		  mars:    norm((23 + years * (360 / 1.88))   % 360),
		  jupiter: norm((300 + days * (360 / (11.86 * 365.25))) % 360),
		  saturn:  norm((300 + days * (360 / (29.45 * 365.25))) % 360),
		  uranus:  norm((36 + years * (360 / 84.01))  % 360),
		  neptune: norm((348 + years * (360 / 164.8)) % 360),
		  pluto:   norm((293 + years * (360 / 248.0)) % 360),

		  // ☊ / ☋ (smooth + perfectly opposite)
		  northNode: nodeA,
		  southNode: nodeD
		};
	  }
	}

window.getRetrogradeState = function(dateUTC) {
  // Returns a Map keyed by body name (same keys as getPlanetLongitudes)
  // Values: 's' (station), 'rx' (retrograde), or '' (direct)
  const BODY_LIST = ['mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto'];
  const MS_PER_DAY = 86400000;

  function mod360(x) {
    return ((x % 360) + 360) % 360;
  }

  function dailyMotion(lon1, lon2) {
    // Apparent daily motion (deg/day), positive = direct
    return mod360(lon2 - lon1);
  }

  function motionFromDelta(delta) {
    // Convert raw delta to [0,360) then offset so direct≈+1, retrograde≈-1
    const d = mod360(delta);
    return (d > 180) ? d - 360 : d;
  }

  function getLonsAt(t) {
    const d = (t instanceof Date) ? t : new Date(t);
    return getPlanetLongitudes(d);
  }

  const lonNow  = getLonsAt(dateUTC);
  const lonYest = getLonsAt(new Date(dateUTC.getTime() - MS_PER_DAY));
  const lonTom  = getLonsAt(new Date(dateUTC.getTime() + MS_PER_DAY));

  const result = new Map();
  for (const k of BODY_LIST) {
    const lN = lonNow[k];
    const lY = lonYest[k];
    const lT = lonTom[k];
    if (!Number.isFinite(lN) || !Number.isFinite(lY) || !Number.isFinite(lT)) {
      result.set(k, '');
      continue;
    }
    const motionNow  = motionFromDelta(lN - lY);
    const motionNext = motionFromDelta(lT - lN);
    // Station: motion crosses zero (opposite signs) while both are tiny
    if (Math.abs(motionNow) < 0.05 && Math.sign(motionNow) !== Math.sign(motionNext)) {
      result.set(k, 's');
    } else if (motionNow < 0) {
      result.set(k, 'rx');
    } else {
      result.set(k, '');
    }
  }
  return result;
};

window.getPlanetLongitudes = getPlanetLongitudes;

// =========================================================
// FIXED STARS (SwissEph fixstar2_ut)
// Returns ecliptic longitudes for named bright fixed stars
// =========================================================
window.getFixedStarLongitudes = function(dateUTC) {
  const norm = (deg) => ((deg % 360) + 360) % 360;
  const result = {};

  // Only compute if SwissEph is available with fixstar support
  if (!window.SWE_READY || !window.SWE || typeof window.SWE.fixstar2_ut !== "function") {
    return result;
  }

  const swe = window.SWE;
  const d = (dateUTC instanceof Date) ? dateUTC : new Date();

  // Build Julian Day
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth() + 1;
  const day = d.getUTCDate() +
    (d.getUTCHours() + (d.getUTCMinutes() + (d.getUTCSeconds() / 60)) / 60) / 24;

  let Y = y, M = m;
  if (M <= 2) { Y -= 1; M += 12; }
  const A = Math.floor(Y / 100);
  const B = 2 - A + Math.floor(A / 4);
  const jd = Math.floor(365.25 * (Y + 4716)) +
    Math.floor(30.6001 * (M + 1)) +
    day + B - 1524.5;

    const flags = 0;  // default: Swiss Ephemeris (uses mounted sefstars.txt for star positions)

  const STARS = [
    { key: "regulus",   name: "Regulus    ", display: "Regulus" },
    { key: "aldebaran", name: "Aldebaran  ", display: "Aldebaran" },
    { key: "antares",   name: "Antares    ", display: "Antares" },
    { key: "fomalhaut", name: "Fomalhaut  ", display: "Fomalhaut" },
    { key: "sirius",    name: "Sirius     ", display: "Sirius" },
    { key: "spica",     name: "Spica      ", display: "Spica" },
    { key: "rigel",     name: "Rigel      ", display: "Rigel" },
    { key: "algol",     name: "Algol      ", display: "Algol" },
    { key: "deneb",     name: "Deneb      ", display: "Deneb" }
  ];

  for (const star of STARS) {
    try {
      const out = swe.fixstar2_ut(star.name, jd, flags);
      if (out && out.returnCode >= 0) {
        const xx = out.xx || (out.data && Array.from(out.data));
        let lon = NaN;
        if (Array.isArray(xx)) {
          lon = Number(xx[0]);
        } else if (xx && typeof xx.length === "number") {
          lon = Number(Array.from(xx)[0]);
        }
        if (Number.isFinite(lon)) {
          result[star.key] = lon;
        }
      } else {
      }
    } catch (e) {
    }
  }

  return result;
};

// =========================================================
// SWISSEPH HOUSE CALCULATIONS
// =========================================================
// Requires: swissEph wrapper (window._swissEph via swe-init.js)
// Houses: Placidus by default, returns 12 cusps + Asc/MC
// =========================================================
window.__houseCache = new Map(); // keyed by "jd_ut,lat,lon,sys"
const __HOUSE_CACHE_MAX = 5000;

window.getHouseCusps = function(dateUTC, lat, lon) {
  // Try SwissEph first if available
  if (window.SWE_READY && window.SWE && typeof window.SWE.houses_ex2 === 'function') {
    const eph = window.SWE;
    const d = (dateUTC instanceof Date) ? dateUTC : new Date();
    const y = d.getUTCFullYear();
    const m = d.getUTCMonth() + 1;
    const day = d.getUTCDate();
    const h = d.getUTCHours() + d.getUTCMinutes() / 60 + d.getUTCSeconds() / 3600;

    let Y = y, M = m;
    if (M <= 2) { Y -= 1; M += 12; }
    const A = Math.floor(Y / 100);
    const B = 2 - A + Math.floor(A / 4);
    const jd_ut = Math.floor(365.25 * (Y + 4716)) + Math.floor(30.6001 * (M + 1)) + (day + B - 1524.5) + h / 24;

    const latVal = lat ?? 0, lonVal = lon ?? 0;
    const sysRaw = window.houseSystem || 'P';
    // SwissEph house system codes: P=Placidus, O=Porphyry, K=Koch, etc.
    const SYS_MAP = {
      'P': 'P', 'placidus': 'P',
      'O': 'O', 'porphyry': 'O',
      'K': 'K', 'koch': 'K',
      'W': 'W', 'whole-sign': 'W'
    };
    const sys = SYS_MAP[sysRaw] || sysRaw;
    const cacheKey = `${jd_ut.toFixed(6)},${latVal.toFixed(4)},${lonVal.toFixed(4)},${sys}`;
    if (window.__houseCache.has(cacheKey)) {
      return window.__houseCache.get(cacheKey);
    }

    let result;
    try {
      result = eph.houses_ex2(jd_ut, 0, latVal, lonVal, sys.charCodeAt(0));
    } catch (e) {
      console.warn('[houses] SWE houses_ex2 threw:', e.message);
      // try the simpler swe_houses (some WASM builds use this)
      try { result = eph.swe_houses(jd_ut, 0, latVal, lonVal, sys.charCodeAt(0)); }
      catch(e2) { result = null; }
    }

    if (result) {
      // Handle multiple return formats from different SWE WASM builds
      let rawCusps, asc, mc;
      if (result.returnCode !== undefined && result.cusps) {
        // Standard format: { returnCode, cusps: Float64Array(13), ascmc: Float64Array(10) }
        if (result.returnCode >= 0) {
          rawCusps = Array.from(result.cusps);
          asc = result.ascmc?.[0] ?? NaN;
          mc  = result.ascmc?.[1] ?? NaN;
        } else {
          console.warn('[houses] SwissEph failed:', result.serr || 'error code ' + result.returnCode);
          result = null;
        }
      } else if (result.cusp) {
        // Alternate format: { cusp: Float64Array(13), asc: number, error: string }
        rawCusps = Array.from(result.cusp);
        asc = result.asc ?? NaN;
        mc  = result.mc ?? NaN;
        if (result.error) { console.warn('[houses] SWE houses error:', result.error); result = null; }
      } else if (result.error) {
        console.warn('[houses] SWE houses error:', result.error);
        result = null;
      }

      if (result) {
        // cusps[0] is unused/junk, cusps[1..12] are real house cusps
        const cusps = rawCusps.slice(1, 13);
        const houses = { cusps, asc, mc, raw: result };
        window.__houseCache.set(cacheKey, houses);
        if (window.__houseCache.size > __HOUSE_CACHE_MAX) window.__houseCache.delete(window.__houseCache.keys().next().value);
        return houses;
      }
    }
  }
  
  // Fallback: Simple equal houses using approximate Asc/MC
  // This is less accurate but works without Swiss Ephemeris
  // Note: astronomy-engine exports as 'Astronomy' global
  if (typeof window.Astronomy !== 'undefined') {
    const d = (dateUTC instanceof Date) ? dateUTC : new Date();
    const latVal = lat ?? 0;
    const lonVal = lon ?? 0;
    
    // Get observer location
    const observer = new window.Astronomy.Observer(latVal, lonVal, 0);
    
    // Calculate Sidereal Time
    const time = window.Astronomy.MakeTime(d);
    const sideralTime = window.Astronomy.SiderealTime(time);
    
    // RAMC (Right Ascension of MC) in degrees
    // SiderealTime returns GAST at Greenwich.
    // RAMC = GAST + east_longitude (west negative, so GAST + (-82.6) = GAST - 82.6)
    let ramc = (sideralTime * 15 + lonVal) % 360;
    if (ramc < 0) ramc += 360;
    
    // Ascendant calculation using standard formula
    // tan(ASC) = cos(RAMC) / (-sin(RAMC) * cos(obliquity) + tan(lat) * sin(obliquity))
    const T = (time.tt - 2451545.0) / 36525; // Julian centuries since J2000
    const obliquity = (23.439291 - 0.0130042 * T) * Math.PI / 180;
    const latRad = latVal * Math.PI / 180;
    const ramcRad = ramc * Math.PI / 180;
    
    const cosRamc = Math.cos(ramcRad);
    const sinRamc = Math.sin(ramcRad);
    const cosObl = Math.cos(obliquity);
    const sinObl = Math.sin(obliquity);
    const tanLat = Math.tan(latRad);
    // MC ecliptic longitude from RAMC (equatorial → ecliptic conversion)
    // atan2 gives the ecliptic longitude at the meridian, but may return
    // the IC (negative declination) instead of the MC — add 180° to flip
    let mcLon = Math.atan2(Math.sin(ramcRad), Math.cos(ramcRad) * cosObl) * 180 / Math.PI;
    mcLon = (mcLon % 360 + 360) % 360;
    
    // Standard Meeus formula for the Ascendant
    // atan2(-cos(RAMC), sin(obl)*tan(lat) + cos(obl)*sin(RAMC))
    const num = -cosRamc;
    const den = sinObl * tanLat + cosObl * sinRamc;
    let ascLon = Math.atan2(num, den) * 180 / Math.PI;
    
    // Adjust to 0-360 range
    ascLon = (ascLon % 360 + 360) % 360;
    
    // Meeus quadrant rule: the raw atan2 formula returns the intersection of the
    // ecliptic with the horizon, but doesn't distinguish east (AC) from west (DC).
    // If sin(RAMC)*sin(obliquity) > 0, the point is on the western horizon (DC).
    // Add 180° to get the Ascendant on the eastern horizon.
    const sinCheck = Math.sin(ramcRad) * sinObl;
    if (sinCheck > 0) {
        ascLon = (ascLon + 180) % 360;
    }
    
    // Generate 12 house cusps (equal house system - 30° each from Asc)
    const cusps = [];
    for (let i = 0; i < 12; i++) {
      cusps.push((ascLon + i * 30) % 360);
    }
    
    const houses = { cusps, asc: ascLon, mc: mcLon };
    return houses;
  }
  
  return null;
};

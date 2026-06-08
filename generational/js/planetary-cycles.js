/* planetary-cycles.js
   Cycle anchor finder for the astrowheel.
   Uses Astronomy Engine geocentric ecliptic longitudes in DEGREES.
   Retrograde stations are refined from apparent longitude speed sign changes.
   Shadow windows: pre-shadow begins when the planet first crosses the future
   direct-station degree; post-shadow ends when it crosses the Rx-station degree.
*/
(function () {
  "use strict";

  const DAY_MS = 86400000;
  const VALID_PLANETS = new Set([
    "mercury", "venus", "mars", "jupiter", "saturn",
    "uranus", "neptune", "pluto"
  ]);

  const PLANET_BODY = {
    mercury: "Mercury",
    venus:   "Venus",
    mars:    "Mars",
    jupiter: "Jupiter",
    saturn:  "Saturn",
    uranus:  "Uranus",
    neptune: "Neptune",
    pluto:   "Pluto"
  };

  const SHADOW_SEARCH_DAYS = {
    mercury: 90,
    venus: 260,
    mars: 420,
    jupiter: 420,
    saturn: 420,
    uranus: 420,
    neptune: 420,
    pluto: 420
  };

  const lonCache = new Map();
  const shadowWindowCache = new Map();
  const MAX_LON_CACHE = 12000;

  function cacheKeyDate(date) {
    const ms = date instanceof Date ? date.getTime() : Number(date);
    // Station/refinement calls revisit near-identical instants; millisecond precision
    // makes cache hits too rare, second precision is still far beyond visual needs.
    return Math.round(ms / 1000);
  }

  function norm360(v) {
    return ((v % 360) + 360) % 360;
  }

  function signedDiff(prev, cur) {
    let d = Number(cur) - Number(prev);
    while (d > 180) d -= 360;
    while (d < -180) d += 360;
    return d;
  }

  function signedFromTarget(lon, target) {
    let d = Number(lon) - Number(target);
    while (d > 180) d -= 360;
    while (d < -180) d += 360;
    return d;
  }

  function positiveDelta(to, from) {
    return norm360(Number(to) - Number(from));
  }

  function signOf(v, eps) {
    if (eps === undefined) eps = 1e-8;
    if (!isFinite(v) || Math.abs(v) <= eps) return 0;
    return v > 0 ? 1 : -1;
  }

  function geoLonDeg(date, bodyKey) {
    try {
      const cacheKey = bodyKey + ":" + cacheKeyDate(date);
      if (lonCache.has(cacheKey)) return lonCache.get(cacheKey);
      if (typeof window.Astronomy === "undefined") return NaN;
      const body = window.Astronomy.Body[PLANET_BODY[bodyKey]];
      const t = window.Astronomy.MakeTime(date);
      const vec = window.Astronomy.GeoVector(body, t, true);
      const ecl = window.Astronomy.Ecliptic(vec);
      // Astronomy Engine's ecliptic longitude is already degrees.
      const out = norm360(ecl.elon);
      if (Number.isFinite(out)) {
        lonCache.set(cacheKey, out);
        if (lonCache.size > MAX_LON_CACHE) lonCache.delete(lonCache.keys().next().value);
      }
      return out;
    } catch (e) {
      return NaN;
    }
  }

  function sunLonDeg(date) {
    try {
      if (typeof window.getPlanetLongitudes === "function") {
        const lons = window.getPlanetLongitudes(date);
        const lon = Number(lons && lons.sun);
        if (Number.isFinite(lon)) return norm360(lon);
      }
      if (typeof window.Astronomy === "undefined") return NaN;
      const t = window.Astronomy.MakeTime(date);
      const vec = window.Astronomy.GeoVector(window.Astronomy.Body.Sun, t, true);
      const ecl = window.Astronomy.Ecliptic(vec);
      return norm360(ecl.elon);
    } catch (e) {
      return NaN;
    }
  }

  function motionAt(planet, timeMs) {
    const half = 0.5 * DAY_MS;
    const before = geoLonDeg(new Date(timeMs - half), planet);
    const after = geoLonDeg(new Date(timeMs + half), planet);
    if (!Number.isFinite(before) || !Number.isFinite(after)) return NaN;
    return signedDiff(before, after);
  }

  function refineMotionZero(planet, loMs, hiMs, signLo) {
    let lo = loMs;
    let hi = hiMs;
    for (let i = 0; i < 24; i++) {
      const mid = (lo + hi) / 2;
      const sm = signOf(motionAt(planet, mid));
      if (sm === 0) return mid;
      if (sm === signLo) lo = mid;
      else hi = mid;
    }
    return (lo + hi) / 2;
  }

  function findStationEvents(planet, startDate, endDate) {
    const events = [];
    const step = DAY_MS;
    let prevT = startDate.getTime();
    let prevSign = signOf(motionAt(planet, prevT));

    for (let t = prevT + step; t <= endDate.getTime(); t += step) {
      const curSign = signOf(motionAt(planet, t));
      if (prevSign !== 0 && curSign !== 0 && prevSign !== curSign) {
        const stationMs = refineMotionZero(planet, prevT, t, prevSign);
        const before = motionAt(planet, stationMs - 2 * DAY_MS);
        const after = motionAt(planet, stationMs + 2 * DAY_MS);
        const type = before > 0 && after < 0 ? "station_retrograde" : "station_direct";
        events.push({
          planet,
          type,
          dateUTC: new Date(stationMs).toISOString(),
          longitude: norm360(geoLonDeg(new Date(stationMs), planet))
        });
      }
      if (curSign !== 0) prevSign = curSign;
      prevT = t;
    }
    return events;
  }

  function refineLongitudeCrossing(planet, targetLon, loMs, hiMs) {
    let lo = loMs;
    let hi = hiMs;
    let fLo = signedFromTarget(geoLonDeg(new Date(lo), planet), targetLon);
    for (let i = 0; i < 24; i++) {
      const mid = (lo + hi) / 2;
      const fMid = signedFromTarget(geoLonDeg(new Date(mid), planet), targetLon);
      if (!Number.isFinite(fMid)) break;
      if (Math.abs(fMid) < 1e-7) return mid;
      if (Math.sign(fMid) === Math.sign(fLo)) {
        lo = mid;
        fLo = fMid;
      } else {
        hi = mid;
      }
    }
    return (lo + hi) / 2;
  }

  function findLongitudeCrossing(planet, targetLon, startMs, endMs, requiredMotionSign, preferLast) {
    const step = 0.5 * DAY_MS;
    let prevT = startMs;
    let prevF = signedFromTarget(geoLonDeg(new Date(prevT), planet), targetLon);
    let found = NaN;
    for (let t = startMs + step; t <= endMs; t += step) {
      const curF = signedFromTarget(geoLonDeg(new Date(t), planet), targetLon);
      if (Number.isFinite(prevF) && Number.isFinite(curF)) {
        const crossed = Math.abs(curF) < 0.05 || (prevF !== 0 && curF !== 0 && Math.sign(prevF) !== Math.sign(curF));
        if (crossed) {
          const ms = refineLongitudeCrossing(planet, targetLon, prevT, t);
          const motion = motionAt(planet, ms);
          if (!requiredMotionSign || Math.sign(motion) === requiredMotionSign || Math.abs(motion) < 0.02) {
            if (!preferLast) return ms;
            found = ms;
          }
        }
      }
      prevT = t;
      prevF = curF;
    }
    return found;
  }

  function findSynodicEvents(planet, startDate, endDate) {
    const events = [];
    const isInner = ["mercury", "venus"].includes(planet);
    const targetDeg = isInner ? 0 : 180;
    const step = DAY_MS;

    let prevT = startDate.getTime();
    let prevPlanetLon = geoLonDeg(new Date(prevT), planet);
    let prevSunLon = sunLonDeg(new Date(prevT));
    let prevDiff = signedDiff(prevPlanetLon, prevSunLon);
    let prevTargetDist = signedDiff(targetDeg, prevDiff);
    let prevSign = signOf(prevTargetDist);

    for (let t = prevT + step; t <= endDate.getTime(); t += step) {
      const curLon = geoLonDeg(new Date(t), planet);
      const curSun = sunLonDeg(new Date(t));
      if (!Number.isFinite(curLon) || !Number.isFinite(curSun)) continue;
      const diff = signedDiff(curLon, curSun);
      const targetDist = signedDiff(targetDeg, diff);
      const curSign = signOf(targetDist);
      if (curSign !== 0 && prevSign !== 0 && curSign !== prevSign) {
        const midDate = new Date(t - step / 2);
        events.push({
          planet,
          type: isInner ? "solar_conjunction" : "solar_opposition",
          dateUTC: midDate.toISOString(),
          longitude: norm360(geoLonDeg(midDate, planet))
        });
      }
      if (curSign !== 0) prevSign = curSign;
      prevT = t;
    }
    return events;
  }

  function buildShadowWindows(planet, startDate, endDate) {
    const pad = SHADOW_SEARCH_DAYS[planet] || 520;
    const stationStart = new Date(startDate.getTime() - pad * DAY_MS);
    const stationEnd = new Date(endDate.getTime() + pad * DAY_MS);
    const stations = findStationEvents(planet, stationStart, stationEnd);
    const windows = [];

    for (let i = 0; i < stations.length - 1; i++) {
      const rx = stations[i];
      const direct = stations[i + 1];
      if (rx.type !== "station_retrograde" || direct.type !== "station_direct") continue;
      const rxMs = new Date(rx.dateUTC).getTime();
      const directMs = new Date(direct.dateUTC).getTime();
      const retroLon = norm360(rx.longitude);
      const directLon = norm360(direct.longitude);
      const sweep = positiveDelta(retroLon, directLon);
      // A real retrograde shadow is the small zodiac segment between station D and station Rx.
      if (!Number.isFinite(sweep) || sweep < 0.1 || sweep > 75) continue;

      const preStartMs = findLongitudeCrossing(planet, directLon, rxMs - pad * DAY_MS, rxMs - 0.25 * DAY_MS, +1, true);
      const postEndMs = findLongitudeCrossing(planet, retroLon, directMs + 0.25 * DAY_MS, directMs + pad * DAY_MS, +1, false);
      if (!Number.isFinite(preStartMs) || !Number.isFinite(postEndMs)) continue;

      const win = {
        planet,
        retroLon,
        directLon,
        sweep,
        preShadowDateUTC: new Date(preStartMs).toISOString(),
        rxDateUTC: rx.dateUTC,
        directDateUTC: direct.dateUTC,
        postShadowDateUTC: new Date(postEndMs).toISOString()
      };
      const overlaps = postEndMs >= startDate.getTime() && preStartMs <= endDate.getTime();
      if (overlaps) windows.push(win);
    }
    windows.sort((a, b) => new Date(a.preShadowDateUTC) - new Date(b.preShadowDateUTC));
    return windows;
  }

  function getCrossedCycleAnchors(options = {}) {
    const planet = (options.planet || "venus").toLowerCase();
    if (!VALID_PLANETS.has(planet)) return [];
    const fromDate = options.fromDateUTC instanceof Date ? options.fromDateUTC : new Date();
    const toDate = options.toDateUTC instanceof Date ? options.toDateUTC : new Date();
    if (fromDate.getTime() > toDate.getTime()) return [];
    let mode = (options.mode || "synodic").toLowerCase();
    if (!["retrograde", "synodic", "both"].includes(mode)) mode = "synodic";
    const events = [];
    if (mode === "retrograde" || mode === "both") events.push(...findStationEvents(planet, fromDate, toDate));
    if (mode === "synodic" || mode === "both") events.push(...findSynodicEvents(planet, fromDate, toDate));
    events.sort((a, b) => new Date(a.dateUTC) - new Date(b.dateUTC));
    return events;
  }

  function getCycleAnchors(options = {}) {
    return getCrossedCycleAnchors(options);
  }

  function getRetrogradeShadowWindows(options = {}) {
    const planet = (options.planet || "venus").toLowerCase();
    if (!VALID_PLANETS.has(planet)) return [];
    const fromDate = options.fromDateUTC instanceof Date ? options.fromDateUTC : new Date();
    const toDate = options.toDateUTC instanceof Date ? options.toDateUTC : new Date(fromDate.getTime() + 365 * DAY_MS);
    if (fromDate.getTime() > toDate.getTime()) return [];
    const key = planet + ":" + Math.floor(fromDate.getTime() / DAY_MS) + ":" + Math.floor(toDate.getTime() / DAY_MS);
    if (shadowWindowCache.has(key)) return shadowWindowCache.get(key).map(w => Object.assign({}, w));
    const windows = buildShadowWindows(planet, fromDate, toDate);
    shadowWindowCache.set(key, windows.map(w => Object.assign({}, w)));
    return windows;
  }

  window.PlanetaryCycles = {
    getCycleAnchors,
    getCrossedCycleAnchors,
    getRetrogradeShadowWindows,
    clearCache() { lonCache.clear(); shadowWindowCache.clear(); },
    planets: Array.from(VALID_PLANETS)
  };
})();

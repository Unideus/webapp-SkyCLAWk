/* planetary-cycles.js
   Lightweight cycle anchor finder for the astrowheel.
   Uses the Astronomy library (VSOP87) for accurate geocentric longitudes
   on a single planet at a time — no full-system Swiss Ephemeris calls.
   Station detection: derivative sign change of geocentric longitude.
   Synodic detection: planet-Sun separation crosses 0° (inner) or 180° (outer).
   No binary search, no WASM, no refineZero — just 3-day steps with sign tracking.
*/
(function () {
  "use strict";

  const DAY_MS = 86400000;
  const VALID_PLANETS = new Set([
    "mercury", "venus", "mars", "jupiter", "saturn",
    "uranus", "neptune", "pluto"
  ]);

  // Map planet name to Astronomy.Body enum constant
  // Use the string references so they resolve in browser at runtime
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

  function norm360(v) {
    return ((v % 360) + 360) % 360;
  }

  function signedDiff(prev, cur) {
    let d = cur - prev;
    while (d > 180) d -= 360;
    while (d < -180) d += 360;
    return d;
  }

  function signOf(v, eps) {
    if (eps === undefined) eps = 1e-6;
    if (!isFinite(v) || Math.abs(v) <= eps) return 0;
    return v > 0 ? 1 : -1;
  }

  // ---------- Single-planet geocentric longitude via Astronomy ----------

  function geoLonDeg(date, bodyKey) {
    try {
      if (typeof window.Astronomy === "undefined") return NaN;
      const body = window.Astronomy.Body[PLANET_BODY[bodyKey]];
      const t = window.Astronomy.MakeTime(date);
      const vec = window.Astronomy.GeoVector(body, t, true);
      const ecl = window.Astronomy.Ecliptic(vec);
      return norm360(ecl.elon * (180 / Math.PI));
    } catch (e) {
      return NaN;
    }
  }

  function sunLonDeg(date) {
    try {
      if (typeof window.Astronomy === "undefined") return NaN;
      const t = window.Astronomy.MakeTime(date);
      const vec = window.Astronomy.GeoVector(window.Astronomy.Body.Sun, t, true);
      const ecl = window.Astronomy.Ecliptic(vec);
      return norm360(ecl.elon * (180 / Math.PI));
    } catch (e) {
      return NaN;
    }
  }

  // ---------- Station detection ----------

  function findStationEvents(planet, startDate, endDate) {
    const events = [];
    const STEP_MS = 3 * DAY_MS;

    let d = new Date(startDate.getTime());
    let prevLon = geoLonDeg(d, planet);
    if (!isFinite(prevLon)) return events;
    d = new Date(d.getTime() + STEP_MS);

    let curLon = geoLonDeg(d, planet);
    if (!isFinite(curLon)) return events;
    let prevMotion = signedDiff(prevLon, curLon);
    let prevSign = signOf(prevMotion);
    prevLon = curLon;

    while (d <= endDate) {
      curLon = geoLonDeg(d, planet);
      if (!isFinite(curLon)) { d = new Date(d.getTime() + STEP_MS); continue; }
      const motion = signedDiff(prevLon, curLon);
      const curSign = signOf(motion);

      if (prevSign !== 0 && curSign !== 0 && prevSign !== curSign) {
        const midDate = new Date(d.getTime() - STEP_MS / 2);
        const midLon = geoLonDeg(midDate, planet);
        const type = prevSign > 0 && curSign < 0 ? "station_retrograde" : "station_direct";

        events.push({
          planet,
          type,
          dateUTC: midDate.toISOString(),
          longitude: norm360(midLon)
        });
      }

      prevLon = curLon;
      if (curSign !== 0) {
        prevMotion = motion;
        prevSign = curSign;
      }
      d = new Date(d.getTime() + STEP_MS);
    }

    return events;
  }

  // ---------- Synodic detection ----------
  // Inner planets (radius < 1 AU): solar conjunction (planet ~= Sun from Earth)
  // Outer planets: solar opposition (planet ~= Sun + 180°)

  function findSynodicEvents(planet, startDate, endDate) {
    const events = [];
    const isInner = ["mercury", "venus"].includes(planet);
    const targetDeg = isInner ? 0 : 180;
    const STEP_MS = 3 * DAY_MS;

    let d = new Date(startDate.getTime() + STEP_MS);
    let prevPlanetLon = geoLonDeg(new Date(startDate.getTime()), planet);
    let prevSunLon = sunLonDeg(new Date(startDate.getTime()));
    let prevDiff = signedDiff(prevSunLon, prevPlanetLon);
    let prevTargetDist = signedDiff(prevDiff - targetDeg, 0);
    let prevSign = signOf(prevTargetDist);
    if (prevSign === 0) prevSign = 1;

    while (d <= endDate) {
      const curLon = geoLonDeg(d, planet);
      const curSun = sunLonDeg(d);
      if (!isFinite(curLon) || !isFinite(curSun)) { d = new Date(d.getTime() + STEP_MS); continue; }
      const diff = signedDiff(curSun, curLon);
      const targetDist = signedDiff(diff - targetDeg, 0);
      const curSign = signOf(targetDist);

      if (curSign !== 0 && prevSign !== 0 && curSign !== prevSign) {
        const midDate = new Date(d.getTime() - STEP_MS / 2);
        const midLon = geoLonDeg(midDate, planet);
        const type = isInner ? "solar_conjunction" : "solar_opposition";

        events.push({
          planet,
          type,
          dateUTC: midDate.toISOString(),
          longitude: norm360(midLon)
        });
        prevSign = curSign;
      } else if (curSign !== 0) {
        prevSign = curSign;
      }

      d = new Date(d.getTime() + STEP_MS);
    }

    return events;
  }

  // ---------- Public API ----------

  function getCrossedCycleAnchors(options = {}) {
    const planet = (options.planet || "venus").toLowerCase();
    if (!VALID_PLANETS.has(planet)) return [];

    const fromDate = options.fromDateUTC instanceof Date ? options.fromDateUTC : new Date();
    const toDate   = options.toDateUTC instanceof Date ? options.toDateUTC : new Date();
    if (fromDate.getTime() > toDate.getTime()) return [];

    let mode = (options.mode || "synodic").toLowerCase();
    if (!["retrograde", "synodic", "both"].includes(mode)) mode = "synodic";

    const events = [];

    if (mode === "retrograde" || mode === "both") {
      events.push(...findStationEvents(planet, fromDate, toDate));
    }
    if (mode === "synodic" || mode === "both") {
      events.push(...findSynodicEvents(planet, fromDate, toDate));
    }

    events.sort((a, b) => new Date(a.dateUTC) - new Date(b.dateUTC));
    return events;
  }

  function getCycleAnchors(options = {}) {
    return getCrossedCycleAnchors(options);
  }

  window.PlanetaryCycles = {
    getCycleAnchors,
    getCrossedCycleAnchors,
    clearCache() {},
    planets: Array.from(VALID_PLANETS)
  };

})();

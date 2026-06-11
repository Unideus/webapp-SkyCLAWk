// js/astro-engine.js
// Auspicious Time Calculator — Core Astrological Engine
// ES Module version — imported by main.js

// ── Constants ──
export const SIGN_NAMES = ["Aries","Taurus","Gemini","Cancer","Leo","Virgo","Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"];
export const PLANET_IDS = { SUN: 0, MOON: 1, MERCURY: 2, VENUS: 3, MARS: 4, JUPITER: 5, SATURN: 6 };
export const PLANET_NAMES = { 0:"Sun", 1:"Moon", 2:"Mercury", 3:"Venus", 4:"Mars", 5:"Jupiter", 6:"Saturn", 7:"Uranus", 8:"Neptune", 9:"Pluto" };
export const PLANET_SYMBOLS = { 0:"\u2609", 1:"\u263d", 2:"\u263f", 3:"\u2640", 4:"\u2642", 5:"\u2643", 6:"\u2644" };
export const PLANETS_7 = [0,1,2,3,4,5,6];

export const DOMICILE = { 0:[4], 1:[3], 2:[2,5], 3:[0,6], 4:[0,7], 5:[8,11], 6:[9,10] };
export const EXALTATION = { 0:0, 1:1, 2:5, 3:11, 4:9, 5:3, 6:6 };
const EXALTATION_DEG = { 0:19, 1:3, 2:15, 3:27, 4:28, 5:15, 6:21 };

const TRIPLICITY_RULERS = { day_fire: 0, night_fire: 5, day_earth: 3, night_earth: 1, day_air: 6, night_air: 2, day_water: 3, night_water: 4 };
const EGYPTIAN_TERMS = [
  [[6,5],[14,3],[21,2],[26,4],[30,6]], [[8,3],[15,2],[22,5],[27,6],[30,4]],
  [[6,2],[14,5],[21,3],[26,4],[30,6]], [[7,4],[13,3],[20,2],[27,5],[30,6]],
  [[6,5],[13,6],[20,2],[25,3],[30,4]], [[7,2],[13,3],[18,5],[24,4],[30,6]],
  [[6,6],[11,2],[19,5],[24,3],[30,4]], [[7,4],[14,3],[22,2],[27,5],[30,6]],
  [[6,5],[12,3],[18,2],[26,6],[30,4]], [[7,4],[14,3],[22,2],[26,5],[30,6]],
  [[7,3],[13,2],[20,5],[25,4],[30,6]], [[6,3],[12,5],[19,4],[26,2],[30,6]],
];
const CHALDEAN = [6,5,4,0,3,2,1];

export const FIXED_STARS = {
  Spica: { lon: 203.8, nature: "benefic", desc: "Fortune, success, honor" },
  Regulus: { lon: 150.0, nature: "mixed", desc: "Leadership, power, pride" },
  Algol: { lon: 66.3, nature: "malefic", desc: "Violence, misfortune, beheading" },
  Sirius: { lon: 104.0, nature: "benefic", desc: "Honor, fame, ambition" },
  Arcturus: { lon: 204.5, nature: "benefic", desc: "Prosperity, protection" },
  Antares: { lon: 250.0, nature: "malefic", desc: "Rivalry, sudden danger" },
  Aldebaran: { lon: 69.8, nature: "mixed", desc: "Royal, potential violence" },
  Fomalhaut: { lon: 328.5, nature: "benefic", desc: "Sacred, mystical, fame" },
  Capella: { lon: 80.5, nature: "benefic", desc: "Honor, wealth, curiosity" },
  Vega: { lon: 285.5, nature: "benefic", desc: "Artistic, hopeful, lucky" },
};

export const MOON_PHASE = {
  NEW: "New", WAXING_CRESCENT: "Waxing Crescent", FIRST_QUARTER: "First Quarter",
  WAXING_GIBBOUS: "Waxing Gibbous", FULL: "Full", WANING_GIBBOUS: "Waning Gibbous",
  LAST_QUARTER: "Last Quarter", WANING_CRESCENT: "Waning Crescent"
};

// ── Helpers ──
const norm = (deg) => ((deg % 360) + 360) % 360;
export function getSignIndex(lon) { return Math.floor(lon / 30) % 12; }
export function getSignDegree(lon) { return lon % 30; }
export function formatPosition(lon) {
  return `${SIGN_NAMES[getSignIndex(lon)]} ${getSignDegree(lon).toFixed(2)}\u00b0`;
}
export { norm };

function jdFromDate(dt) {
  const y = dt.getUTCFullYear();
  const m = dt.getUTCMonth() + 1;
  const day = dt.getUTCDate() + (dt.getUTCHours() + (dt.getUTCMinutes() + dt.getUTCSeconds() / 60) / 60) / 24;
  let Y = y, M = m;
  if (M <= 2) { Y -= 1; M += 12; }
  const A = Math.floor(Y / 100);
  const B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (Y + 4716)) + Math.floor(30.6001 * (M + 1)) + day + B - 1524.5;
}

// ── SWE wrapper ──
let _swe = null;
let _sweConstants = null;

export function initSWE(sweObj, Constants) {
  // Accept either a SwissEph class instance (with swe_calc_ut, swe_julday, swe_houses)
  // or a simple object with calc_ut (flat API from @fusionstrings/swiss-eph)
  _swe = {
    ...(Constants || {}),
    julday: typeof sweObj.julday === 'function' ? sweObj.julday.bind(sweObj) :
            typeof sweObj.swe_julday === 'function' ? sweObj.swe_julday.bind(sweObj) :
            null,
    calc_ut: typeof sweObj.calc_ut === 'function' ? sweObj.calc_ut.bind(sweObj) :
             typeof sweObj.swe_calc_ut === 'function' ? (jd, ipl, iflag) => {
               const out = sweObj.swe_calc_ut(jd, ipl, iflag);
               return out;
             } :
             null,
    houses_ex2: typeof sweObj.houses_ex2 === 'function' ? sweObj.houses_ex2.bind(sweObj) :
                typeof sweObj.swe_houses === 'function' ? sweObj.swe_houses.bind(sweObj) :
                null,
    swe_set_ephe_path: typeof sweObj.swe_set_ephe_path === 'function' ? sweObj.swe_set_ephe_path.bind(sweObj) :
                        typeof sweObj.set_ephe_path === 'function' ? sweObj.set_ephe_path.bind(sweObj) :
                        null,
  };
  _sweConstants = Constants || {};
}

function sweReady() { return _swe !== null && typeof _swe.calc_ut === 'function'; }

function extractLon(out) {
  if (out == null) return NaN;
  let xx = (out && out.xx != null) ? out.xx : (out && out.data != null) ? out.data : out;
  if (Array.isArray(xx) && xx.length && (Array.isArray(xx[0]) || (xx[0] && typeof xx[0].length === "number"))) xx = xx[0];
  if (xx && typeof xx === "object" && typeof xx.length === "number" && !Array.isArray(xx)) xx = Array.from(xx);
  return Array.isArray(xx) ? Number(xx[0]) : Number(xx);
}

function extractSpeed(out) {
  if (out == null) return NaN;
  let xx = (out && out.xx != null) ? out.xx : (out && out.data != null) ? out.data : out;
  if (Array.isArray(xx) && xx.length && (Array.isArray(xx[0]) || (xx[0] && typeof xx[0].length === "number"))) xx = xx[0];
  if (xx && typeof xx === "object" && typeof xx.length === "number" && !Array.isArray(xx)) xx = Array.from(xx);
  return Array.isArray(xx) ? Number(xx[3]) : NaN;
}

function computePlanetLon(jd, pid) {
  if (!sweReady()) {
    const days = jd - 2451545.0;
    const years = days / 365.2425;
    const roughLons = {
      0: norm((270 + days * 0.985647) % 360), 1: norm((90  + days * (360 / 27.321661)) % 360),
      2: norm((60  + days * (360 / 87.969)) % 360), 3: norm((180 + days * (360 / 224.701)) % 360),
      4: norm((23  + years * (360 / 1.88)) % 360), 5: norm((300 + days * (360 / (11.86 * 365.25))) % 360),
      6: norm((300 + days * (360 / (29.45 * 365.25))) % 360),
      7: norm((36  + years * (360 / 84.01)) % 360), 8: norm((348 + years * (360 / 164.8)) % 360),
      9: norm((293 + years * (360 / 248.0)) % 360),
    };
    return { lon: roughLons[pid] || 0, speed: 1 };
  }
  const flagsMosh = 4 | 256;
  const flagsSwiss = 2 | 256;
  let out = _swe.calc_ut(jd, pid, flagsMosh);
  let lon = extractLon(out);
  let speed = extractSpeed(out);
  if (!Number.isFinite(lon)) {
    out = _swe.calc_ut(jd, pid, flagsSwiss);
    lon = extractLon(out);
    speed = extractSpeed(out);
  }
  return { lon: norm(lon), speed: speed || 0 };
}

function sweJulday(dt) {
  if (!sweReady()) return jdFromDate(dt);
  const gregFlag = _sweConstants?.SE_GREG_CAL || 1;
  const hour = dt.getUTCHours() + dt.getUTCMinutes() / 60 + dt.getUTCSeconds() / 3600 + dt.getUTCMilliseconds() / 3600000;
  return _swe.julday(dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate(), hour, gregFlag);
}

function computeAllPlanets(jd) {
  const result = {};
  for (let pid = 0; pid <= 9; pid++) {
    const { lon, speed } = computePlanetLon(jd, pid);
    result[pid] = {
      id: pid, name: PLANET_NAMES[pid] || `Planet${pid}`,
      longitude: lon, speed, sign_index: getSignIndex(lon),
      sign_degree: getSignDegree(lon), is_retrograde: speed < 0,
      house: 0, is_combust: false,
    };
  }
  return result;
}

function computeHouses(jd, lat, lon) {
  let asc = 0, mc = 0;
  if (sweReady() && typeof _swe.houses_ex2 === 'function') {
    try {
      if (typeof _swe.swe_set_ephe_path === 'function') _swe.swe_set_ephe_path('.');
      const result = _swe.houses_ex2(jd, lat, lon, 'P'.charCodeAt(0));
      if (result && result.ascmc) { asc = result.ascmc[0]; mc = result.ascmc[1]; }
    } catch(e) {}
  }
  if (!asc) {
    const hour = ((jd - Math.floor(jd)) * 24);
    asc = norm(hour * 15 - 90);
    mc = norm(asc + 90);
  }
  asc = norm(asc); mc = norm(mc);
  const ascSign = getSignIndex(asc);
  const houses = [];
  for (let i = 0; i < 12; i++) houses.push((ascSign + i) * 30 + 15);
  return { asc, mc, houses, asc_sign: ascSign };
}

function getMoonPhase(jd, planets) {
  const sunLon = planets[0].longitude, moonLon = planets[1].longitude;
  const angle = norm(moonLon - sunLon);
  const waxing = angle < 180;
  const sep = Math.abs((moonLon - sunLon) % 360);
  const minSep = Math.min(sep, 360 - sep);
  const illumination = (1 - Math.cos(minSep * Math.PI / 180)) / 2;

  let phase;
  if (angle < 45) phase = MOON_PHASE.NEW;
  else if (angle < 90) phase = MOON_PHASE.WAXING_CRESCENT;
  else if (angle < 135) phase = MOON_PHASE.FIRST_QUARTER;
  else if (angle < 180) phase = MOON_PHASE.WAXING_GIBBOUS;
  else if (angle < 225) phase = MOON_PHASE.FULL;
  else if (angle < 270) phase = MOON_PHASE.WANING_GIBBOUS;
  else if (angle < 315) phase = MOON_PHASE.LAST_QUARTER;
  else phase = MOON_PHASE.WANING_CRESCENT;

  return { phase, waxing, illumination };
}

function isVoidOfCourse(jd, planets) {
  const moonLon = planets[1].longitude;
  // Classical orbs for Moon applying: 8° for conj/opp/sqr, 6° for trine/sextile
  const ORBS = { 0: 8, 60: 6, 90: 8, 120: 6, 180: 8 };
  const aspectNames = ["conjunction","sextile","square","trine","opposition"];
  for (const pid of [0,2,3,4,5,6]) {
    const plon = planets[pid].longitude;
    for (const aspDeg of [0, 60, 90, 120, 180]) {
      const targetLon = norm(plon + aspDeg);
      const sep = norm(targetLon - moonLon);
      const orb = ORBS[aspDeg];
      if (sep > 0 && sep <= orb) {
        return { voc: false, note: `Moon applying to ${planets[pid].name} by ${aspectNames[aspDeg/60] || 'aspect'} (sep ${sep.toFixed(1)}°)` };
      }
    }
  }
  return { voc: true, note: "Moon is void of course (no applying aspect within classical orb)" };
}

function computeAspects(planets) {
  const aspects = [];
  for (let i = 0; i < PLANETS_7.length; i++) {
    for (let j = i + 1; j < PLANETS_7.length; j++) {
      const p1 = planets[PLANETS_7[i]], p2 = planets[PLANETS_7[j]];
      let sep = Math.abs((p1.longitude - p2.longitude) % 360);
      sep = Math.min(sep, 360 - sep);
      let aspectType = null, aspectDeg = 0;
      if (sep < 8) { aspectType = "conjunction"; aspectDeg = 0; }
      else if (Math.abs(sep - 60) < 6) { aspectType = "sextile"; aspectDeg = 60; }
      else if (Math.abs(sep - 90) < 8) { aspectType = "square"; aspectDeg = 90; }
      else if (Math.abs(sep - 120) < 8) { aspectType = "trine"; aspectDeg = 120; }
      else if (Math.abs(sep - 180) < 8) { aspectType = "opposition"; aspectDeg = 180; }
      if (aspectType) {
        const orb = Math.abs(sep - aspectDeg);
        aspects.push({ planet1: p1.id, planet2: p2.id, name1: p1.name, name2: p2.name, aspect_type: aspectType, orb: +orb.toFixed(2), applying: orb < 2 });
      }
    }
  }
  return aspects;
}

function computeEssentialDignities(planet, isDay) {
  const sign = planet.sign_index, deg = planet.sign_degree, pid = planet.id;
  const result = { domicile: false, exaltation: false, triplicity: false, term: false, face: false, score: 0, peregrine: false, detriment: false, fall: false };
  const domSigns = DOMICILE[pid] || [];
  result.domicile = domSigns.includes(sign);
  result.exaltation = (sign === EXALTATION[pid]);
  const elemMap = ['fire','earth','air','water','fire','earth','air','water','fire','earth','air','water'];
  const elem = elemMap[sign];
  const prefix = isDay ? 'day' : 'night';
  result.triplicity = (pid === TRIPLICITY_RULERS[`${prefix}_${elem}`]);
  const terms = EGYPTIAN_TERMS[sign] || [];
  for (const [endDeg, ruler] of terms) { if (deg <= endDeg) { result.term = (pid === ruler); break; } }
  const decanIdx = Math.floor(deg / 10);
  result.face = (pid === CHALDEAN[(decanIdx * 2 + sign) % 7]);
  if (result.domicile) result.score += 5;
  if (result.exaltation) result.score += 4;
  if (result.triplicity) result.score += 3;
  if (result.term) result.score += 2;
  if (result.face) result.score += 1;
  result.peregrine = result.score === 0;
  for (const ds of domSigns) { if (sign === (ds + 6) % 12) { result.detriment = true; break; } }
  if (EXALTATION[pid] !== undefined) { result.fall = (sign === (EXALTATION[pid] + 6) % 12); }
  return result;
}

function checkFixedStarConjunctions(ascDeg, planets, orb = 2.0) {
  const conjunctions = [];
  for (const [starName, starData] of Object.entries(FIXED_STARS)) {
    const starLon = starData.lon;
    for (const [bodyName, pid] of [["Ascendant", null], ["Moon", 1], ["Sun", 0], ["Venus", 3], ["Jupiter", 5]]) {
      const lon = pid === null ? ascDeg : planets[pid].longitude;
      let sep = Math.abs((lon - starLon) % 360);
      sep = Math.min(sep, 360 - sep);
      if (sep < orb) conjunctions.push({ star: starName, body: bodyName, nature: starData.nature, desc: starData.desc, orb: +sep.toFixed(2) });
    }
  }
  return conjunctions;
}

function computeSunDeclination(jd) {
  // Compute solar ecliptic longitude and declination for a given JD
  const T = (jd - 2451545.0) / 36525;            // Julian centuries from J2000
  const M = norm(357.5291 + 35999.0503 * T);      // Mean anomaly (deg)
  const Mrad = M * Math.PI / 180;
  const C = (1.9146 - 0.0048 * T) * Math.sin(Mrad) + 0.0200 * Math.sin(2 * Mrad);
  const sunLon = norm(280.4665 + 36000.7698 * T + C); // Ecliptic longitude (deg)
  const obliquity = 23.4393 - 0.0130 * T;           // Obliquity (deg)
  const oblR = obliquity * Math.PI / 180;
  const sunLonR = sunLon * Math.PI / 180;
  const dec = Math.asin(Math.sin(oblR) * Math.sin(sunLonR)); // Declination (rad)
  const eot = C - 0.0053 * Math.sin(2 * sunLonR);  // Equation of time (days, ~approx)
  return { dec: dec, eot: eot * 24 / 360 };         // eot in hours
}

function getSunriseSet(jd, lat) {
  // Returns sunrise/sunset as day-fraction for the calendar day of jd
  const phi = lat * Math.PI / 180;
  const { dec, eot } = computeSunDeclination(jd);
  const tanProd = Math.tan(phi) * Math.tan(dec);
  let ha;
  if (tanProd >= 1) {        // Polar night — no sunrise
    ha = Math.PI;            // 12h half-day (still lets planetary hours flow)
  } else if (tanProd <= -1) { // Midnight sun — no sunset
    ha = 0;
  } else {
    ha = Math.acos(-tanProd); // Sunrise hour angle (rad)
  }
  // Half-day length in hours
  const halfDayHours = ha * 12 / Math.PI;
  const noonOffset = eot;    // Equation of time already in hours
  // Sunrise/sunset as hours past midnight UTC
  const sunriseHour = 12 - halfDayHours - noonOffset;
  const sunsetHour = 12 + halfDayHours - noonOffset;
  return {
    sunrise: sunriseHour / 24,
    sunset: sunsetHour / 24,
    dayLength: halfDayHours * 2 / 24
  };
}

function getPlanetaryHour(jd, lat, lon) {
  const chaldeanOrder = [6, 5, 4, 0, 3, 2, 1];
  const chaldeanNames = ["Saturn", "Jupiter", "Mars", "Sun", "Venus", "Mercury", "Moon"];
  const weekdayRulers = [1, 4, 2, 5, 3, 6, 0];
  const dt = new Date((jd - 2451545.0) * 86400000 + Date.UTC(2000, 0, 1));
  const dayOfWeek = dt.getUTCDay();
  const dow = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  // Compute sunrise/sunset from solar position for given latitude
  const { sunrise, sunset, dayLength } = getSunriseSet(jd, lat);
  const sunriseJd = Math.floor(jd) + sunrise;
  const sunsetJd = Math.floor(jd) + sunset;
  const dayLenHours = dayLength * 24;
  const nightLenHours = 24 - dayLenHours;
  const dayHourDur = dayLenHours / 12;
  const nightHourDur = nightLenHours / 12;
  const hoursSinceSunrise = (jd - sunriseJd) * 24;
  let rulerIdx;
  if (hoursSinceSunrise >= 0 && hoursSinceSunrise < dayLenHours) {
    const hourIdx = Math.floor(hoursSinceSunrise / dayHourDur);
    rulerIdx = ((weekdayRulers[dow] || 0) + hourIdx) % 7;
  } else {
    const hoursSinceSunset = hoursSinceSunrise < 0 ? (jd - (sunriseJd - 1)) * 24 : (jd - sunsetJd) * 24;
    const hourIdx = Math.max(0, Math.floor(hoursSinceSunset / nightHourDur));
    rulerIdx = ((weekdayRulers[dow] || 0) + 12 + hourIdx) % 7;
  }
  return { rulerPid: chaldeanOrder[rulerIdx], rulerName: chaldeanNames[rulerIdx] };
}

// ── Main compute ──
export function computeChart(dt, lat, lon) {
  const jd = sweJulday(dt);
  const planets = computeAllPlanets(jd);
  const { asc, mc, houses, asc_sign: ascSign } = computeHouses(jd, lat, lon);

  for (const pid in planets) {
    const p = planets[pid];
    p.house = ((p.sign_index - ascSign + 12) % 12) + 1;
  }

  const { phase, waxing, illumination } = getMoonPhase(jd, planets);
  const sunHouse = ((getSignIndex(planets[0].longitude) - ascSign + 12) % 12) + 1;
  const isDay = sunHouse >= 7 && sunHouse <= 12;
  const { voc, note: vocNote } = isVoidOfCourse(jd, planets);
  const aspects = computeAspects(planets);

  const dignities = {};
  for (const pid of PLANETS_7) dignities[pid] = computeEssentialDignities(planets[pid], isDay);

  for (const pid in planets) {
    const p = planets[pid];
    if (p.id !== 0 && p.sign_index === getSignIndex(planets[0].longitude)) {
      let sep = Math.abs((p.longitude - planets[0].longitude) % 360);
      sep = Math.min(sep, 360 - sep);
      p.is_combust = sep < 8.5;
    }
  }

  const starConjs = checkFixedStarConjunctions(asc, planets);
  const hr = getPlanetaryHour(jd, lat, lon);
  const weekdayRulers = [1, 4, 2, 5, 3, 6, 0];
  const dt2 = new Date((jd - 2451545.0) * 86400000 + Date.UTC(2000, 0, 1));
  const dow = dt2.getUTCDay() === 0 ? 6 : dt2.getUTCDay() - 1;
  const dayRulerPid = weekdayRulers[dow];
  const dayName = PLANET_NAMES[dayRulerPid] || "Unknown";

  return {
    timestamp: dt, latitude: lat, longitude: lon, planets,
    ascendant: asc, asc_sign_index: ascSign, mc, mc_sign_index: getSignIndex(mc),
    houses, moon_phase: phase, moon_waxing: waxing, moon_illumination: illumination,
    is_day_chart: isDay, is_void_of_course: voc, void_of_course_note: vocNote,
    planetary_hour_ruler: hr.rulerPid, planetary_hour_name: hr.rulerName,
    planetary_day_ruler: dayRulerPid, planetary_day_name: dayName,
    aspects, dignities, fixed_star_conjunctions: starConjs,
  };
}

export function formatChart(chart) {
  const pdata = {};
  for (const pid in chart.planets) {
    const p = chart.planets[pid];
    pdata[PLANET_NAMES[parseInt(pid)] || pid] = {
      longitude: +p.longitude.toFixed(3), position: formatPosition(p.longitude),
      sign: SIGN_NAMES[p.sign_index], degree: +p.sign_degree.toFixed(2),
      house: p.house, retrograde: p.is_retrograde, combust: p.is_combust,
      speed: +p.speed.toFixed(4),
    };
  }
  const dignitiesData = {};
  for (const pid of PLANETS_7) {
    const d = chart.dignities[pid] || {};
    dignitiesData[PLANET_NAMES[pid]] = { domicile: d.domicile, exaltation: d.exaltation, triplicity: d.triplicity, term: d.term, face: d.face, score: d.score, peregrine: d.peregrine, detriment: d.detriment, fall: d.fall };
  }
  return {
    timestamp: chart.timestamp.toISOString(),
    ascendant: { longitude: +chart.ascendant.toFixed(3), position: formatPosition(chart.ascendant), sign: SIGN_NAMES[chart.asc_sign_index] },
    midheaven: { longitude: +chart.mc.toFixed(3), position: formatPosition(chart.mc), sign: SIGN_NAMES[chart.mc_sign_index] },
    is_day_chart: chart.is_day_chart, sect: chart.is_day_chart ? "Day" : "Night",
    moon: { phase: chart.moon_phase, waxing: chart.moon_waxing, illumination: +(chart.moon_illumination * 100).toFixed(1), void_of_course: chart.is_void_of_course, void_note: chart.void_of_course_note },
    planets: pdata, dignities: dignitiesData,
    aspects: chart.aspects.map(a => ({ planets: `${a.name1} - ${a.name2}`, aspect: a.aspect_type, orb: a.orb, applying: a.applying })),
    fixed_stars: chart.fixed_star_conjunctions.map(s => ({ star: s.star, body: s.body, nature: s.nature, description: s.desc, orb: s.orb })),
    planetary_hour: chart.planetary_hour_name, planetary_day: chart.planetary_day_name,
    asc_sign_index: chart.asc_sign_index,
  };
}
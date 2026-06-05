// js/rules-engine.js
// Electional Astrology Rules Engine — ES Module
import { PLANETS_7, PLANET_NAMES, SIGN_NAMES, DOMICILE, computeChart, formatChart } from './astro-engine.js';

export const TOPICS = {
  marriage: { label: "Marriage / Partnership", description: "Wedding, commitment ceremony, or formal partnership", key_houses: [7, 1], key_planets: [3, 5, 1], asc_sign_preference: ["fixed"], moon_phase: "waxing" },
  business_launch: { label: "Business / Venture Launch", description: "Starting a company, opening a store, launching a product", key_houses: [10, 2, 1], key_planets: [5, 2, 0], asc_sign_preference: ["fixed", "cardinal"], moon_phase: "waxing" },
  travel: { label: "Travel / Journey", description: "Departure for a trip, voyage, or relocation", key_houses: [9, 3, 1], key_planets: [2, 5, 1], asc_sign_preference: ["mutable"], moon_phase: "any" },
  surgery: { label: "Surgery / Medical Procedure", description: "Elective surgery, medical procedure, or treatment start", key_houses: [6, 8, 1], key_planets: [4, 3, 1], asc_sign_preference: ["mutable"], moon_phase: "waning" },
  property: { label: "Property / Real Estate", description: "Buying a house, signing a lease, moving in", key_houses: [4, 2, 1], key_planets: [6, 3, 1], asc_sign_preference: ["fixed"], moon_phase: "waxing" },
  legal: { label: "Legal / Court Matters", description: "Filing a lawsuit, signing a contract, court appearance", key_houses: [9, 7, 1], key_planets: [5, 2, 0], asc_sign_preference: ["cardinal", "fixed"], moon_phase: "waxing" },
  education: { label: "Education / Learning", description: "Starting a course, exam, learning a new skill", key_houses: [9, 3, 1], key_planets: [2, 5, 1], asc_sign_preference: ["mutable"], moon_phase: "waxing" },
  creative_project: { label: "Creative / Art Project", description: "Launching art, music, writing, or creative work", key_houses: [5, 1], key_planets: [3, 2, 0], asc_sign_preference: ["fixed", "mutable"], moon_phase: "waxing" },
  career_move: { label: "Job / Career Move", description: "Starting a new job, promotion, interview, career change", key_houses: [10, 6, 1], key_planets: [6, 0, 5], asc_sign_preference: ["cardinal", "fixed"], moon_phase: "waxing" },
  ritual: { label: "Ritual / Spiritual Practice", description: "Meditation retreat, ceremony, spiritual initiation", key_houses: [12, 9, 1], key_planets: [1, 5, 3], asc_sign_preference: ["mutable", "water"], moon_phase: "new" },
  planting: { label: "Planting / Gardening", description: "Sowing seeds, planting, agricultural start", key_houses: [2, 1], key_planets: [1, 3, 5], asc_sign_preference: ["water", "earth"], moon_phase: "waxing" },
  investment: { label: "Investment / Financial Decision", description: "Investing, buying stocks, major purchase", key_houses: [2, 8, 11, 1], key_planets: [5, 3, 2], asc_sign_preference: ["fixed"], moon_phase: "waxing" },
  relocation: { label: "Relocation / Moving", description: "Moving to a new city, country, or home", key_houses: [4, 9, 1], key_planets: [1, 5, 2], asc_sign_preference: ["cardinal", "mutable"], moon_phase: "waxing" },
  negotiation: { label: "Negotiation / Contract", description: "Signing a contract, business deal, negotiation", key_houses: [7, 3, 1], key_planets: [2, 3, 5], asc_sign_preference: ["cardinal", "air"], moon_phase: "waxing" },
  health_regimen: { label: "Health / Fitness Regimen", description: "Starting a diet, exercise program, health treatment", key_houses: [6, 1], key_planets: [4, 3, 1], asc_sign_preference: ["cardinal"], moon_phase: "waxing" },
  poker: { label: "Poker", description: "Poker tournament, casino session, betting, speculative venture", key_houses: [5, 8, 2, 1], key_planets: [5, 3, 4, 2], asc_sign_preference: ["fixed", "fire"], moon_phase: "waxing" },
  move_city: { label: "Relocation / Move to New City", description: "Moving to a new city, country, or major relocation", key_houses: [4, 9, 3, 1], key_planets: [1, 5, 2, 3], asc_sign_preference: ["cardinal", "mutable"], moon_phase: "waxing" },
};

const TOPIC_RULERS = {
  marriage: [3, 5], business_launch: [5, 2, 0], travel: [2, 1, 5], surgery: [4, 3],
  property: [6, 3], legal: [5, 2], education: [2, 5], creative_project: [3, 0],
  career_move: [6, 0, 5], ritual: [1, 5], planting: [1, 3], investment: [5, 3],
  relocation: [1, 5], negotiation: [2, 3], health_regimen: [4, 3, 1], poker: [5, 4, 3], move_city: [1, 5, 2],
};

const TOPIC_MOON_SIGNS = {
  marriage: [6], business_launch: [9, 10], travel: [2, 8], planting: [3, 7, 11],
  ritual: [11], creative_project: [4, 5], poker: [4, 8], move_city: [3, 8, 9],
};

const ELEMENT_MAP = [0,1,2,3,0,1,2,3,0,1,2,3];
const ELEMENT_NAMES = ["fire","earth","air","water"];
const QUALITY_NAMES = ["cardinal","fixed","mutable","cardinal","fixed","mutable",
                       "cardinal","fixed","mutable","cardinal","fixed","mutable"];

class ElectionScorer {
  constructor(chart, topic) {
    this.chart = chart;
    this.topic = topic;
    this.config = TOPICS[topic] || TOPICS.business_launch;
    this.scores = {};
    this.maxPossible = 0;
    this.notes = [];
    this.warnings = [];
  }

  pName(pid) { return PLANET_NAMES[pid] || `P${pid}`; }
  sName(sid) { return SIGN_NAMES[sid] || `S${sid}`; }

  scoreAll() {
    this._scoreAscendant(); this._scoreMoon(); this._scoreSect();
    this._scoreKeyPlanets(); this._scoreKeyHouses(); this._scoreMalefics();
    this._scoreFixedStars(); this._scorePlanetaryHour(); this._scoreAspects();
    this._scoreVoidOfCourse(); this._scoreMoonPhase(); this._scoreCombustion();
    return this;
  }

  _scoreVoidOfCourse() {
    const maxPts = 20; this.maxPossible += maxPts;
    if (this.chart.is_void_of_course) {
      this.scores.void_of_course = -maxPts;
      this.warnings.push("Moon is void of course — nothing will come of the matter");
    } else {
      this.scores.void_of_course = 5;
      this.notes.push(`Moon not void of course: ${this.chart.void_of_course_note}`);
    }
  }

  _scoreMoonPhase() {
    const maxPts = 10; this.maxPossible += maxPts;
    const phasePref = this.config.moon_phase || "waxing";
    const mPhase = this.chart.moon_phase, waxing = this.chart.moon_waxing;
    if (phasePref === "waxing") {
      if (waxing && mPhase !== "New") { this.scores.moon_phase = maxPts; this.notes.push(`Moon is waxing (${mPhase}) — favorable for growth`); }
      else if (mPhase === "New") { this.scores.moon_phase = 8; this.notes.push("New Moon — powerful for new beginnings"); }
      else { this.scores.moon_phase = -3; this.warnings.push(`Moon is waning (${mPhase}) — better for endings, not beginnings`); }
    } else if (phasePref === "waning") {
      if (!waxing) { this.scores.moon_phase = maxPts; this.notes.push(`Moon is waning (${mPhase}) — favorable for reduction`); }
      else { this.scores.moon_phase = -3; this.warnings.push("Moon is waxing — better for growth, not reduction"); }
    } else if (phasePref === "new") {
      if (mPhase === "New") { this.scores.moon_phase = maxPts; this.notes.push("New Moon — ideal for spiritual beginnings"); }
      else if (waxing) this.scores.moon_phase = 5;
      else this.scores.moon_phase = 2;
    } else {
      this.scores.moon_phase = 5; this.notes.push(`Moon in ${mPhase}`);
    }
  }

  _scoreAscendant() {
    const maxPts = 25; this.maxPossible += maxPts;
    let score = 0;
    const ascSign = this.chart.asc_sign_index;
    let ascRuler = null;
    for (const [pid, signs] of Object.entries(DOMICILE)) {
      if (signs.includes(ascSign)) { ascRuler = parseInt(pid); break; }
    }
    if (ascRuler === null) ascRuler = 5;
    const dignities = this.chart.dignities[ascRuler] || {};
    const pref = this.config.asc_sign_preference || [];
    const signName = this.sName(ascSign);
    const sigElem = ELEMENT_NAMES[ELEMENT_MAP[ascSign]];
    const sigQual = QUALITY_NAMES[ascSign];
    for (const p of pref) {
      if (p === sigElem || p === sigQual || (p === "water" && sigElem === "water") || (p === "air" && sigElem === "air")) {
        score += 8; this.notes.push(`Ascendant in ${signName} (${sigQual} ${sigElem}) — favorable for this topic`); break;
      }
    }
    if (dignities.score >= 5) { score += 10; this.notes.push(`Ascendant ruler (${this.pName(ascRuler)}) in dignity (score ${dignities.score})`); }
    else if (dignities.score >= 3) score += 5;
    else if (dignities.peregrine) { score -= 5; this.warnings.push(`Ascendant ruler (${this.pName(ascRuler)}) is peregrine`); }
    const rulerData = this.chart.planets[ascRuler];
    if (rulerData) {
      if (rulerData.house === 1) score += 5;
      else if ([10, 7, 4].includes(rulerData.house)) score += 3;
      else if ([6, 12].includes(rulerData.house)) { score -= 3; this.warnings.push("Ascendant ruler in 6th or 12th house"); }
    }
    const ascDeg = this.chart.ascendant % 30;
    if (ascSign === 6 && ascDeg >= 15) { score -= 5; this.warnings.push("Ascendant in Via Combusta (late Libra)"); }
    if (ascSign === 7 && ascDeg < 15) { score -= 5; this.warnings.push("Ascendant in Via Combusta (early Scorpio)"); }
    this.scores.ascendant = Math.max(-20, Math.min(score, maxPts));
  }

  _scoreMoon() {
    const maxPts = 25; this.maxPossible += maxPts;
    const moon = this.chart.planets[1];
    if (!moon) { this.scores.moon = 0; return; }
    const dignities = this.chart.dignities[1] || {};
    let score = 0;
    if (dignities.score >= 5) { score += 10; this.notes.push(`Moon in dignity (score ${dignities.score})`); }
    else if (dignities.score >= 3) score += 5;
    else if (dignities.peregrine) score -= 3;
    if (moon.house === 1) score += 5;
    else if ([10, 7].includes(moon.house)) score += 3;
    else if ([6, 8, 12].includes(moon.house)) score -= 3;
    const goodSigns = TOPIC_MOON_SIGNS[this.topic] || [];
    if (goodSigns.includes(moon.sign_index)) { score += 5; this.notes.push(`Moon in ${this.sName(moon.sign_index)} — favorable for this topic`); }
    if (this.topic === "surgery" && [1, 5, 9].includes(moon.sign_index)) { score -= 5; this.warnings.push(`Moon in earth sign (${this.sName(moon.sign_index)}) — avoid for surgery`); }
    const mDeg = moon.sign_degree;
    if (moon.sign_index === 6 && mDeg >= 15) { score -= 5; this.warnings.push("Moon in Via Combusta (late Libra)"); }
    if (moon.sign_index === 7 && mDeg < 15) { score -= 5; this.warnings.push("Moon in Via Combusta (early Scorpio)"); }
    this.scores.moon = Math.max(-15, Math.min(score, maxPts));
  }

  _scoreSect() {
    const maxPts = 15; this.maxPossible += maxPts;
    const isDay = this.chart.is_day_chart;
    let score = 0;
    const publicTopics = ["business_launch", "legal", "career_move", "negotiation"];
    const privateTopics = ["marriage", "ritual", "creative_project", "planting", "health_regimen"];
    if (publicTopics.includes(this.topic) && isDay) { score += 10; this.notes.push("Day chart — favorable for public/external matters"); }
    else if (privateTopics.includes(this.topic) && !isDay) { score += 10; this.notes.push("Night chart — favorable for private/internal matters"); }
    else score += 3;
    const beneficOfSect = isDay ? 5 : 3;
    const bDignity = this.chart.dignities[beneficOfSect] ? this.chart.dignities[beneficOfSect].score : 0;
    if (bDignity >= 4) { score += 5; this.notes.push(`Benefic of sect (${this.pName(beneficOfSect)}) well dignified`); }
    this.scores.sect = Math.max(-5, Math.min(score, maxPts));
  }

  _scoreKeyPlanets() {
    const maxPts = 20; this.maxPossible += maxPts;
    const keyPlanets = this.config.key_planets || [];
    let score = 0;
    for (const pid of keyPlanets) {
      const dignities = this.chart.dignities[pid] || {};
      const pdata = this.chart.planets[pid]; if (!pdata) continue;
      if (dignities.score >= 5) { score += 6; this.notes.push(`${this.pName(pid)} in good dignity for this topic`); }
      else if (dignities.score >= 3) score += 3;
      if (this.config.key_houses.includes(pdata.house)) { score += 4; this.notes.push(`${this.pName(pid)} in topic house H${pdata.house}`); }
      if (pdata.is_retrograde) { score -= 2; this.warnings.push(`${this.pName(pid)} retrograde — may delay or revisit`); }
    }
    this.scores.key_planets = Math.max(-10, Math.min(score, maxPts));
  }

  _scoreKeyHouses() {
    const maxPts = 15; this.maxPossible += maxPts;
    const keyHouses = this.config.key_houses || [];
    let score = 0;
    for (const h of keyHouses) {
      const planetsInHouse = PLANETS_7.filter(pid => this.chart.planets[pid] && this.chart.planets[pid].house === h);
      for (const pid of planetsInHouse) {
        if ([5, 3].includes(pid)) { score += 3; this.notes.push(`Benefic ${this.pName(pid)} in topic house H${h}`); }
        else if ([4, 6].includes(pid)) { score -= 2; this.warnings.push(`Malefic ${this.pName(pid)} in topic house H${h}`); }
        else score += 1;
      }
      if (planetsInHouse.length === 0) score += 1;
    }
    this.scores.key_houses = Math.max(-10, Math.min(score, maxPts));
  }

  _scoreMalefics() {
    const maxPts = 15; this.maxPossible += maxPts;
    let score = 0;
    for (const mal of [4, 6]) {
      const pdata = this.chart.planets[mal]; if (!pdata) continue;
      if (pdata.house === 1 || pdata.house === 10) { score -= 4; this.warnings.push(`${this.pName(mal)} in angular house H${pdata.house}`); }
      else if (pdata.house === 7 || pdata.house === 4) score -= 2;
      if ([3, 6, 9, 12].includes(pdata.house)) { score += 2; this.notes.push(`${this.pName(mal)} cadent (H${pdata.house}) — well placed`); }
      if (this.config.key_houses.includes(pdata.house)) { score -= 3; this.warnings.push(`${this.pName(mal)} in topic house H${pdata.house}`); }
    }
    this.scores.malefics = Math.max(-15, Math.min(score, maxPts));
  }

  _scoreFixedStars() {
    const maxPts = 10; this.maxPossible += maxPts;
    let score = 0;
    for (const s of this.chart.fixed_star_conjunctions || []) {
      if (s.nature === "benefic") { score += 4; this.notes.push(`Benefic star ${s.star} conjunct ${s.body}`); }
      else if (s.nature === "malefic") { score -= 4; this.warnings.push(`Malefic star ${s.star} conjunct ${s.body}`); }
    }
    this.scores.fixed_stars = Math.max(-10, Math.min(score, maxPts));
  }

  _scorePlanetaryHour() {
    const maxPts = 10; this.maxPossible += maxPts;
    let score = 0;
    const hour = this.chart.planetary_hour_ruler, day = this.chart.planetary_day_ruler;
    const goodRulers = TOPIC_RULERS[this.topic] || [];
    if (goodRulers.includes(hour)) { score += 5; this.notes.push(`Planetary hour of ${this.chart.planetary_hour_name} — favorable`); }
    if (goodRulers.includes(day)) { score += 3; this.notes.push(`Planetary day of ${this.chart.planetary_day_name} — favorable`); }
    if (hour === 6 && !["property", "career_move"].includes(this.topic)) { score -= 3; this.warnings.push("Saturn hour — generally unfavorable for this type of election"); }
    this.scores.planetary_hour = Math.max(-10, Math.min(score, maxPts));
  }

  _scoreAspects() {
    const maxPts = 10; this.maxPossible += maxPts;
    let score = 0;
    const keyPlanets = this.config.key_planets || [];
    for (const a of this.chart.aspects || []) {
      const p1In = keyPlanets.includes(a.planet1) || [5, 3].includes(a.planet1);
      const p2In = keyPlanets.includes(a.planet2) || [5, 3].includes(a.planet2);
      if (a.aspect_type === "trine" || a.aspect_type === "sextile") {
        if (p1In && p2In) { score += 3; this.notes.push(`Harmonious ${a.aspect_type}: ${a.name1} - ${a.name2}`); }
        else if (p1In || p2In) score += 2;
      } else if (a.aspect_type === "square" || a.aspect_type === "opposition") {
        if (p1In || p2In) { score -= 2; this.warnings.push(`Difficult ${a.aspect_type}: ${a.name1} - ${a.name2}`); }
      }
    }
    this.scores.aspects = Math.max(-10, Math.min(score, maxPts));
  }

  _scoreCombustion() {
    const maxPts = 10; this.maxPossible += maxPts;
    let score = 0;
    for (const pid of this.config.key_planets || []) {
      const pdata = this.chart.planets[pid];
      if (pdata && pdata.is_combust) { score -= 4; this.warnings.push(`${this.pName(pid)} is combust (too close to Sun)`); }
    }
    this.scores.combustion = Math.max(-10, Math.min(score, maxPts));
  }

  getResult() {
    const total = Object.values(this.scores).reduce((a, b) => a + b, 0);
    const pct = Math.round(Math.max(0, total / Math.max(1, this.maxPossible)) * 100 * 10) / 10;
    return {
      topic: this.topic, topic_label: this.config.label, topic_description: this.config.description,
      scores: {...this.scores}, total, max_possible: this.maxPossible, percentage: pct,
      notes: [...this.notes], warnings: [...this.warnings], chart: formatChart(this.chart),
    };
  }
}

export function scoreMoment(dt, lat, lon, topic) {
  const chart = computeChart(dt, lat, lon);
  return new ElectionScorer(chart, topic).scoreAll().getResult();
}

export function findBestTime(startDate, endDate, lat, lon, topic, minScore = 0, maxResults = 10) {
  const results = [];
  const current = new Date(startDate);
  const end = new Date(endDate);

  while (current <= end) {
    try {
      const chart = computeChart(current, lat, lon);
      const scorer = new ElectionScorer(chart, topic).scoreAll();
      const total = Object.values(scorer.scores).reduce((a, b) => a + b, 0);
      if (total >= minScore) {
        const result = scorer.getResult();
        result.score_percent = Math.round(Math.max(0, total / Math.max(1, scorer.maxPossible)) * 100 * 10) / 10;
        result.datetime = current.toISOString();
        result.coords = { lat, lon };
        result.sect = chart.is_day_chart ? "Day" : "Night";
        result.asc_sign = SIGN_NAMES[chart.asc_sign_index] || "";
        if (chart.planets[1]) result.moon_sign = SIGN_NAMES[chart.planets[1].sign_index] || "";
        results.push(result);
      }
    } catch(e) {}
    current.setTime(current.getTime() + 2 * 60 * 60 * 1000);
  }

  results.sort((a, b) => b.score_percent - a.score_percent);
  return results.slice(0, maxResults);
}
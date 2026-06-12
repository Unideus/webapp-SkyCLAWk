// js/personal-life.js
// Personal timeline — lifeline, diagonal, life events, profiles
// Only active on ?variant=personal

const PersonalLife = {
  profiles: [],          // [{ name, birthData, lifeEvents }]
  activeProfile: null,   // name of active profile
  birthDateUTC: null,
  PROFILES_KEY: "zy_profiles",
  LIFELINE_Y: 500,
  SPAN_YEARS: 100,
  PROFILE_COLORS: [
    "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7",
    "#DDA0DD", "#98D8C8", "#F7DC6F", "#BB8FCE", "#85C1E9"
  ],
  PERSON_SPACING: 120,  // px between stacked lifelines
  CHILD_SPACING: 100,   // px between parent and child lifeline

  isPersonal() {
    // Split SkyCLAWk app: /personal/ no longer carries ?variant=personal.
    // Keep the query-param path for old links, but treat the standalone route
    // as personal too so Natal profile Save/Load handlers actually persist.
    const params = new URLSearchParams(window.location.search);
    return params.get("variant") === "personal" || window.location.pathname.includes("/personal/");
  },

  fmtDate(dateStr) {
    if (!dateStr) return "";
    const parts = dateStr.split("-");
    if (parts.length !== 3) return dateStr;
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const m = parseInt(parts[1]);
    return parts[2] + " " + (months[m-1] || parts[1]) + " " + parts[0];
  },

  // ───────────── Profile persistence ─────────────
  load() {
    if (!this.isPersonal()) return;
    try {
      const raw = localStorage.getItem(this.PROFILES_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        this.profiles = data.profiles || [];
        this.activeProfile = data.activeProfile || null;
      }
    } catch(e) { console.warn("PersonalLife: load error", e); }
    // Assign colors to profiles that don't have one yet
    let ci = 0;
    this.profiles.forEach(p => {
      if (!p.color) { p.color = this.PROFILE_COLORS[ci % this.PROFILE_COLORS.length]; ci++; }
    });
    // Per the skill's "load() Must NOT Parse birthDateUTC on Init" pitfall:
    // explicitly leave birthDateUTC null so the zy:screwBuilt listener does NOT
    // auto-render the lifeline on hard refresh. The user must open the Natal
    // modal and Load/Save a profile to make the lifeline appear.
    this.birthDateUTC = null;
  },

  save() {
    try {
      localStorage.setItem(this.PROFILES_KEY, JSON.stringify({
        profiles: this.profiles,
        activeProfile: this.activeProfile
      }));
    } catch(e) { console.warn("PersonalLife: save error", e); }
  },

  getProfile(name) {
    if (!name) return null;
    return this.profiles.find(p => p.name === name) || null;
  },

  getActiveProfile() {
    return this.getProfile(this.activeProfile);
  },

  parseBirthDateUTC(birthData) {
    if (!birthData || !birthData.date) { this.birthDateUTC = null; return; }
    const parts = birthData.date.split("-");
    if (parts.length !== 3) { this.birthDateUTC = null; return; }
    const y = parseInt(parts[0]), m = parseInt(parts[1]) - 1, d = parseInt(parts[2]);
    const tParts = (birthData.time || "12:00").split(":");
    const h = parseInt(tParts[0]) || 12, min = parseInt(tParts[1]) || 0;
    this.birthDateUTC = new Date(Date.UTC(y, m, d, h, min));
  },

  // ───────────── Profile CRUD ─────────────
  saveProfile(name, birthData, lifeEvents) {
    if (!name) return;
    const existing = this.getProfile(name);
    if (existing) {
      existing.birthData = birthData;
      existing.lifeEvents = lifeEvents || existing.lifeEvents || [];
    } else {
      // Count existing profiles with colors to pick next
      const usedColors = this.profiles.map(p => p.color).filter(Boolean);
      let color = this.PROFILE_COLORS[usedColors.length % this.PROFILE_COLORS.length];
      this.profiles.push({ name, color, birthData: birthData || null, lifeEvents: lifeEvents || [] });
    }
    this.activeProfile = name;
    if (birthData) this.parseBirthDateUTC(birthData);
    this.save();
    this.renderAll();
    this.populateProfileList();
  },

  deleteProfile(name) {
    this.profiles = this.profiles.filter(p => p.name !== name);
    if (this.activeProfile === name) {
      this.activeProfile = this.profiles.length > 0 ? this.profiles[0].name : null;
      if (this.activeProfile) {
        const p = this.getProfile(this.activeProfile);
        if (p && p.birthData) this.parseBirthDateUTC(p.birthData);
        else this.birthDateUTC = null;
      } else {
        this.birthDateUTC = null;
      }
    }
    this.save();
    this.renderAll();
    this.populateProfileList();
  },

  loadProfile(name) {
    const p = this.getProfile(name);
    if (!p) return;
    this.activeProfile = name;
    if (p.birthData) this.parseBirthDateUTC(p.birthData);
    else this.birthDateUTC = null;
    this.save();
    this.renderAll();
    this.populateProfileList();
    // Populate Natal modal inputs
    if (p.birthData) {
      const nd = document.getElementById("natalDate");
      const nt = document.getElementById("natalTime");
      const nc = document.getElementById("natalCity");
      const nn = document.getElementById("natalName");
      if (nn) nn.value = p.name || "";
      if (nd) nd.value = p.birthData.date || "";
      if (nt) nt.value = p.birthData.time || "12:00";
      if (nc) nc.value = p.birthData.city || "";
      // Also populate astro wheel natal inputs
      const nd2 = document.getElementById("natalDateInput");
      const nt2 = document.getElementById("natalTimeInput");
      const nl2 = document.getElementById("natalLocationInput");
      if (nd2) nd2.value = p.birthData.date || "";
      if (nt2) nt2.value = p.birthData.time || "12:00";
      if (nl2) nl2.value = p.birthData.city || "";
    }
  },

  // ───────────── Birth data from Natal modal ─────────────
  setBirth(name, dateVal, timeVal, cityVal) {
    if (!this.isPersonal()) return;
    let y, m, d;
    const v = (dateVal || "").trim();
    if (!v) return;
    if (v.includes("-")) {
      const parts = v.split("-");
      y = Number(parts[0]); m = Number(parts[1]); d = Number(parts[2]);
    } else {
      const parts = v.replace(/\s+/g, " ").trim().split(" ");
      if (parts.length < 3) return;
      d = Number(parts[0]);
      const monStr = String(parts[1]).toLowerCase();
      y = Number(parts[2]);
      const months = ["jan","feb","mar","apr","may","jun","jul","aug","sep","oct","nov","dec"];
      m = months.indexOf(monStr) + 1;
    }
    if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return;
    const dateStr = y + "-" + String(m).padStart(2,"0") + "-" + String(d).padStart(2,"0");
    const tParts = (timeVal || "12:00").split(":");
    const h = parseInt(tParts[0]) || 12;
    const min = parseInt(tParts[1]) || 0;
    this.birthDateUTC = new Date(Date.UTC(y, m - 1, d, h, min));

    const profileName = (name || "").trim() || "User";
    const p = this.getProfile(profileName);
    if (p) {
      p.birthData = { date: dateStr, time: timeVal || "12:00", city: cityVal || "" };
    } else {
      this.profiles.push({ name: profileName, birthData: { date: dateStr, time: timeVal || "12:00", city: cityVal || "" }, lifeEvents: [] });
    }
    this.activeProfile = profileName;
    this.save();
    this.renderAll();
    this.populateProfileList();

    // Populate astro wheel natal inputs
    const nd = document.getElementById("natalDateInput");
    const nt = document.getElementById("natalTimeInput");
    const nl = document.getElementById("natalLocationInput");
    if (nd) nd.value = dateStr;
    if (nt) nt.value = timeVal || "12:00";
    if (nl) nl.value = cityVal || "";
    this.closeNatalModal();
  },

  clearBirth() {
    if (!this.activeProfile) return;
    const p = this.getProfile(this.activeProfile);
    if (p) {
      p.birthData = null;
      p.lifeEvents = [];
    }
    this.birthDateUTC = null;
    this.save();
    this.renderAll();
    this.populateProfileList();
  },

  // ───────────── Life Events CRUD (scoped to active profile) ─────────────
  addEvent(title, dateVal, isChild, childName, childBirthDate) {
    if (!title) return;
    // Auto-create a default profile if none exists
    if (!this.activeProfile) {
      this.profiles.push({ name: "User", birthData: null, lifeEvents: [], color: this.PROFILE_COLORS[0] });
      this.activeProfile = "User";
      this.save();
    }
    const p = this.getProfile(this.activeProfile);
    if (!p) return;
    let year = 0;
    if (dateVal) { const parts = dateVal.split("-"); year = parseInt(parts[0]) || 0; }
    const event = { id: "ple_" + Date.now(), title, year, date: dateVal };
    if (isChild) {
      event.isChild = true;
      event.childName = (childName || "").trim() || title;
      event.childYear = childBirthDate ? parseInt(childBirthDate.split("-")[0]) : year;
      event.childColor = this.PROFILE_COLORS[(this.profiles.length + 1) % this.PROFILE_COLORS.length];
    }
    p.lifeEvents.push(event);
    this.save();
    this.renderAll();
    this.populateEventList();
    this.showHideElements();
  },

  deleteEvent(id) {
    if (!this.activeProfile) return;
    const p = this.getProfile(this.activeProfile);
    if (!p) return;
    p.lifeEvents = p.lifeEvents.filter(e => e.id !== id);
    this.save();
    this.renderPersonalEvents();
    this.populateEventList();
  },

  // ───────────── Render all ─────────────
  renderAll() {
    // Clear all personal SVG groups
    ['personalLifeline', 'personalDiagonal', 'personalEventsGroup', 'localHistoryEvents',
     'personalBranches', 'childLifelines'].forEach(id => {
      const g = document.getElementById(id);
      if (g) g.innerHTML = '';
    });

    // Collect all persons: profiles with birth data + child events
    const persons = this.collectAllPersons();
    if (persons.length === 0) { this.showHideElements(); return; }

    // Compute Y positions — sort by birth year, stack around active
    persons.sort((a, b) => a.birthYear - b.birthYear);
    const activeIdx = persons.findIndex(p => p.isActive);
    const anchorY = this.LIFELINE_Y;
    
    persons.forEach((p, i) => {
      const diff = i - activeIdx;
      p.y = anchorY + diff * this.PERSON_SPACING;
    });

    // Render lifelines + DLLs for all
    const ns = "http://www.w3.org/2000/svg";
    persons.forEach(p => {
      this.renderLifelineForProfile(p, ns);
      this.renderDiagonalForProfile(p, ns);
    });

    // Render child branch connection lines
    this.renderChildBranches(persons, ns);

    // Render life events + local history for active profile only
    this.renderPersonalEvents();
    this.renderLocalHistoryEvents();
    this.showHideElements();
  },

  collectAllPersons() {
    const persons = [];
    // Add all profiles with birth data
    this.profiles.forEach(p => {
      if (!p.birthData || !p.birthData.date) return;
      const parts = p.birthData.date.split('-');
      const birthYear = parseInt(parts[0]);
      if (!birthYear) return;
      persons.push({
        type: 'profile',
        profile: p,
        name: p.name,
        birthYear: birthYear,
        color: p.color || this.PROFILE_COLORS[0],
        isActive: p.name === this.activeProfile,
        y: this.LIFELINE_Y,
        childEvents: [],
        parentName: null
      });
    });
    // Add child events from all profiles
    this.profiles.forEach(p => {
      if (!p.lifeEvents) return;
      p.lifeEvents.forEach(ev => {
        if (!ev.isChild || !ev.childName || !ev.childYear) return;
        persons.push({
          type: 'child',
          profile: null,
          name: ev.childName,
          birthYear: ev.childYear,
          color: ev.childColor || '#88ccff',
          isActive: false,
          y: 0,
          childEvents: [],
          parentName: p.name,
          parentLifeEvent: ev
        });
      });
    });
    return persons;
  },

  showHideElements() {
    const hasAnyProfile = this.profiles.some(p => p.birthData && p.birthData.date);
    const hasLocalHist = !!this.getActiveProfile() && !!this.getActiveProfile().localHistory && this.getActiveProfile().localHistory.length > 0;
    const hasLifeEv = !!this.getActiveProfile() && !!this.getActiveProfile().lifeEvents && this.getActiveProfile().lifeEvents.length > 0;
    const ll = document.getElementById("personalLifeline");
    const diag = document.getElementById("personalDiagonal");
    const peg = document.getElementById("personalEventsGroup");
    const lhe = document.getElementById("localHistoryEvents");
    const branches = document.getElementById("personalBranches");
    const childLL = document.getElementById("childLifelines");
    if (ll) ll.style.display = hasAnyProfile ? "block" : "none";
    if (diag) diag.style.display = hasAnyProfile ? "block" : "none";
    if (branches) branches.style.display = hasAnyProfile ? "block" : "none";
    if (childLL) childLL.style.display = hasAnyProfile ? "block" : "none";
    if (peg) peg.style.display = (hasAnyProfile || hasLifeEv) ? "block" : "none";
    if (lhe) lhe.style.display = (hasAnyProfile || hasLocalHist) ? "block" : "none";
  },

  // ───────────── Local History Events ─────────────
  renderLocalHistoryEvents() {
    const g = document.getElementById("localHistoryEvents");
    if (!g) return;
    // Clear existing local history elements
    g.querySelectorAll(".lch-event").forEach(el => el.remove());
    const p = this.getActiveProfile();
    if (!p || !p.localHistory || p.localHistory.length === 0) return;

    // Ensure each event has a year from its date
    p.localHistory.forEach(ev => {
      if (!ev.year && ev.date) {
        const parts = ev.date.split("-");
        ev.year = parseInt(parts[0]) || 0;
      }
    });

    const ns = "http://www.w3.org/2000/svg";
    const birthYear = this.birthDateUTC ? this.birthDateUTC.getFullYear() : (new Date().getFullYear() - 30);
    if (!birthYear) return;

    const sorted = [...p.localHistory].sort((a, b) => a.year - b.year);

    // Render each local history event as a colored marker with label above the lifeline
    // Position: above the name label, at LIFELINE_Y - 80 and up
    const y = this.LIFELINE_Y - 80;
    let lane = 0;

    sorted.forEach(ev => {
      if (!ev.year) return;

      const x = typeof yearToScrewX === "function" ? yearToScrewX(ev.year) : 0;
      if (!x) return;

      const laneY = y - lane * 18;
      if (laneY < 0) return;

      // Dot marker
      const dot = document.createElementNS(ns, "circle");
      dot.setAttribute("class", "lch-event");
      dot.setAttribute("cx", String(x));
      dot.setAttribute("cy", String(laneY));
      dot.setAttribute("r", "3");
      dot.setAttribute("fill", "#88bbff");
      dot.setAttribute("opacity", "0.7");
      g.appendChild(dot);

      // Label
      const lbl = document.createElementNS(ns, "text");
      lbl.setAttribute("class", "lch-event");
      lbl.setAttribute("x", String(x + 6));
      lbl.setAttribute("y", String(laneY + 3));
      lbl.setAttribute("fill", "rgba(136,187,255,0.8)");
      lbl.setAttribute("font-size", "9");
      lbl.setAttribute("font-weight", "600");
      lbl.textContent = (ev.date ? ev.date.split("-")[0] : ev.year) + " " + ev.title;
      g.appendChild(lbl);

      lane++;
    });
  },

  // ───────────── Horizontal Lifeline ─────────────
  renderLifelineForProfile(person, ns) {
    const g = document.getElementById("personalLifeline");
    if (!g) return;
    if (person.type !== 'profile' && person.type !== 'child') return;
    const birthYear = person.birthYear;
    const x0 = yearToScrewX(birthYear);
    const x1 = yearToScrewX(birthYear + this.SPAN_YEARS);
    const y = person.y;
    const color = person.color || "rgba(255,255,255,0.4)";

    // Lifeline horizontal
    const line = document.createElementNS(ns, "line");
    line.setAttribute("x1", x0); line.setAttribute("y1", y);
    line.setAttribute("x2", x1); line.setAttribute("y2", y);
    line.setAttribute("stroke", person.isActive ? "rgba(255,255,255,0.5)" : color + "80");
    line.setAttribute("stroke-width", person.isActive ? "3" : "2");
    g.appendChild(line);

    // Age ticks
    for (let age = 0; age <= this.SPAN_YEARS; age++) {
      const yr = birthYear + age;
      const x = yearToScrewX(yr);
      if (x < x0 - 50 || x > x1 + 50) continue;
      const is10 = age % 10 === 0;
      const is5 = age % 5 === 0;
      const tickH = is10 ? 14 : (is5 ? 8 : 4);
      const tick = document.createElementNS(ns, "line");
      tick.setAttribute("x1", x); tick.setAttribute("y1", y - tickH);
      tick.setAttribute("x2", x); tick.setAttribute("y2", y + tickH);
      tick.setAttribute("stroke", is10 ? "rgba(255,255,255,0.4)" : is5 ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.1)");
      tick.setAttribute("stroke-width", is10 ? "1.2" : "0.8");
      g.appendChild(tick);
      if (is10) {
        const lbl = document.createElementNS(ns, "text");
        lbl.setAttribute("x", x); lbl.setAttribute("y", y + 24);
        lbl.setAttribute("text-anchor", "middle");
        lbl.setAttribute("fill", "rgba(255,255,255,0.4)"); lbl.setAttribute("font-size", "8");
        lbl.textContent = yr.toString(); g.appendChild(lbl);
        const ageLbl = document.createElementNS(ns, "text");
        ageLbl.setAttribute("x", x); ageLbl.setAttribute("y", y - 18);
        ageLbl.setAttribute("text-anchor", "middle");
        ageLbl.setAttribute("fill", "rgba(255,255,255,0.25)"); ageLbl.setAttribute("font-size", "7");
        ageLbl.textContent = "age " + age; g.appendChild(ageLbl);
      }
    }

    // Name label — left of lifeline
    if (person.type === 'child') {
      // Children: name at birth year with a small icon
      const nameLbl = document.createElementNS(ns, "text");
      nameLbl.setAttribute("x", x0); nameLbl.setAttribute("y", y - 20);
      nameLbl.setAttribute("text-anchor", "start");
      nameLbl.setAttribute("fill", color);
      nameLbl.setAttribute("font-size", "10"); nameLbl.setAttribute("font-weight", "700");
      nameLbl.textContent = "♦ " + (person.name || "").trim();
      g.appendChild(nameLbl);

      // Birth year label
      const birthLbl = document.createElementNS(ns, "text");
      birthLbl.setAttribute("x", x0); birthLbl.setAttribute("y", y - 8);
      birthLbl.setAttribute("text-anchor", "start");
      birthLbl.setAttribute("fill", color + "99");
      birthLbl.setAttribute("font-size", "8");
      birthLbl.textContent = "b. " + birthYear;
      g.appendChild(birthLbl);
    } else {
      const nameLbl = document.createElementNS(ns, "text");
      nameLbl.setAttribute("x", x0); nameLbl.setAttribute("y", y - 40);
      nameLbl.setAttribute("text-anchor", "start");
      nameLbl.setAttribute("fill", person.isActive ? "rgba(255,255,255,0.8)" : color);
      nameLbl.setAttribute("font-size", "11"); nameLbl.setAttribute("font-weight", "700");
      nameLbl.textContent = (person.isActive ? "✦ " : "◆ ") + (person.name || "").trim();
      g.appendChild(nameLbl);

      const birthLbl = document.createElementNS(ns, "text");
      birthLbl.setAttribute("x", x0); birthLbl.setAttribute("y", y - 26);
      birthLbl.setAttribute("text-anchor", "start");
      birthLbl.setAttribute("fill", color + "99");
      birthLbl.setAttribute("font-size", "9"); birthLbl.setAttribute("font-weight", "600");
      birthLbl.textContent = "b. " + birthYear;
      g.appendChild(birthLbl);
    }

    // For active profile only: lunar preface + divider lines
    if (person.isActive && person.type === 'profile' && person.profile && person.profile.birthData) {
      this.renderLunarPreface(g, ns, x0, y);
      const divTop = document.createElementNS(ns, "line");
      divTop.setAttribute("x1", x0); divTop.setAttribute("y1", y - 40);
      divTop.setAttribute("x2", x1); divTop.setAttribute("y2", y - 40);
      divTop.setAttribute("stroke", "rgba(255,255,255,0.08)");
      divTop.setAttribute("stroke-width", "1"); divTop.setAttribute("stroke-dasharray", "4,4");
      g.appendChild(divTop);
      const divBot = document.createElementNS(ns, "line");
      divBot.setAttribute("x1", x0); divBot.setAttribute("y1", y + 40);
      divBot.setAttribute("x2", x1); divBot.setAttribute("y2", y + 40);
      divBot.setAttribute("stroke", "rgba(255,255,255,0.08)");
      divBot.setAttribute("stroke-width", "1"); divBot.setAttribute("stroke-dasharray", "4,4");
      g.appendChild(divBot);
    }
  },

  renderLifeline() {
    // Legacy wrapper — calls multi-profile render
    const p = this.getActiveProfile();
    if (!p || !p.birthData || !this.birthDateUTC) return;
    this.renderAll();
  },

  // ───────────── Previous Lunation Cycle Graphic ─────────────
  renderLunarPreface(g, ns, x0, y) {
    if (!this.birthDateUTC || typeof Astronomy === "undefined") return;
    const MS_PER_DAY = 86400000;
    const moonQuarterName = ["New Moon", "First Qtr", "Full Moon", "Third Qtr"];
    const moonQuarterIcon = ["○", "☽", "●", "☾"];

    try {
      const searchStart = new Date(this.birthDateUTC.getTime() - 35 * MS_PER_DAY);
      let mq = Astronomy.SearchMoonQuarter(searchStart);
      const quarters = [];

      while (mq && mq.time.date.getTime() < this.birthDateUTC.getTime()) {
        quarters.push({ quarter: mq.quarter, date: new Date(mq.time.date) });
        mq = Astronomy.NextMoonQuarter(mq);
      }

      if (quarters.length === 0) return;

      const panelX = x0 - 240;
      const rowH = 50;
      const panelY = y - 36;
      const panelW = 220;

      // Panel background
      const bg = document.createElementNS(ns, "rect");
      bg.setAttribute("x", String(panelX));
      bg.setAttribute("y", String(panelY));
      bg.setAttribute("width", String(panelW));
      bg.setAttribute("height", String(quarters.length * rowH + 38));
      bg.setAttribute("fill", "rgba(13,13,20,0.75)");
      bg.setAttribute("rx", "10");
      bg.setAttribute("stroke", "rgba(255,255,255,0.1)");
      bg.setAttribute("stroke-width", "1");
      g.appendChild(bg);

      // Title
      const title = document.createElementNS(ns, "text");
      title.setAttribute("x", String(panelX + 16));
      title.setAttribute("y", String(panelY + 18));
      title.setAttribute("fill", "rgba(255,255,255,0.55)");
      title.setAttribute("font-size", "14");
      title.setAttribute("font-weight", "700");
      title.setAttribute("letter-spacing", "2");
      title.textContent = "PRIOR LUNATION";
      g.appendChild(title);

      // Subtle separator line under title
      const sep = document.createElementNS(ns, "line");
      sep.setAttribute("x1", String(panelX + 16));
      sep.setAttribute("x2", String(panelX + panelW - 16));
      sep.setAttribute("y1", String(panelY + 24));
      sep.setAttribute("y2", String(panelY + 24));
      sep.setAttribute("stroke", "rgba(255,255,255,0.08)");
      sep.setAttribute("stroke-width", "1");
      g.appendChild(sep);

      quarters.forEach((q, i) => {
        const rowY = panelY + 32 + i * rowH;

        // Glyph
        const gly = document.createElementNS(ns, "text");
        gly.setAttribute("x", String(panelX + 12));
        gly.setAttribute("y", String(rowY + 26));
        gly.setAttribute("text-anchor", "start");
        gly.setAttribute("fill", "rgba(255,255,255,0.9)");
        gly.setAttribute("font-size", "24");
        gly.textContent = moonQuarterIcon[q.quarter] || "●";
        g.appendChild(gly);

        // Phase name
        const qlbl = document.createElementNS(ns, "text");
        qlbl.setAttribute("x", String(panelX + 44));
        qlbl.setAttribute("y", String(rowY + 22));
        qlbl.setAttribute("text-anchor", "start");
        qlbl.setAttribute("fill", "rgba(255,255,255,0.75)");
        qlbl.setAttribute("font-size", "16");
        qlbl.setAttribute("font-weight", "700");
        qlbl.textContent = moonQuarterName[q.quarter] || "—";
        g.appendChild(qlbl);

        // Date
        const d = q.date;
        const dateStr = d.getUTCDate() + " " +
          ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][d.getUTCMonth()] + " " +
          d.getUTCFullYear();
        const dt = document.createElementNS(ns, "text");
        dt.setAttribute("x", String(panelX + 44));
        dt.setAttribute("y", String(rowY + 38));
        dt.setAttribute("text-anchor", "start");
        dt.setAttribute("fill", "rgba(255,200,100,0.7)");
        dt.setAttribute("font-size", "14");
        dt.setAttribute("font-weight", "600");
        dt.textContent = dateStr;
        g.appendChild(dt);
      });
    } catch(e) {
      console.warn("Lunar preface render error:", e);
    }
  },

  // ───────────── Diagonal ─────────────
  // Final design (Sessions 5-8 + termination fix, June 2026):
  //   - Band-slope math: matches screw bands exactly (SCREW_HEIGHT/4majors = 8.53°)
  //   - Line follows the age marker past the screw top; above y=0 it feathers toward the viewport top
  //   - Shadow color = previous lane cyclically, based on BIRTH YEAR phase
  //   - Horizontal fade-out mask anchored to viewport (not xBirth) so the line disappears behind labels
  //   - Direct appendChild to #personalDiagonal (no wrapper group, no clip-path)
  renderDiagonalForProfile(person, ns) {
    const g = document.getElementById("personalDiagonal");
    if (!g) return;

    const birthYear = person.birthYear;
    const now = new Date();
    const currentAge = now.getFullYear() - birthYear;
    if (currentAge < 0) return;

    const screwH = (typeof CANON !== "undefined") ? CANON.SCREW_HEIGHT : 180;
    const ppj = (typeof CANON !== "undefined") ? CANON.PX_PER_MAJOR : 300;
    const timelineY = (typeof CANON !== "undefined") ? CANON.TIMELINE_Y : 180;
    const bandSlope = screwH / (4 * ppj);

    const xBirth = yearToScrewX(birthYear);
    const yBirth = timelineY;
    const xNowForLine = (typeof dateToScrewX === "function")
      ? dateToScrewX(now)
      : yearToScrewX(now.getFullYear());
    const fracNowForLine = Math.max(0, (xNowForLine - xBirth) / (4 * ppj));
    const xEnd = xBirth + fracNowForLine * 4 * ppj;
    const yEnd = yBirth - fracNowForLine * screwH;
    const topFrac = yBirth / screwH;
    const xScrewTop = xBirth + topFrac * 4 * ppj;
    const yScrewTop = 0;
    const extendsPastScrewTop = yEnd < yScrewTop;

    // Color from generation phase OR profile color for non-active
    const color = person.color || "rgba(255,255,255,0.8)";
    const genPhase = (typeof findArchetypePhase !== "undefined") ? findArchetypePhase(birthYear) : "nomad";
    const genColors = { prophet: "#cc4444", nomad: "#33bb33", hero: "#ccaa33", artist: "#4477cc" };
    const genColor = genColors[genPhase] || color;
    const phaseList = ["prophet", "nomad", "hero", "artist"];
    const pi = phaseList.indexOf(genPhase);
    const prevPhase = phaseList[(pi + 3) % 4];
    const glowColor = person.isActive ? (genColors[prevPhase] || "#00c800") : (color + "66");

    const svg = document.getElementById("screwSVG");
    if (svg && person.isActive) {
      let defs = svg.querySelector("defs");
      if (!defs) { defs = document.createElementNS(ns, "defs"); svg.appendChild(defs); }

      if (!defs.querySelector("#dllBlur")) {
        const filt = document.createElementNS(ns, "filter");
        filt.setAttribute("id", "dllBlur");
        filt.setAttribute("x", "-50%"); filt.setAttribute("y", "-50%");
        filt.setAttribute("width", "200%"); filt.setAttribute("height", "200%");
        filt.innerHTML = '<feGaussianBlur stdDeviation="6"/>';
        defs.appendChild(filt);
      }

      let mask = defs.querySelector("#dllFade");
      if (!mask) {
        mask = document.createElementNS(ns, "mask");
        mask.setAttribute("id", "dllFade");
        const mr = document.createElementNS(ns, "rect");
        mr.setAttribute("x", "-50000");
        mr.setAttribute("y", "-10000");
        mr.setAttribute("width", "100000");
        mr.setAttribute("height", "20000");
        mask.appendChild(mr);
        defs.appendChild(mask);
      }
      const oldGrad = defs.querySelector("#dllFadeGrad");
      if (oldGrad) oldGrad.remove();
      const labelLeft = (typeof getNowScreenX === "function") ? getNowScreenX() : 1360;
      const fadeLeft = labelLeft - 15;
      const fadeRight = labelLeft + 15;
      const mg = document.createElementNS(ns, "linearGradient");
      mg.setAttribute("id", "dllFadeGrad");
      mg.setAttribute("gradientUnits", "userSpaceOnUse");
      mg.setAttribute("x1", String(fadeLeft));
      mg.setAttribute("x2", String(fadeRight));
      mg.setAttribute("y1", "0");
      mg.setAttribute("y2", "0");
      const ms1 = document.createElementNS(ns, "stop");
      ms1.setAttribute("offset", "0");
      ms1.setAttribute("stop-color", "white");
      const ms2 = document.createElementNS(ns, "stop");
      ms2.setAttribute("offset", "1");
      ms2.setAttribute("stop-color", "black");
      mg.appendChild(ms1); mg.appendChild(ms2);
      defs.appendChild(mg);
      const maskRect = mask.querySelector("rect");
      if (maskRect) maskRect.setAttribute("fill", "url(#dllFadeGrad)");

      for (const old of [defs.querySelector("#dllTopFadeLine"), defs.querySelector("#dllTopFadeGlow")]) {
        if (old) old.remove();
      }
      function makeTopFadeGradient(id, clr, startOpacity, endOpacity) {
        const grad = document.createElementNS(ns, "linearGradient");
        grad.setAttribute("id", id);
        grad.setAttribute("gradientUnits", "userSpaceOnUse");
        grad.setAttribute("x1", "0"); grad.setAttribute("x2", "0");
        grad.setAttribute("y1", String(yScrewTop));
        grad.setAttribute("y2", String(-Math.max(timelineY, 1)));
        const s0 = document.createElementNS(ns, "stop");
        s0.setAttribute("offset", "0");
        s0.setAttribute("stop-color", clr);
        s0.setAttribute("stop-opacity", String(startOpacity));
        const s1 = document.createElementNS(ns, "stop");
        s1.setAttribute("offset", "1");
        s1.setAttribute("stop-color", clr);
        s1.setAttribute("stop-opacity", String(endOpacity));
        grad.appendChild(s0); grad.appendChild(s1);
        defs.appendChild(grad);
      }
      makeTopFadeGradient("dllTopFadeLine", "#ffffff", 0.8, 0.035);
      makeTopFadeGradient("dllTopFadeGlow", glowColor, 0.30, 0.015);
    }

    function appendDllSegment(x1, y1, x2, y2, stroke, strokeWidth, opacity, filter) {
      const seg = document.createElementNS(ns, "line");
      seg.setAttribute("x1", x1); seg.setAttribute("y1", y1);
      seg.setAttribute("x2", x2); seg.setAttribute("y2", y2);
      seg.setAttribute("stroke", stroke);
      seg.setAttribute("stroke-width", strokeWidth);
      if (opacity != null) seg.setAttribute("opacity", opacity);
      if (filter) seg.setAttribute("filter", filter);
      g.appendChild(seg);
      return seg;
    }

    const baseEndX = extendsPastScrewTop ? xScrewTop : xEnd;
    const baseEndY = extendsPastScrewTop ? yScrewTop : yEnd;
    appendDllSegment(xBirth, yBirth, baseEndX, baseEndY, glowColor, "10", "0.25", "url(#dllBlur)");
    if (extendsPastScrewTop) {
      appendDllSegment(xScrewTop, yScrewTop, xEnd, yEnd, "url(#dllTopFadeGlow)", "10", null, "url(#dllBlur)");
    }

    const lineColor = person.isActive ? "rgba(255,255,255,0.8)" : color;
    appendDllSegment(xBirth, yBirth, baseEndX, baseEndY, lineColor, "2.5");
    if (extendsPastScrewTop) {
      appendDllSegment(xScrewTop, yScrewTop, xEnd, yEnd, "url(#dllTopFadeLine)", "2.5");
    }

    if (person.isActive) {
      g.setAttribute("mask", "url(#dllFade)");
    }

    // Now marker
    const xNow = xEnd;
    const yNow = yEnd;
    const nowDot = document.createElementNS(ns, "circle");
    nowDot.setAttribute("cx", xNow); nowDot.setAttribute("cy", yNow);
    nowDot.setAttribute("r", "3");
    nowDot.setAttribute("fill", "#ffffff");
    nowDot.setAttribute("stroke", color);
    nowDot.setAttribute("stroke-width", "2");
    g.appendChild(nowDot);

    const nowLbl = document.createElementNS(ns, "text");
    nowLbl.setAttribute("x", xNow); nowLbl.setAttribute("y", yNow - 8);
    nowLbl.setAttribute("text-anchor", "middle");
    nowLbl.setAttribute("fill", color);
    nowLbl.setAttribute("font-size", "14");
    nowLbl.setAttribute("font-weight", "700");
    nowLbl.textContent = currentAge.toString();
    g.appendChild(nowLbl);
  },

  renderDiagonal() {
    // Legacy wrapper
    const p = this.getActiveProfile();
    if (!p || !p.birthData || !this.birthDateUTC) return;
    this.renderAll();
  },

  renderChildBranches(persons, ns) {
    const g = document.getElementById("personalBranches");
    if (!g) return;
    // Filter child persons and find their parent's Y
    const children = persons.filter(p => p.type === 'child');
    children.forEach(child => {
      const parent = persons.find(p => p.name === child.parentName && p.type === 'profile');
      if (!parent) return;

      const childYear = child.birthYear;
      const parentX = yearToScrewX(childYear);
      if (!parentX) return;
      const parentY = parent.y;
      const childY = child.y;

      // Branch connection: vertical line from parent lifeline down to child lifeline
      // at the child's birth year
      const branch = document.createElementNS(ns, "line");
      branch.setAttribute("x1", parentX); branch.setAttribute("y1", parentY);
      branch.setAttribute("x2", parentX); branch.setAttribute("y2", childY);
      branch.setAttribute("stroke", child.color + "99");
      branch.setAttribute("stroke-width", "1.5");
      branch.setAttribute("stroke-dasharray", "4,3");
      branch.setAttribute("opacity", "0.6");
      g.appendChild(branch);

      // Small dot at connection point on parent lifeline
      const dot = document.createElementNS(ns, "circle");
      dot.setAttribute("cx", parentX); dot.setAttribute("cy", parentY);
      dot.setAttribute("r", "3");
      dot.setAttribute("fill", child.color);
      dot.setAttribute("opacity", "0.8");
      g.appendChild(dot);
    });
  },

  refreshDiagonalMasks() {
    // Minimal mask refresh — rebuilds only the fade mask gradient
    // called on every scroll frame so mask stays anchored to viewport
    const svg = document.getElementById("screwSVG");
    if (!svg) return;
    let defs = svg.querySelector("defs");
    if (!defs) return;
    const mask = defs.querySelector("#dllFade");
    if (!mask) return;
    const oldGrad = defs.querySelector("#dllFadeGrad");
    if (oldGrad) oldGrad.remove();
    const ns = "http://www.w3.org/2000/svg";
    const labelLeft = (typeof getNowScreenX === "function") ? getNowScreenX() : 1360;
    const fadeLeft = labelLeft - 15;
    const fadeRight = labelLeft + 15;
    const mg = document.createElementNS(ns, "linearGradient");
    mg.setAttribute("id", "dllFadeGrad");
    mg.setAttribute("gradientUnits", "userSpaceOnUse");
    mg.setAttribute("x1", String(fadeLeft));
    mg.setAttribute("x2", String(fadeRight));
    mg.setAttribute("y1", "0");
    mg.setAttribute("y2", "0");
    const ms1 = document.createElementNS(ns, "stop");
    ms1.setAttribute("offset", "0");
    ms1.setAttribute("stop-color", "white");
    const ms2 = document.createElementNS(ns, "stop");
    ms2.setAttribute("offset", "1");
    ms2.setAttribute("stop-color", "black");
    mg.appendChild(ms1); mg.appendChild(ms2);
    defs.appendChild(mg);
    const maskRect = mask.querySelector("rect");
    if (maskRect) maskRect.setAttribute("fill", "url(#dllFadeGrad)");
  },

  // ───────────── Personal Events ─────────────
  renderPersonalEvents() {
    const g = document.getElementById("personalEventsGroup");
    if (!g) return;
    const p = this.getActiveProfile();
    if (!p) return;
    g.innerHTML = "";
    const hasLife = p.lifeEvents && p.lifeEvents.length > 0;
    if (!hasLife) return;

    const ns = "http://www.w3.org/2000/svg";
    const y = this.LIFELINE_Y + 50;
    // Only render life events — local history renders separately above lifeline
    const allEvents = [
      ...(p.lifeEvents || []).map(e => ({ ...e, _source: "life" }))
    ];
    if (allEvents.length === 0) return;
    const sorted = allEvents.sort((a, b) => a.year - b.year);
    const MAX_Y = Math.min(y + 600, 1400);
    const availH = MAX_Y - y;
    const CHAR_W = 8.5, PAD = 12;
    function textW(t) { return ((t || "").length * CHAR_W) + PAD * 2; }

    // Calculate lane assignments and count
    function addToPool(pool, x0, x1) {
      for (let li = 0; li < pool.length; li++) {
        let free = true;
        for (const r of pool[li]) { if (x0 < r.x1 && x1 > r.x0) { free = false; break; } }
        if (free) { pool[li].push({ x0, x1 }); return li; }
      }
      pool.push([{ x0, x1 }]);
      return pool.length - 1;
    }
    const laneMap = {};
    const pool = [];
    sorted.forEach((ev, i) => {
      const x = yearToScrewX(ev.year);
      if (!x) return;
      const fullLabel = (ev.date ? this.fmtDate(ev.date) : ev.year) + " " + ev.title;
      const lw = textW(fullLabel) + 20;
      laneMap[i] = addToPool(pool, x - 1, x + lw);
    });
    const spacing = Math.max(18, Math.min(36, Math.floor(availH / Math.max(pool.length, 1))));

    // Render with computed lanes
    sorted.forEach((ev, i) => {
      const x = yearToScrewX(ev.year);
      if (!x) return;
      const lane = laneMap[i] || 0;
      const barY = y + lane * spacing;
      if (barY > MAX_Y) return;

      const rect = document.createElementNS(ns, "rect");
      rect.setAttribute("x", x - 1); rect.setAttribute("y", barY);
      rect.setAttribute("width", "3"); rect.setAttribute("height", "12");
      rect.setAttribute("fill", "rgba(255,200,100,0.7)"); rect.setAttribute("rx", "1");
      g.appendChild(rect);

      const l = document.createElementNS(ns, "text");
      l.setAttribute("x", x + 5); l.setAttribute("y", barY + 9);
      l.setAttribute("fill", "rgba(255,255,255,.85)");
      l.setAttribute("font-size", "10"); l.setAttribute("font-weight", "600");
      l.textContent = (ev.date ? this.fmtDate(ev.date) : ev.year) + " " + ev.title;
      g.appendChild(l);
    });
  },

  // ───────────── Modals ─────────────
  openNatalModal() {
    const modal = document.getElementById("natalModal");
    if (modal) {
      modal.style.display = "block";
      this.populateProfileList();
      // Pre-fill with active profile
      const p = this.getActiveProfile();
      if (p && p.birthData) {
        const nn = document.getElementById("natalName");
        const nd = document.getElementById("natalDate");
        const nt = document.getElementById("natalTime");
        const nc = document.getElementById("natalCity");
        if (nn) nn.value = p.name || "";
        if (nd) nd.value = p.birthData.date || "";
        if (nt) nt.value = p.birthData.time || "12:00";
        if (nc) nc.value = p.birthData.city || "";
      }
    }
  },

  closeNatalModal() {
    const modal = document.getElementById("natalModal");
    if (modal) modal.style.display = "none";
  },

  populateProfileList() {
    const list = document.getElementById("profileList");
    if (!list) return;
    list.innerHTML = "";
    this.profiles.forEach(p => {
      const opt = document.createElement("option");
      opt.value = p.name;
      opt.textContent = p.name + (p.birthData ? " (" + (p.birthData.date || "no date") + ")" : " (no birth data)");
      if (p.name === this.activeProfile) opt.selected = true;
      list.appendChild(opt);
    });
  },

  openEventModal() {
    const modal = document.getElementById("lifeEventModal");
    if (modal) { modal.style.display = "block"; this.populateEventList(); }
  },

  closeEventModal() {
    const modal = document.getElementById("lifeEventModal");
    if (modal) modal.style.display = "none";
  },

  // ───────────── Local History ─────────────
  openLocalHistoryModal() {
    const modal = document.getElementById("localHistoryModal");
    if (modal) { modal.style.display = "block"; this.populateLocalHistoryList(); }
  },

  closeLocalHistoryModal() {
    const modal = document.getElementById("localHistoryModal");
    if (modal) modal.style.display = "none";
  },

  addLocalHistory() {
    const title = document.getElementById("localHistoryTitle");
    const dateInput = document.getElementById("localHistoryDate");
    if (!title || !title.value) return;
    // Auto-create a default profile if none exists
    if (!this.activeProfile) {
      this.profiles.push({ name: "User", birthData: null, lifeEvents: [] });
      this.activeProfile = "User";
      this.save();
    }
    const p = this.getProfile(this.activeProfile);
    if (!p) return;
    if (!p.localHistory) p.localHistory = [];
    const year = dateInput && dateInput.value ? parseInt(dateInput.value.split("-")[0]) : 0;
    p.localHistory.push({ id: "lch_" + Date.now(), title: title.value, date: dateInput ? dateInput.value : "", year });
    this.save();
    this.populateLocalHistoryList();
    title.value = "";
    if (dateInput) dateInput.value = "";
    // Re-render local history events on the lifeline
    if (typeof this.renderAll === "function") this.renderAll();
    // Close modal after save
    this.closeLocalHistoryModal();
  },

  closeLocalHistoryModalAfterSave() {
    this.closeLocalHistoryModal();
  },

  deleteLocalHistory() {
    const list = document.getElementById("localHistoryList");
    if (!list || !list.value || !this.activeProfile) return;
    const p = this.getProfile(this.activeProfile);
    if (!p || !p.localHistory) return;
    p.localHistory = p.localHistory.filter(e => e.id !== list.value);
    this.save();
    this.populateLocalHistoryList();
    if (typeof this.renderAll === "function") this.renderAll();
  },

  populateLocalHistoryList() {
    const list = document.getElementById("localHistoryList");
    if (!list) return;
    list.innerHTML = "";
    const p = this.getActiveProfile();
    if (!p || !p.localHistory) return;
    p.localHistory.forEach(ev => {
      const opt = document.createElement("option");
      opt.value = ev.id;
      opt.textContent = (ev.date ? this.fmtDate(ev.date) : ev.year) + " - " + ev.title;
      list.appendChild(opt);
    });
  },

  populateEventList() {
    const list = document.getElementById("lifeEventList");
    if (!list) return;
    list.innerHTML = "";
    const p = this.getActiveProfile();
    if (!p || !p.lifeEvents) return;
    p.lifeEvents.forEach(ev => {
      const opt = document.createElement("option");
      opt.value = ev.id;
      opt.textContent = (ev.date ? this.fmtDate(ev.date) : ev.year) + " — " + ev.title;
      list.appendChild(opt);
    });
  },

  // ───────────── Input styling ─────────────
  addInputCapsStyles() {
    // Style all relevant inputs with text-transform: capitalize on blur
    const inputs = ["natalName", "natalCity", "lifeEventTitle", "localHistoryTitle"];
    inputs.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener("blur", () => {
          if (el.value) {
            el.value = el.value.replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
          }
        });
        // Also capitalize on input for real-time feedback
        el.addEventListener("input", () => {
          // Only capitalize after the user finishes a word (space entered or cursor moved to next word)
          // Simple approach: capitalize first letter of each word on every input
          const caret = el.selectionStart;
          el.value = el.value.replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
          el.setSelectionRange(caret, caret);
        });
      }
    });
  },

  // ───────────── Init ─────────────
  init() {
    if (!this.isPersonal()) return;
    this.load();
    this.addInputCapsStyles();
    // Don't render lifelines on refresh — user must load a profile
    this.showHideElements();
    bindModalEventListeners();
    window.addEventListener("zy:screwBuilt", () => {
      if (this.birthDateUTC) {
        this.renderLifeline();
        this.renderDiagonal();
        this.renderPersonalEvents();
      }
      // Always re-render local history events — they don't need birth data
      this.renderLocalHistoryEvents();
    });
    // Re-render diagonal on every scroll so the mask stays anchored to viewport.
    // The lifeline and personal events are inside #scrollGroup and auto-translate,
    // so they don't need this. Only the mask position needs per-frame updates.
    window.addEventListener("zy:scrollChanged", () => {
      if (this.birthDateUTC) this.refreshDiagonalMasks();
    });
  }
};
window.PersonalLife = PersonalLife;

// ───────────── Event Listeners ─────────────
// Run on DOMContentLoaded so modal button elements exist
function bindModalEventListeners() {
  // Natal modal
  const natalSaveBtn = document.getElementById("natalSaveBtn");
  if (natalSaveBtn) {
    natalSaveBtn.addEventListener("click", () => {
      const personRadio = document.getElementById("natalModePerson");
      const isPersonMode = personRadio && personRadio.checked;
      const name = document.getElementById("natalName");
      const date = document.getElementById("natalDate");
      const time = document.getElementById("natalTime");
      const city = document.getElementById("natalCity");
      if (date && date.value) {
        if (isPersonMode) {
          // Person mode: add to profiles, DON'T touch active, DON'T close modal
          const profileName = (name ? name.value : "").trim() || "Person " + Date.now();
          PersonalLife.addPersonProfile(
            profileName,
            date.value,
            time ? time.value : "12:00",
            city ? city.value : ""
          );
          // Clear fields for next entry
          if (name) name.value = "";
          if (date) date.value = "";
          if (time) time.value = "12:00";
          if (city) city.value = "";
        } else {
          // Natal mode: set as active profile, closes modal, page resets to new natal
          PersonalLife.setBirth(
            name ? name.value : "",
            date.value,
            time ? time.value : "12:00",
            city ? city.value : ""
          );
        }
      }
    });
  }
  const natalClearBtn = document.getElementById("natalClearBtn");
  if (natalClearBtn) natalClearBtn.addEventListener("click", () => PersonalLife.clearBirth());
  const natalDeleteBtn = document.getElementById("natalDeleteBtn");
  if (natalDeleteBtn) {
    natalDeleteBtn.addEventListener("click", () => {
      const list = document.getElementById("profileList");
      if (list && list.value) PersonalLife.deleteProfile(list.value);
    });
  }
  const natalLoadBtn = document.getElementById("natalLoadBtn");
  if (natalLoadBtn) {
    natalLoadBtn.addEventListener("click", () => {
      const list = document.getElementById("profileList");
      if (list && list.value) PersonalLife.loadProfile(list.value);
    });
  }
  const natalCloseBtn = document.getElementById("natalCloseBtn");
  if (natalCloseBtn) natalCloseBtn.addEventListener("click", () => PersonalLife.closeNatalModal());
  const natalCloseX = document.getElementById("natalModalClose");
  if (natalCloseX) natalCloseX.addEventListener("click", () => PersonalLife.closeNatalModal());

  // Radio toggle: Natal → show active profile, Person → clear fields
  const natalModeNatal = document.getElementById("natalModeNatal");
  const natalModePerson = document.getElementById("natalModePerson");
  function applyNatalMode() {
    const isNatal = natalModeNatal && natalModeNatal.checked;
    const p = PersonalLife.getActiveProfile();
    const nn = document.getElementById("natalName");
    const nd = document.getElementById("natalDate");
    const nt = document.getElementById("natalTime");
    const nc = document.getElementById("natalCity");
    if (isNatal) {
      if (p && p.birthData) {
        if (nn) nn.value = p.name || "";
        if (nd) nd.value = p.birthData.date || "";
        if (nt) nt.value = p.birthData.time || "12:00";
        if (nc) nc.value = p.birthData.city || "";
      } else {
        if (nn) nn.value = "";
        if (nd) nd.value = "";
        if (nt) nt.value = "12:00";
        if (nc) nc.value = "";
      }
    } else {
      // Person mode: blank fields for adding someone new
      if (nn) nn.value = "";
      if (nd) nd.value = "";
      if (nt) nt.value = "12:00";
      if (nc) nc.value = "";
    }
  }
  if (natalModeNatal) natalModeNatal.addEventListener("change", applyNatalMode);
  if (natalModePerson) natalModePerson.addEventListener("change", applyNatalMode);

  // Profile list double-click → Person mode, load that person
  const profileList = document.getElementById("profileList");
  if (profileList) {
    profileList.addEventListener("dblclick", () => {
      if (profileList.value) {
        const p = PersonalLife.getProfile(profileList.value);
        if (p) {
          if (natalModePerson) natalModePerson.checked = true;
          if (natalModeNatal) natalModeNatal.checked = false;
          const nn = document.getElementById("natalName");
          const nd = document.getElementById("natalDate");
          const nt = document.getElementById("natalTime");
          const nc = document.getElementById("natalCity");
          if (nn) nn.value = p.name || "";
          if (nd) nd.value = (p.birthData && p.birthData.date) || "";
          if (nt) nt.value = (p.birthData && p.birthData.time) || "12:00";
          if (nc) nc.value = (p.birthData && p.birthData.city) || "";
        }
      }
    });
  }
  const natalModal = document.getElementById("natalModal");
  if (natalModal) {
    natalModal.addEventListener("click", (e) => {
      if (e.target === natalModal) PersonalLife.closeNatalModal();
    });
  }


  // Child checkbox toggle
  const isChildCheck = document.getElementById("lifeEventIsChild");
  if (isChildCheck) {
    isChildCheck.addEventListener("change", () => {
      const childFields = document.getElementById("childFields");
      if (childFields) childFields.style.display = isChildCheck.checked ? "block" : "none";
    });
  }

  // Add Person button
  const addPersonBtn = document.getElementById("addPersonBtn");
  if (addPersonBtn) {
    addPersonBtn.addEventListener("click", () => {
      const name = document.getElementById("natalName");
      const date = document.getElementById("natalDate");
      const time = document.getElementById("natalTime");
      const city = document.getElementById("natalCity");
      if (!name || !date || !date.value) return;
      const profileName = (name.value || "").trim() || "Person " + (PersonalLife.profiles.length + 1);
      PersonalLife.saveProfile(profileName, {
        date: date.value,
        time: time ? time.value : "12:00",
        city: city ? city.value : ""
      }, []);
      name.value = "";
      date.value = "";
      if (time) time.value = "12:00";
      if (city) city.value = "";
    });
  }

  // Update life event save to handle child data
  const addBtn = document.getElementById("lifeEventAddBtn");
  if (addBtn) {
    addBtn.addEventListener("click", () => {
      const title = document.getElementById("lifeEventTitle");
      const dateInput = document.getElementById("lifeEventDate");
      if (title && title.value) {
        const isChildCheck = document.getElementById("lifeEventIsChild");
        const childNameInput = document.getElementById("lifeEventChildName");
        const childBirthInput = document.getElementById("lifeEventChildBirthDate");
        const isChild = isChildCheck ? isChildCheck.checked : false;
        PersonalLife.addEvent(
          title.value,
          dateInput ? dateInput.value : "",
          isChild,
          childNameInput ? childNameInput.value : "",
          childBirthInput ? childBirthInput.value : ""
        );
        title.value = "";
        if (dateInput) dateInput.value = "";
        if (isChildCheck) isChildCheck.checked = false;
        if (childNameInput) childNameInput.value = "";
        if (childBirthInput) childBirthInput.value = "";
        const childFields = document.getElementById("childFields");
        if (childFields) childFields.style.display = "none";
      }
    });
  }
  const deleteBtn = document.getElementById("lifeEventDeleteBtn");
  if (deleteBtn) {
    deleteBtn.addEventListener("click", () => {
      const list = document.getElementById("lifeEventList");
      if (list && list.value) PersonalLife.deleteEvent(list.value);
    });
  }
  const closeBtn = document.getElementById("lifeEventCloseBtn");
  if (closeBtn) closeBtn.addEventListener("click", () => PersonalLife.closeEventModal());
  const closeX = document.getElementById("lifeEventModalClose");
  if (closeX) closeX.addEventListener("click", () => PersonalLife.closeEventModal());
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => PersonalLife.init());
} else {
  PersonalLife.init();
}

/* aspect-search.js — exact geocentric tropical aspect finder */
(function () {
  "use strict";

  const DAY_MS = 86400000;
  const RANGE_STEP_YEARS = 200;
  const MAX_RESULTS = 500;
  const STORAGE_KEY = "zy_aspect_search";

  const BODIES = [
    ["sun", "Sun", "☉"],
    ["moon", "Moon", "☽"],
    ["mercury", "Mercury", "☿"],
    ["venus", "Venus", "♀"],
    ["mars", "Mars", "♂"],
    ["jupiter", "Jupiter", "♃"],
    ["saturn", "Saturn", "♄"],
    ["uranus", "Uranus", "♅"],
    ["neptune", "Neptune", "♆"],
    ["pluto", "Pluto", "♇"],
    ["northNode", "North Node", "☊"],
    ["southNode", "South Node", "☋"]
  ];

  const ASPECTS = [
    [0, "Conjunction", "☌"],
    [60, "Sextile", "✶"],
    [90, "Square", "□"],
    [120, "Trine", "△"],
    [180, "Opposition", "☍"]
  ];

  const SIGNS = [
    ["Aries", "♈︎", "fire"], ["Taurus", "♉︎", "earth"],
    ["Gemini", "♊︎", "air"], ["Cancer", "♋︎", "water"],
    ["Leo", "♌︎", "fire"], ["Virgo", "♍︎", "earth"],
    ["Libra", "♎︎", "air"], ["Scorpio", "♏︎", "water"],
    ["Sagittarius", "♐︎", "fire"], ["Capricorn", "♑︎", "earth"],
    ["Aquarius", "♒︎", "air"], ["Pisces", "♓︎", "water"]
  ];

  const SPEED_RANK = {
    moon: 0, sun: 1, mercury: 1, venus: 1, mars: 2,
    northNode: 3, southNode: 3, jupiter: 3, saturn: 4,
    uranus: 5, neptune: 5, pluto: 5
  };

  let cancelToken = 0;
  let elements = null;

  function bodyMeta(key) {
    return BODIES.find((body) => body[0] === key) || [key, key, ""];
  }

  function aspectMeta(angle) {
    return ASPECTS.find((aspect) => aspect[0] === Number(angle)) || ASPECTS[0];
  }

  function norm360(value) {
    return ((Number(value) % 360) + 360) % 360;
  }

  function wrap180(value) {
    let out = norm360(value);
    if (out > 180) out -= 360;
    return out;
  }

  function longitudeAt(body, timeMs) {
    const lons = window.getPlanetLongitudes(new Date(timeMs));
    return Number(lons && lons[body]);
  }

  function branchError(bodyA, bodyB, target, timeMs) {
    return wrap180(longitudeAt(bodyB, timeMs) - longitudeAt(bodyA, timeMs) - target);
  }

  function stepDaysFor(bodyA, bodyB) {
    const rank = Math.min(SPEED_RANK[bodyA] ?? 3, SPEED_RANK[bodyB] ?? 3);
    return [0.2, 0.5, 1, 2, 4, 6][rank] || 2;
  }

  function adaptiveStepDays(bodyA, bodyB, startMs, endMs) {
    const base = stepDaysFor(bodyA, bodyB);
    const spanYears = Math.max(1, (endMs - startMs) / (365.2425 * DAY_MS));
    const scale = Math.max(1, Math.ceil(spanYears / RANGE_STEP_YEARS));
    return Math.min(30, base * scale);
  }

  function parseUTCDate(value, endOfDay) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) return NaN;
    return Date.parse(value + (endOfDay ? "T23:59:59.999Z" : "T00:00:00.000Z"));
  }

  function dateInputValue(date) {
    return [
      String(date.getUTCFullYear()).padStart(4, "0"),
      String(date.getUTCMonth() + 1).padStart(2, "0"),
      String(date.getUTCDate()).padStart(2, "0")
    ].join("-");
  }

  function zodiacPositionMarkup(longitude) {
    const lon = norm360(longitude);
    const signIndex = Math.floor(lon / 30);
    const within = lon - signIndex * 30;
    const degree = Math.floor(within);
    const minute = Math.floor((within - degree) * 60);
    const sign = SIGNS[signIndex];
    return `${degree}°${String(minute).padStart(2, "0")}′ <span class="aspect-search-sign ${sign[2]}">${sign[1]}</span> ${sign[0]}`;
  }

  function formatUTC(date) {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "UTC",
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    }).formatToParts(date);
    const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
    return `${values.day} ${values.month} ${values.year}, ${values.hour}:${values.minute} UTC`;
  }

  function retrogradeLabel(body, date) {
    if (!window.getRetrogradeState || ["sun", "moon", "northNode", "southNode"].includes(body)) return "";
    const state = window.getRetrogradeState(date).get(body);
    return state === "rx" ? " ℞" : state === "s" ? " S" : "";
  }

  function refineRoot(bodyA, bodyB, target, loMs, hiMs) {
    let lo = loMs;
    let hi = hiMs;
    let fLo = branchError(bodyA, bodyB, target, lo);
    for (let i = 0; i < 36; i++) {
      const mid = (lo + hi) / 2;
      const fMid = branchError(bodyA, bodyB, target, mid);
      if (!Number.isFinite(fMid)) break;
      if (Math.abs(fMid) < 1e-7 || hi - lo < 1000) return mid;
      if (Math.sign(fMid) === Math.sign(fLo)) {
        lo = mid;
        fLo = fMid;
      } else {
        hi = mid;
      }
    }
    return (lo + hi) / 2;
  }

  function saveSettings(settings) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {}
  }

  function loadSettings() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    } catch (error) {
      return {};
    }
  }

  function setStatus(message, isError) {
    elements.status.textContent = message;
    elements.status.classList.toggle("is-error", !!isError);
  }

  function setSearching(searching) {
    elements.search.disabled = searching;
    elements.cancel.disabled = !searching;
    elements.progress.hidden = !searching;
  }

  function yieldToUI() {
    return new Promise((resolve) => setTimeout(resolve, 0));
  }

  async function findAspects(settings, token) {
    const startMs = parseUTCDate(settings.startDate, false);
    const endMs = parseUTCDate(settings.endDate, true);
    const stepMs = adaptiveStepDays(settings.bodyA, settings.bodyB, startMs, endMs) * DAY_MS;
    const angle = Number(settings.aspect);
    const targets = angle === 0 ? [0] : angle === 180 ? [180] : [angle, -angle];
    const hits = [];
    const totalSteps = Math.max(1, Math.ceil((endMs - startMs) / stepMs));

    for (const target of targets) {
      let prevMs = startMs;
      let prevError = branchError(settings.bodyA, settings.bodyB, target, prevMs);

      for (let index = 1, timeMs = startMs + stepMs; timeMs <= endMs + stepMs; index++, timeMs += stepMs) {
        if (token !== cancelToken) throw new Error("cancelled");
        const currentMs = Math.min(timeMs, endMs);
        const currentError = branchError(settings.bodyA, settings.bodyB, target, currentMs);
        const continuous = Number.isFinite(prevError) && Number.isFinite(currentError) &&
          Math.abs(currentError - prevError) < 180;
        const crossed = continuous && (
          Math.abs(currentError) < 1e-6 ||
          Math.abs(prevError) < 1e-6 ||
          Math.sign(prevError) !== Math.sign(currentError)
        );

        if (crossed) {
          const hitMs = Math.abs(prevError) < 1e-6
            ? prevMs
            : refineRoot(settings.bodyA, settings.bodyB, target, prevMs, currentMs);
          if (!hits.some((existing) => Math.abs(existing - hitMs) < 6 * 60 * 60 * 1000)) {
            hits.push(hitMs);
            if (hits.length >= MAX_RESULTS) return hits.sort((a, b) => a - b);
          }
        }

        prevMs = currentMs;
        prevError = currentError;
        if (currentMs === endMs) break;

        if (index % 40 === 0) {
          elements.progress.value = Math.min(1, (index / totalSteps) / targets.length);
          setStatus(`Searching ${Math.min(100, Math.round((index / totalSteps) * 100))}%...`);
          await yieldToUI();
        }
      }
    }
    return hits.sort((a, b) => a - b);
  }

  function renderResults(hits, settings) {
    elements.results.innerHTML = "";
    if (!hits.length) {
      elements.results.innerHTML = '<div class="aspect-search-empty">No exact aspects found in this range.</div>';
      return;
    }

    const bodyA = bodyMeta(settings.bodyA);
    const bodyB = bodyMeta(settings.bodyB);
    const aspect = aspectMeta(settings.aspect);
    const aspectClass = Number(settings.aspect) === 60 || Number(settings.aspect) === 120
      ? "harmonious"
      : "dynamic";
    const fragment = document.createDocumentFragment();

    hits.forEach((timeMs) => {
      const date = new Date(timeMs);
      const lons = window.getPlanetLongitudes(date);
      const row = document.createElement("button");
      row.type = "button";
      row.className = "aspect-search-result";
      row.dataset.dateUtc = date.toISOString();
      row.innerHTML = `
        <span class="aspect-search-result-date">${formatUTC(date)}</span>
        <span class="aspect-search-result-pair">
          <span>${bodyA[2]} ${zodiacPositionMarkup(lons[settings.bodyA])}${retrogradeLabel(settings.bodyA, date)}</span>
          <strong class="${aspectClass}" title="${aspect[1]}">${aspect[2]}</strong>
          <span>${bodyB[2]} ${zodiacPositionMarkup(lons[settings.bodyB])}${retrogradeLabel(settings.bodyB, date)}</span>
        </span>
        <span class="aspect-search-result-action">Go to date</span>`;
      row.addEventListener("click", () => {
        window.dispatchEvent(new CustomEvent("zy:navigateToDate", {
          detail: { dateUTC: row.dataset.dateUtc }
        }));
        closeModal();
      });
      fragment.appendChild(row);
    });
    elements.results.appendChild(fragment);
  }

  async function runSearch() {
    const settings = {
      bodyA: elements.bodyA.value,
      bodyB: elements.bodyB.value,
      aspect: Number(elements.aspect.value),
      startDate: elements.startDate.value,
      endDate: elements.endDate.value
    };

    const startMs = parseUTCDate(settings.startDate, false);
    const endMs = parseUTCDate(settings.endDate, true);
    if (settings.bodyA === settings.bodyB) {
      setStatus("Choose two different bodies.", true);
      return;
    }
    if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) {
      setStatus("Enter a valid UTC date range.", true);
      return;
    }
    const spanYears = (endMs - startMs) / (365.2425 * DAY_MS);
    if (spanYears > RANGE_STEP_YEARS) {
      setStatus(`Wide range detected. Using a coarser scan for ${Math.ceil(spanYears)} years...`);
    }
    if (typeof window.getPlanetLongitudes !== "function") {
      setStatus("The ephemeris is not ready yet.", true);
      return;
    }

    saveSettings(settings);
    const token = ++cancelToken;
    elements.results.innerHTML = "";
    elements.progress.value = 0;
    setSearching(true);
    setStatus("Searching exact aspects...");

    try {
      const hits = await findAspects(settings, token);
      if (token !== cancelToken) return;
      renderResults(hits, settings);
      const limited = hits.length >= MAX_RESULTS ? ` First ${MAX_RESULTS} shown.` : "";
      setStatus(`${hits.length} exact aspect${hits.length === 1 ? "" : "s"} found.${limited}`);
    } catch (error) {
      if (error.message !== "cancelled") setStatus("Search failed. Try a narrower range or wait longer.", true);
    } finally {
      if (token === cancelToken) setSearching(false);
    }
  }

  function openModal() {
    const card = elements.modal.querySelector(".aspect-search-card");
    if (card) {
      card.style.position = "";
      card.style.left = "";
      card.style.top = "";
      card.style.margin = "";
    }
    elements.modal.setAttribute("aria-hidden", "false");
    elements.bodyA.focus();
  }

  function closeModal() {
    cancelToken++;
    setSearching(false);
    elements.modal.setAttribute("aria-hidden", "true");
  }

  function enableDragging(card, handle) {
    let drag = null;

    handle.addEventListener("pointerdown", (event) => {
      if (event.button !== 0 || event.target.closest("button, input, select")) return;
      const rect = card.getBoundingClientRect();
      drag = {
        pointerId: event.pointerId,
        offsetX: event.clientX - rect.left,
        offsetY: event.clientY - rect.top
      };
      card.style.position = "fixed";
      card.style.left = `${rect.left}px`;
      card.style.top = `${rect.top}px`;
      card.style.margin = "0";
      handle.setPointerCapture(event.pointerId);
      handle.classList.add("is-dragging");
      event.preventDefault();
    });

    handle.addEventListener("pointermove", (event) => {
      if (!drag || event.pointerId !== drag.pointerId) return;
      const margin = 8;
      const maxLeft = Math.max(margin, window.innerWidth - card.offsetWidth - margin);
      const maxTop = Math.max(margin, window.innerHeight - card.offsetHeight - margin);
      const left = Math.min(maxLeft, Math.max(margin, event.clientX - drag.offsetX));
      const top = Math.min(maxTop, Math.max(margin, event.clientY - drag.offsetY));
      card.style.left = `${left}px`;
      card.style.top = `${top}px`;
    });

    function stopDragging(event) {
      if (!drag || event.pointerId !== drag.pointerId) return;
      drag = null;
      handle.classList.remove("is-dragging");
      if (handle.hasPointerCapture(event.pointerId)) handle.releasePointerCapture(event.pointerId);
    }

    handle.addEventListener("pointerup", stopDragging);
    handle.addEventListener("pointercancel", stopDragging);
  }

  function optionMarkup(items) {
    return items.map((item) => `<option value="${item[0]}">${item[2]} ${item[1]}</option>`).join("");
  }

  function buildUI() {
    const wheelCard = document.querySelector("#wheelModal > .zyModalCard");
    if (!wheelCard || document.getElementById("planetAspectSearchBtn")) return;
    const categoryBar = document.getElementById("categoryBar");
    const isPersonal = new URLSearchParams(window.location.search).get("variant") === "personal";

    const button = document.createElement("button");
    button.id = "planetAspectSearchBtn";
    button.type = "button";
    button.title = "Find exact planetary aspects";
    button.innerHTML = '<span aria-hidden="true">☿</span> Planet Aspect Search';
    if (isPersonal && categoryBar) {
      button.classList.add("cat-btn", "ephemeris-btn");
      button.style.position = "static";
      button.style.top = "auto";
      button.style.right = "auto";
      button.style.left = "auto";
      button.style.marginBottom = "6px";
      button.style.width = "auto";
      setTimeout(() => {
        if (!button.isConnected && categoryBar.isConnected) {
          const clearBtn = categoryBar.querySelector('button[data-category=""]');
          if (clearBtn && clearBtn.parentElement === categoryBar) {
            categoryBar.insertBefore(button, clearBtn);
          } else {
            categoryBar.appendChild(button);
          }
        }
      }, 0);
    } else {
      wheelCard.appendChild(button);
    }

    const now = new Date();
    const defaultStart = new Date(Date.UTC(now.getUTCFullYear() - 5, 0, 1));
    const defaultEnd = new Date(Date.UTC(now.getUTCFullYear() + 5, 11, 31));
    const saved = loadSettings();

    const modal = document.createElement("div");
    modal.id = "aspectSearchModal";
    modal.className = "aspect-search-modal";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-labelledby", "aspectSearchTitle");
    modal.setAttribute("aria-hidden", "true");
    modal.innerHTML = `
      <div class="aspect-search-backdrop" data-aspect-close></div>
      <div class="aspect-search-card">
        <div class="aspect-search-header">
          <div>
            <div id="aspectSearchTitle">Planet Aspect Search</div>
            <div class="aspect-search-subtitle">Exact geocentric tropical aspects in UTC</div>
          </div>
          <button type="button" class="aspect-search-close" data-aspect-close aria-label="Close">×</button>
        </div>
        <div class="aspect-search-form">
          <label><span>Planet A</span><select id="aspectBodyA">${optionMarkup(BODIES)}</select></label>
          <label><span>Aspect</span><select id="aspectAngle">${optionMarkup(ASPECTS.map((a) => [a[0], `${a[1]} (${a[0]}°)`, a[2]]))}</select></label>
          <label><span>Planet B</span><select id="aspectBodyB">${optionMarkup(BODIES)}</select></label>
          <label><span>From (UTC)</span><input id="aspectStartDate" type="date"></label>
          <label><span>Through (UTC)</span><input id="aspectEndDate" type="date"></label>
        </div>
        <div class="aspect-search-actions">
          <button id="aspectSearchRun" type="button">Search</button>
          <button id="aspectSearchCancel" type="button" disabled>Cancel</button>
          <span id="aspectSearchStatus" aria-live="polite">Choose two bodies and an aspect.</span>
        </div>
        <progress id="aspectSearchProgress" max="1" value="0" hidden></progress>
        <div id="aspectSearchResults" class="aspect-search-results"></div>
      </div>`;
    document.body.appendChild(modal);

    elements = {
      modal,
      bodyA: modal.querySelector("#aspectBodyA"),
      bodyB: modal.querySelector("#aspectBodyB"),
      aspect: modal.querySelector("#aspectAngle"),
      startDate: modal.querySelector("#aspectStartDate"),
      endDate: modal.querySelector("#aspectEndDate"),
      search: modal.querySelector("#aspectSearchRun"),
      cancel: modal.querySelector("#aspectSearchCancel"),
      status: modal.querySelector("#aspectSearchStatus"),
      progress: modal.querySelector("#aspectSearchProgress"),
      results: modal.querySelector("#aspectSearchResults")
    };

    elements.bodyA.value = saved.bodyA || "jupiter";
    elements.bodyB.value = saved.bodyB || "saturn";
    elements.aspect.value = String(Number.isFinite(Number(saved.aspect)) ? Number(saved.aspect) : 0);
    elements.startDate.value = saved.startDate || dateInputValue(defaultStart);
    elements.endDate.value = saved.endDate || dateInputValue(defaultEnd);

    enableDragging(modal.querySelector(".aspect-search-card"), modal.querySelector(".aspect-search-header"));
    button.addEventListener("click", openModal);
    elements.search.addEventListener("click", runSearch);
    elements.cancel.addEventListener("click", () => {
      cancelToken++;
      setSearching(false);
      setStatus("Search cancelled.");
    });
    modal.querySelectorAll("[data-aspect-close]").forEach((close) => close.addEventListener("click", closeModal));
    modal.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeModal();
      if (event.key === "Enter" && event.target.tagName !== "BUTTON") runSearch();
    });

    window.addEventListener("zy:ephemerisRequested", openModal);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", buildUI);
  } else {
    buildUI();
  }
})();

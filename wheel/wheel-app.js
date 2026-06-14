/* wheel-app.js — standalone Zodiac Wheel state and timeline synchronization */
(function () {
  "use strict";

  const CHANNEL_NAME = "skyclawk-zodiac-wheel";
  const params = new URLSearchParams(location.search);
  const parentId = params.get("parent") || "";
  const channel = typeof BroadcastChannel === "function"
    ? new BroadcastChannel(CHANNEL_NAME)
    : null;
  const status = document.getElementById("wheelConnectionStatus");
  const modeLabels = { generational: "Generational", personal: "Personal" };
  const planetOptions = [
    ["sun", "☉ Sun"], ["moon", "☽ Moon"], ["mercury", "☿ Mercury"],
    ["venus", "♀ Venus"], ["mars", "♂ Mars"], ["jupiter", "♃ Jupiter"],
    ["saturn", "♄ Saturn"], ["uranus", "♅ Uranus"], ["neptune", "♆ Neptune"],
    ["pluto", "♇ Pluto"]
  ];

  let lastStateAt = 0;
  let lastNatalSignature = "";
  let lastLocationSignature = "";
  let latestState = null;
  let initialModeApplied = false;
  let pendingNatalLocation = null;
  let citiesPromise = null;

  function setStatus(text, connected) {
    if (!status) return;
    status.textContent = text;
    status.classList.toggle("is-connected", !!connected);
  }

  function populateCycleSelect(id, selected) {
    const select = document.getElementById(id);
    if (!select || select.options.length) return;
    for (const [value, label] of planetOptions) {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = label;
      option.selected = value === selected;
      select.appendChild(option);
    }
  }

  populateCycleSelect("cyclesAspectPlanetA", "venus");
  populateCycleSelect("cyclesAspectPlanetB", "sun");
  populateCycleSelect("cyclesPlanetSelect", "venus");

  function cloneLocation(value) {
    if (!value || typeof value !== "object") return null;
    const lat = Number(value.lat);
    const lon = Number(value.lon);
    return {
      name: value.name || "",
      lat: Number.isFinite(lat) ? lat : null,
      lon: Number.isFinite(lon) ? lon : null,
      tz: value.tz || ""
    };
  }

  function applyNatal(natal) {
    const locationValue = cloneLocation(natal?.location);
    const signature = JSON.stringify({
      enabled: !!natal?.enabled,
      dateUTC: natal?.dateUTC || null,
      location: locationValue
    });
    if (signature === lastNatalSignature) return;
    lastNatalSignature = signature;

    const date = natal?.dateUTC ? new Date(natal.dateUTC) : null;
    if (date && Number.isFinite(date.getTime())) {
      window.NatalChart.setDateUTC?.(date);
      window.NatalChart.dateUTC = date;
    }
    window.NatalChart.enabled = !!natal?.enabled;
    window.natalLocationData = locationValue;
    window.__natalDirty = (window.__natalDirty || 0) + 1;

    const dateInput = document.getElementById("natalDateInput");
    const timeInput = document.getElementById("natalTimeInput");
    const locationInput = document.getElementById("natalLocationInput");
    if (date && Number.isFinite(date.getTime())) {
      const tz = locationValue?.tz || "UTC";
      const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone: tz,
        year: "numeric", month: "2-digit", day: "2-digit",
        hour: "2-digit", minute: "2-digit", hour12: false
      }).formatToParts(date);
      const part = (type) => parts.find((item) => item.type === type)?.value || "";
      if (dateInput) dateInput.value = `${part("year")}-${part("month")}-${part("day")}`;
      if (timeInput) timeInput.value = `${part("hour")}:${part("minute")}`;
    }
    if (locationInput) locationInput.value = locationValue?.name || "";
  }

  function applyAuspicious(context) {
    const overlay = document.getElementById("wheelEventInfoOverlay");
    const grid = document.getElementById("wheelEventInfoGrid");
    const link = document.getElementById("auspiciousNavLink");
    if (!overlay || !grid || !link) return;

    const visible = !!context?.visible;
    overlay.classList.toggle("is-visible", visible);
    overlay.classList.toggle("has-data", !!context?.hasData);
    grid.textContent = context?.text || "Open Auspicious Calculator";
    link.href = context?.href || "/auspicious/";
  }

  function applyState(state) {
    if (!state || state.parentId !== parentId) return;
    latestState = state;
    lastStateAt = Date.now();

    const sourceLabel = modeLabels[state.sourceMode] || "Timeline";
    setStatus(`Connected to ${sourceLabel} timeline`, true);
    document.title = `${sourceLabel} Zodiac Wheel`;

    const locationValue = cloneLocation(state.location);
    const locationSignature = JSON.stringify(locationValue);
    if (locationSignature !== lastLocationSignature) {
      lastLocationSignature = locationSignature;
      window.locationData = locationValue;
      window.__houseCache?.clear?.();
      window.__planetEnabledDirty = (window.__planetEnabledDirty || 0) + 1;
    }

    applyNatal(state.natal);
    applyAuspicious(state.auspicious);

    if (state.initial && !initialModeApplied && typeof window.setSkyMode === "function") {
      initialModeApplied = true;
      window.setSkyMode(state.skyMode || "transit");
    }

    const date = new Date(state.dateUTC);
    if (Number.isFinite(date.getTime())) {
      window.AstroEngine.setDateUTC(date);
      timeState.navTargetDateUTC = null;
    }

    const followLiveClock = !!state.live && window.astrowheelSkyMode !== "tropical";
    window.setAstroWheelLiveMode?.(followLiveClock);
    window.drawAstroWheel?.();
  }

  function send(message) {
    channel?.postMessage({ ...message, parentId });
  }

  channel?.addEventListener("message", (event) => {
    if (event.data?.type === "wheel:state") applyState(event.data);
  });

  window.addEventListener("zy:navigateToDate", (event) => {
    const date = new Date(event.detail?.dateUTC);
    if (!Number.isFinite(date.getTime())) return;
    window.setAstroWheelLiveMode?.(false);
    window.AstroEngine.setDateUTC(date);
    window.drawAstroWheel?.();
    send({ type: "wheel:navigate", dateUTC: date.toISOString() });
  });

  function loadCities() {
    if (!citiesPromise) {
      citiesPromise = fetch("../data/cities.json").then((response) => response.json());
    }
    return citiesPromise;
  }

  function showLocationResults(query) {
    const dropdown = document.getElementById("natalLocationDropdown");
    if (!dropdown) return;
    loadCities().then((cities) => {
      const normalized = String(query || "").trim().toLowerCase();
      const results = cities
        .filter((city) => !normalized || city.name.toLowerCase().includes(normalized))
        .slice(0, 8);
      dropdown.replaceChildren();
      for (const city of results) {
        const item = document.createElement("button");
        item.type = "button";
        item.className = "location-dropdown-item";
        item.textContent = `${city.name} ${city.tz}`;
        item.addEventListener("mousedown", (event) => {
          event.preventDefault();
          pendingNatalLocation = cloneLocation(city);
          pendingNatalLocation.name = city.name;
          document.getElementById("natalLocationInput").value = city.name;
          dropdown.style.display = "none";
        });
        dropdown.appendChild(item);
      }
      dropdown.style.display = results.length ? "block" : "none";
    });
  }

  const natalLocationInput = document.getElementById("natalLocationInput");
  natalLocationInput?.addEventListener("focus", () => showLocationResults(natalLocationInput.value));
  natalLocationInput?.addEventListener("input", () => showLocationResults(natalLocationInput.value));
  document.addEventListener("click", (event) => {
    const dropdown = document.getElementById("natalLocationDropdown");
    if (dropdown && event.target !== natalLocationInput && !dropdown.contains(event.target)) {
      dropdown.style.display = "none";
    }
  });

  function wallTimeToUTC(dateValue, timeValue, tz) {
    const [year, month, day] = dateValue.split("-").map(Number);
    const [hour, minute] = timeValue.split(":").map(Number);
    let guess = new Date(Date.UTC(year, month - 1, day, hour || 0, minute || 0));
    if (!tz) return guess;

    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      year: "numeric", month: "numeric", day: "numeric",
      hour: "numeric", minute: "numeric", second: "numeric", hour12: false
    });
    for (let index = 0; index < 5; index++) {
      const parts = formatter.formatToParts(guess);
      const part = (type) => Number(parts.find((item) => item.type === type)?.value || 0);
      const represented = Date.UTC(
        part("year"), part("month") - 1, part("day"),
        part("hour"), part("minute"), part("second")
      );
      const target = Date.UTC(year, month - 1, day, hour || 0, minute || 0);
      const difference = target - represented;
      guess = new Date(guess.getTime() + difference);
      if (Math.abs(difference) < 1000) break;
    }
    return guess;
  }

  function publishNatal(enabled, date, locationValue) {
    const natal = {
      enabled,
      dateUTC: date instanceof Date && Number.isFinite(date.getTime()) ? date.toISOString() : null,
      location: cloneLocation(locationValue)
    };
    applyNatal(natal);
    send({ type: "wheel:natal", natal });
    window.drawAstroWheel?.();
  }

  document.getElementById("natalSetBtn")?.addEventListener("click", () => {
    const dateValue = document.getElementById("natalDateInput")?.value;
    const timeValue = document.getElementById("natalTimeInput")?.value || "12:00";
    if (!dateValue) return;
    const locationValue = pendingNatalLocation || window.natalLocationData || latestState?.location;
    const date = wallTimeToUTC(dateValue, timeValue, locationValue?.tz);
    pendingNatalLocation = null;
    publishNatal(true, date, locationValue);
  });

  document.getElementById("natalCancelBtn")?.addEventListener("click", () => {
    document.getElementById("natalDateInput").value = "";
    document.getElementById("natalTimeInput").value = "12:00";
    document.getElementById("natalLocationInput").value = "";
    publishNatal(false, null, null);
  });

  document.getElementById("importToNatalBtn")?.addEventListener("click", () => {
    const date = window.AstroEngine.dateUTC;
    const locationValue = latestState?.location || window.locationData;
    const tz = locationValue?.tz || "UTC";
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: tz,
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", hour12: false
    }).formatToParts(date);
    const part = (type) => parts.find((item) => item.type === type)?.value || "";
    document.getElementById("natalDateInput").value = `${part("year")}-${part("month")}-${part("day")}`;
    document.getElementById("natalTimeInput").value = `${part("hour")}:${part("minute")}`;
    document.getElementById("natalLocationInput").value = locationValue?.name || "";
    pendingNatalLocation = cloneLocation(locationValue);
  });

  document.getElementById("wheelClose")?.addEventListener("click", () => window.close());

  window.openAstroWheel?.();
  send({ type: "wheel:hello" });

  window.setInterval(() => {
    if (Date.now() - lastStateAt > 3000) {
      setStatus("Timeline disconnected - wheel remains usable", false);
      send({ type: "wheel:hello" });
    }
  }, 1500);
})();

/* wheel-popout-bridge.js — timeline host for the standalone Zodiac Wheel */
(function () {
  "use strict";

  const CHANNEL_NAME = "skyclawk-zodiac-wheel";
  const PARENT_ID_KEY = "skyclawk-wheel-parent-id";
  const channel = typeof BroadcastChannel === "function"
    ? new BroadcastChannel(CHANNEL_NAME)
    : null;

  let wheelWindow = null;
  let syncTimer = null;

  function makeId() {
    if (globalThis.crypto && typeof globalThis.crypto.randomUUID === "function") {
      return globalThis.crypto.randomUUID();
    }
    return `wheel-parent-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  let parentId = sessionStorage.getItem(PARENT_ID_KEY);
  if (!parentId) {
    parentId = makeId();
    sessionStorage.setItem(PARENT_ID_KEY, parentId);
  }

  function currentDate() {
    if (window.timeState?.navTargetDateUTC instanceof Date) {
      return window.timeState.navTargetDateUTC;
    }
    if (window.__liveDate instanceof Date && !window._auspiciousJumped) {
      return window.__liveDate;
    }
    if (window.timeState?.dateUTC instanceof Date) {
      return window.timeState.dateUTC;
    }
    if (window.AstroEngine?.dateUTC instanceof Date) {
      return window.AstroEngine.dateUTC;
    }
    return new Date();
  }

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

  function activeProfileName() {
    try {
      const profile = window.PersonalLife?.getActiveProfile?.();
      return profile?.name || "";
    } catch (_) {
      return "";
    }
  }

  function auspiciousContext() {
    const overlay = document.getElementById("wheelEventInfoOverlay");
    const grid = document.getElementById("wheelEventInfoGrid");
    const link = document.getElementById("auspiciousNavLink");
    return {
      visible: !!overlay,
      hasData: !!overlay?.classList.contains("has-data"),
      text: grid?.innerText?.trim() || "",
      href: link?.href && link.getAttribute("href") !== "#" ? link.href : ""
    };
  }

  function buildState(initial) {
    const date = currentDate();
    const natalDate = window.NatalChart?.dateUTC;
    return {
      type: "wheel:state",
      parentId,
      initial: !!initial,
      sentAt: Date.now(),
      sourceMode: location.pathname.includes("/personal/") ? "personal" : "generational",
      dateUTC: date.toISOString(),
      live: window.__liveDate instanceof Date && !window._auspiciousJumped,
      location: cloneLocation(window.locationData),
      natal: {
        enabled: !!window.NatalChart?.enabled,
        dateUTC: natalDate instanceof Date ? natalDate.toISOString() : null,
        location: cloneLocation(window.natalLocationData),
        profileName: activeProfileName()
      },
      skyMode: window.astrowheelSkyMode || "transit",
      auspicious: auspiciousContext()
    };
  }

  function sendState(initial) {
    channel?.postMessage(buildState(initial));
  }

  function isMotionActive() {
    return (
      window.timeState?.navTargetDateUTC instanceof Date ||
      (window.__liveDate instanceof Date && !window._auspiciousJumped)
    );
  }

  function syncDelayMs() {
    return isMotionActive() ? 100 : 250;
  }

  function stopSync() {
    if (!syncTimer) return;
    window.clearTimeout(syncTimer);
    syncTimer = null;
  }

  function startSync() {
    if (syncTimer) return;
    const tick = () => {
      if (wheelWindow && wheelWindow.closed) {
        wheelWindow = null;
        stopSync();
        return;
      }
      sendState(false);
      syncTimer = window.setTimeout(tick, syncDelayMs());
    };
    tick();
  }

  function openWheelPopout() {
    if (wheelWindow && !wheelWindow.closed) {
      wheelWindow.focus();
      sendState(true);
      return wheelWindow;
    }

    const mode = location.pathname.includes("/personal/") ? "personal" : "generational";
    const width = Math.min(1420, Math.max(1100, screen.availWidth - 80));
    const height = Math.min(980, Math.max(760, screen.availHeight - 80));
    const left = Math.max(0, Math.round((screen.availWidth - width) / 2));
    const top = Math.max(0, Math.round((screen.availHeight - height) / 2));
    const url = `/wheel/?parent=${encodeURIComponent(parentId)}&mode=${mode}`;

    wheelWindow = window.open(
      url,
      "SkyCLAWkZodiacWheel",
      `popup=yes,width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no,location=no,status=no,resizable=yes,scrollbars=yes`
    );

    if (wheelWindow) {
      startSync();
      window.setTimeout(() => sendState(true), 250);
    }
    return wheelWindow;
  }

  function applyNatalFromWheel(message) {
    const date = message?.natal?.dateUTC ? new Date(message.natal.dateUTC) : null;
    if (!window.NatalChart) {
      window.NatalChart = { enabled: false, dateUTC: null, longitudes: null };
    }

    if (date instanceof Date && Number.isFinite(date.getTime())) {
      window.NatalChart.setDateUTC?.(date);
      window.NatalChart.dateUTC = date;
    }
    window.NatalChart.enabled = !!message?.natal?.enabled;
    window.natalLocationData = cloneLocation(message?.natal?.location);
    window.__natalDirty = (window.__natalDirty || 0) + 1;
    window.drawAstroWheel?.();
  }

  channel?.addEventListener("message", (event) => {
    const message = event.data;
    if (!message || typeof message !== "object") return;
    if (message.parentId && message.parentId !== parentId) return;

    if (message.type === "wheel:hello") {
      sendState(true);
    } else if (message.type === "wheel:navigate") {
      window.dispatchEvent(new CustomEvent("zy:navigateToDate", {
        detail: { dateUTC: message.dateUTC }
      }));
    } else if (message.type === "wheel:natal") {
      applyNatalFromWheel(message);
    }
  });

  document.getElementById("wheelPopoutBtn")?.addEventListener("click", openWheelPopout);
  document.getElementById("wheelPopoutBtn-small")?.addEventListener("click", openWheelPopout);
  window.openWheelPopout = openWheelPopout;

  // A surviving popout can reconnect after navigation between timeline routes.
  window.setTimeout(() => sendState(true), 500);
})();

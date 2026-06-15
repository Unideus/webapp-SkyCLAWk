(function () {
  const params = new URLSearchParams(window.location.search);
  const status = document.getElementById("planConnectionStatus");
  const summary = document.getElementById("planContextSummary");
  const emptyActions = document.getElementById("planEmptyActions");
  const connectedActions = document.getElementById("planConnectedActions");
  const zoneEl = document.getElementById("planZone");
  const sunSignEl = document.getElementById("planSunSign");
  const plantsEl = document.getElementById("planPlants");
  const startNewPlanBtn = document.getElementById("startNewPlanBtn");

  initPlantingOverlayToggle("plantingTransitsToggle", "wheelTransitsGrid");
  initPlantingOverlayToggle("plantingElementsToggle", "wheelElementalGrid");

  if (startNewPlanBtn) {
    startNewPlanBtn.href = buildPermaculturePlanUrl("new");
  }

  const planContext = {
    source: params.get("source"),
    projectId: params.get("projectId"),
    guildId: params.get("guildId"),
    zone: params.get("zone"),
    koppen: params.get("koppen"),
    sunSign: params.get("sunSign"),
    plants: params.get("plants")
  };

  const hasPlanContext = Object.values(planContext).some(Boolean);
  if (!hasPlanContext) return;

  if (status) status.textContent = "Food forest plan connected.";
  if (summary) summary.hidden = false;
  if (emptyActions) emptyActions.hidden = true;
  if (connectedActions) connectedActions.hidden = false;
  if (zoneEl) zoneEl.textContent = formatValue(planContext.zone || planContext.koppen || "--");
  if (sunSignEl) sunSignEl.textContent = formatValue(planContext.sunSign || "--");
  if (plantsEl) plantsEl.textContent = formatValue(planContext.plants || "--");

  function formatValue(value) {
    return String(value || "").split(",").map(part => part.trim()).filter(Boolean).join(", ");
  }

  function buildPermaculturePlanUrl(action) {
    const url = new URL(getPermacultureAppUrl());
    url.searchParams.set("source", "planting");
    url.searchParams.set("action", action);
    return url.toString();
  }

  function getPermacultureAppUrl() {
    const host = window.location.hostname;
    if (host === "localhost" || host === "127.0.0.1") {
      return "http://localhost:3000/";
    }
    return "http://permaculture.zodi-yugaskyclock.com/";
  }

  function initPlantingOverlayToggle(toggleId, gridId) {
    const toggle = document.getElementById(toggleId);
    const grid = document.getElementById(gridId);
    if (!toggle || !grid) return;
    const bodyClass = toggleId === "plantingTransitsToggle" ? "planting-transits-open" : "";

    function setExpanded(isExpanded) {
      toggle.setAttribute("aria-expanded", isExpanded ? "true" : "false");
      grid.hidden = !isExpanded;
      if (bodyClass) document.body.classList.toggle(bodyClass, isExpanded);
    }

    toggle.addEventListener("click", () => {
      setExpanded(toggle.getAttribute("aria-expanded") !== "true");
    });

    setExpanded(false);
  }

})();

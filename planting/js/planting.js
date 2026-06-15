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
  const guidanceModal = document.getElementById("plantingGuidanceModal");
  const guidanceClose = document.getElementById("plantingGuidanceClose");
  let lastGuidanceTrigger = null;

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
  window.plantingPlanContext = planContext;

  initPlantingGuidanceModal();

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

  function initPlantingGuidanceModal() {
    if (!guidanceModal) return;
    document.body.appendChild(guidanceModal);

    function closeGuidance() {
      guidanceModal.setAttribute("aria-hidden", "true");
      document.body.classList.remove("planting-guidance-open");
      if (lastGuidanceTrigger && typeof lastGuidanceTrigger.focus === "function") {
        lastGuidanceTrigger.focus();
      }
    }

    function setText(id, value) {
      const el = document.getElementById(id);
      if (el) el.textContent = value;
    }

    function formatDate(value) {
      const date = new Date(`${value}T12:00:00`);
      if (Number.isNaN(date.getTime())) return value;
      return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
    }

    function getLocationLabel() {
      const input = document.getElementById("locationBoxInput");
      return input?.value?.trim() || "Page location";
    }

    function getLunarNote() {
      const phase = document.getElementById("moonPhaseReadoutName")?.textContent?.trim();
      const advice = document.getElementById("moonPhaseReadoutAdvice")?.textContent?.trim();
      if (!phase && !advice) return "Lunar timing refines suitable dates but does not override weather or crop requirements.";
      return `${phase || "Current lunar phase"}: ${advice || "Use as a secondary timing preference after site conditions are suitable."}`;
    }

    function openGuidance(detail, trigger) {
      const laneLabel = detail.lane === "condition" ? "Condition" : "Recommended action";
      const climate = [planContext.zone ? `Zone ${planContext.zone}` : "", planContext.koppen || ""].filter(Boolean).join(" · ");
      const plants = formatValue(planContext.plants || "");
      const evidence = document.getElementById("plantingGuidanceEvidence");
      const swatch = document.getElementById("plantingGuidanceSwatch");

      lastGuidanceTrigger = trigger || document.activeElement;
      setText("plantingGuidanceKicker", laneLabel);
      setText("plantingGuidanceTitle", detail.label);
      setText("plantingGuidanceRange", `${formatDate(detail.startDate)} – ${formatDate(detail.endDate)}`);
      setText("plantingGuidanceLocation", getLocationLabel());
      setText("plantingGuidanceClimate", climate || "Location-based seasonal pattern");
      setText("plantingGuidanceConfidence", "Seasonal estimate");
      setText("plantingGuidanceLeadTitle", detail.lane === "condition" ? "Primary constraint" : "Highest-priority response");
      setText("plantingGuidanceReason", detail.reason || "This period is derived from location, season, and available plan context.");
      setText("plantingGuidancePlants", plants || "General garden guidance. Connect a Permaculture plan to identify affected plants.");
      setText("plantingGuidanceResponse", detail.response || "Check soil and local weather before acting.");
      setText("plantingGuidanceLunar", getLunarNote());

      if (swatch) {
        swatch.style.background = detail.color || "#22c55e";
        swatch.style.color = detail.color || "#22c55e";
      }
      if (evidence) {
        evidence.innerHTML = "";
        [
          `Selected page location: ${getLocationLabel()}`,
          climate ? `Connected climate context: ${climate}` : "Climate zone is not connected; using latitude and seasonal defaults.",
          plants ? `Plan crops: ${plants}` : "No crop list is connected yet.",
          "Live weather and soil observations are not yet included in this estimate."
        ].forEach(item => {
          const li = document.createElement("li");
          li.textContent = item;
          evidence.appendChild(li);
        });
      }

      guidanceModal.setAttribute("aria-hidden", "false");
      document.body.classList.add("planting-guidance-open");
      guidanceClose?.focus();
    }

    window.addEventListener("planting-guidance-open", event => {
      openGuidance(event.detail || {}, document.activeElement);
    });
    guidanceClose?.addEventListener("click", closeGuidance);
    guidanceModal.querySelectorAll("[data-planting-guidance-close]").forEach(el => {
      el.addEventListener("click", closeGuidance);
    });
    document.addEventListener("keydown", event => {
      if (event.key === "Escape" && guidanceModal.getAttribute("aria-hidden") === "false") closeGuidance();
    });
  }

})();

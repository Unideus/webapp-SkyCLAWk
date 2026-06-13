// Uranus-Neptune historical events.
// Verified historical conjunction windows in the current archive: 1821 and 1993.
(function attachUranusNeptuneHistory() {
  const events = window.HISTORICAL_EVENTS;
  if (!Array.isArray(events)) return;

  const source = "Local Uranus-Neptune conjunction timestamps";

  const existingIds = new Set([
    "missouri",
    "waco",
    "mosaic",
    "world_wide_web_free",
    "americorps",
    "don_t_ask_don_t_tell"
  ]);

  const mark = (event) => {
    event.uranusNeptune = true;
    event.astrologyMarker = "♅–♆";
    event.researchSource = source;
    return event;
  };

  events.forEach((event) => {
    if (existingIds.has(event.id)) mark(event);
  });
})();

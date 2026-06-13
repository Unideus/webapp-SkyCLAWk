// Uranus-Neptune historical events (to be populated from podcast research)
// Major conjunctions: 2022, 1989-90, 1954, 1918, 1882-83, etc.
(function attachUranusNeptuneHistory() {
  const events = window.HISTORICAL_EVENTS;
  if (!Array.isArray(events)) return;

  const source = "https://theastrologypodcast.com/";
  const podcast = ""; // TBA from research

  const existingIds = new Set([
    // TBA from podcast research
  ]);

  const mark = (event) => {
    event.uranusNeptune = true;
    event.astrologyMarker = "♅–♆";
    event.researchSource = source;
    if (podcast) event.researchPodcast = podcast;
    return event;
  };

  events.forEach((event) => {
    if (existingIds.has(event.id)) mark(event);
  });
})();

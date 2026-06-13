// Uranus-Pluto historical events (to be populated from podcast research)
// Major conjunctions: 2020s, 1980s, 1950s, 1910s, etc.
(function attachUranusPlutoHistory() {
  const events = window.HISTORICAL_EVENTS;
  if (!Array.isArray(events)) return;

  const source = "https://theastrologypodcast.com/";
  const podcast = ""; // TBA from research

  const existingIds = new Set([
    // TBA from podcast research
  ]);

  const mark = (event) => {
    event.uranusPluto = true;
    event.astrologyMarker = "♅–♇";
    event.researchSource = source;
    if (podcast) event.researchPodcast = podcast;
    return event;
  };

  events.forEach((event) => {
    if (existingIds.has(event.id)) mark(event);
  });
})();

// Neptune-Pluto historical events (to be populated from podcast research)
// Major conjunctions: 1891, 1850s, etc. (very long cycle ~13 years)
(function attachNeptunePlutoHistory() {
  const events = window.HISTORICAL_EVENTS;
  if (!Array.isArray(events)) return;

  const source = "https://theastrologypodcast.com/";
  const podcast = ""; // TBA from research

  const existingIds = new Set([
    // TBA from podcast research
  ]);

  const mark = (event) => {
    event.neptunePluto = true;
    event.astrologyMarker = "♆–♇";
    event.researchSource = source;
    if (podcast) event.researchPodcast = podcast;
    return event;
  };

  events.forEach((event) => {
    if (existingIds.has(event.id)) mark(event);
  });
})();

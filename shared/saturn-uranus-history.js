// Historical events highlighted around verified Saturn-Uranus conjunction windows.
(function attachSaturnUranusHistory() {
  const events = window.HISTORICAL_EVENTS;
  if (!Array.isArray(events)) return;

  const source = "https://en.wikipedia.org/wiki/Triple_conjunction";

  const existingIds = new Set([
    "uncle_toms_cabin",
    "foucault_sci",
    "moby_dick",
    "reservation_system",
    "radioactivity",
    "modern_olympics",
    "free_silver_econ",
    "diesel_engine",
    "curie_radium",
    "spanish_american_war",
    "american_imperialism",
    "stealth_bomber",
    "rap_explodes",
    "heat_wave_1988_dis",
    "veterans_affairs",
    "post_rural_free_delivery",
    "utah",
    "manhattan_project"
  ]);

  const mark = (event) => {
    event.saturnUranus = true;
    event.astrologyMarker = "♄–♅";
    event.researchSource = source;
    return event;
  };

  events.forEach((event) => {
    if (existingIds.has(event.id)) mark(event);
  });
})();

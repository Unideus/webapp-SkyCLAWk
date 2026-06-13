// Historical events highlighted around verified Saturn-Uranus conjunction windows.
// Conjunction years covered: 1848, 1881-82, 1915, 1952-53, 1988, 2024-25
(function attachSaturnUranusHistory() {
  const events = window.HISTORICAL_EVENTS;
  if (!Array.isArray(events)) return;

  const source = "https://en.wikipedia.org/wiki/Triple_conjunction";
  const podcast = "https://www.youtube.com/watch?v=9JJLgO7XGlw";

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

  const additions = [
    // 1952–1953 (Libra conjunction)
    { id: "hydrogen_bomb_1952", year: 1952, date: "1952-11-01", title: "First hydrogen bomb detonated", subtitle: "US tests the first thermonuclear device at Eniwetok Atoll", category: "science", wiki: "Ivy_Mike" },
    { id: "egyptian_revolution_1952", year: 1952, date: "1952-07-23", title: "Egyptian Revolution", subtitle: "Nasser and Naguib overthrow King Farouk", category: "politics", wiki: "1952_Egyptian_Revolution" },
    { id: "open_heart_surgery_1952", year: 1952, date: "1952-09-02", title: "First successful open-heart surgery", subtitle: "Lillehei and Lewis perform the procedure at University of Minnesota", category: "science", wiki: "Open_heart_surgery" },
    { id: "stalin_dies_1953", year: 1953, date: "1953-03-05", title: "Joseph Stalin dies", subtitle: "Death of the Soviet leader triggers power struggle", category: "politics", wiki: "Death_and_state_funeral_of_Joseph_Stalin" },
    { id: "korean_armistice_1953", year: 1953, date: "1953-07-27", title: "Korean War armistice signed", subtitle: "Fighting ends and the DMZ is established", category: "warfare", wiki: "Korean_Armistice_Agreement" },
    { id: "moncada_barracks_1953", year: 1953, date: "1953-07-26", title: "Castro raids Moncada Barracks", subtitle: "Failed attack marks the beginning of the Cuban Revolution", category: "politics", wiki: "Attack_on_the_Moncada_Barracks" },

    // 1988 (Sagittarius conjunction)
    { id: "law_on_cooperatives_1988", year: 1988, date: "1988-05-26", title: "Law on Cooperatives enacted", subtitle: "First private business ownership allowed in the USSR since the 1920s", category: "economics", wiki: "Law_on_Cooperatives" },
    { id: "geneva_accords_1988", year: 1988, date: "1988-04-14", title: "Geneva Accords signed", subtitle: "Soviet Union agrees to withdraw from Afghanistan", category: "warfare", wiki: "Geneva_Accords_(1988)" },
    { id: "nagorno_karabakh_1988", year: 1988, date: "1988-02", title: "Nagorno-Karabakh conflict begins", subtitle: "Resolution for unification with Armenia sparks ethnic violence", category: "politics", wiki: "Nagorno-Karabakh_conflict" },

    // 1881–1882 (Taurus conjunction)
    { id: "alexander_ii_assassinated", year: 1881, date: "1881-03-13", title: "Alexander II assassinated", subtitle: "Tsar killed by revolutionary group The People’s Will", category: "politics", wiki: "Assassination_of_Alexander_II_of_Russia" },
    { id: "russian_pogroms_1881", year: 1881, title: "Anti-Semitic pogroms sweep Russia", subtitle: "State-tolerated violence against Jews begins in 16 cities", category: "social", wiki: "Pogroms_in_the_Russian_Empire" },

    // 2024–2025 (Taurus triple conjunction)
    { id: "russia_ukraine_2022_onward", year: 2022, title: "Russia invades Ukraine", subtitle: "Full-scale war begins, triggering global energy and food crises", category: "warfare", wiki: "Russian_invasion_of_Ukraine" },
    { id: "israel_gaza_2023_onward", year: 2023, title: "Israel–Hamas war escalates", subtitle: "Major conflict in Gaza follows October 7 attacks", category: "warfare", wiki: "Gaza_war" },
    { id: "global_inflation_crisis_2022_2024", year: 2022, title: "Global inflation surge", subtitle: "Highest inflation in four decades hits developed economies", category: "economics", wiki: "2021%E2%80%932023_inflation_spike" }
  ];

  const mark = (event) => {
    event.saturnUranus = true;
    event.astrologyMarker = "♄–♅";
    event.researchSource = source;
    event.researchPodcast = podcast;
    return event;
  };

  events.forEach((event) => {
    if (existingIds.has(event.id)) mark(event);
  });

  const knownIds = new Set(events.map((event) => event.id));
  additions.forEach((event) => {
    if (!knownIds.has(event.id)) events.push(mark(event));
  });
})();

// Saturn-Pluto historical events (populated from research)
(function attachSaturnPlutoHistory() {
  const events = window.HISTORICAL_EVENTS;
  if (!Array.isArray(events)) return;

  const source = "https://en.wikipedia.org/wiki/Triple_conjunction";

  const existingIds = new Set([
    // TBA - add existing event IDs here if any
  ]);

  const additions = [
    // 2020 (Capricorn)
    { id: "covid19_pandemic_2020", year: 2020, date: "2020-01-12", title: "COVID-19 pandemic begins", subtitle: "Novel coronavirus confirmed in China; global lockdowns follow", category: "disaster", wiki: "COVID-19_pandemic" },
    { id: "global_recession_2020", year: 2020, title: "Global economic contraction", subtitle: "Pandemic triggers sharp worldwide downturn and supply chain collapse", category: "economics", wiki: "2020_stock_market_crash" },
    { id: "blm_protests_2020", year: 2020, title: "Black Lives Matter protests", subtitle: "Mass demonstrations and civil unrest sweep the United States", category: "social", wiki: "George_Floyd_protests" },

    // 1982–1983 (Libra)
    { id: "reagan_recession_1982", year: 1982, title: "Reagan Recession peaks", subtitle: "US unemployment reaches 10.8%, highest since the Great Depression", category: "economics", wiki: "Early_1980s_recession" },
    { id: "hiv_aids_crisis_1981", year: 1981, title: "HIV/AIDS crisis emerges", subtitle: "Mysterious new disease begins devastating communities worldwide", category: "disaster", wiki: "HIV/AIDS" },
    { id: "tcp_ip_1983", year: 1983, date: "1983-01-01", title: "TCP/IP protocol adopted", subtitle: "Birth of the modern internet as researchers link networks globally", category: "technology", wiki: "Internet" },
    { id: "able_archer_1983", year: 1983, title: "Able Archer 83 nuclear scare", subtitle: "US and USSR come dangerously close to nuclear war during exercises", category: "warfare", wiki: "Able_Archer_83" },

    // 1947 (Leo)
    { id: "cold_war_begins_1947", year: 1947, title: "Cold War begins", subtitle: "Geopolitical tensions between US and USSR solidify after WWII", category: "politics", wiki: "Cold_War" },
    { id: "india_pakistan_independence_1947", year: 1947, date: "1947-08-15", title: "India and Pakistan gain independence", subtitle: "Partition triggers mass displacement and communal violence", category: "empire", wiki: "Partition_of_India" },
    { id: "marshall_plan_1947", year: 1947, title: "Marshall Plan proposed", subtitle: "US offers massive aid to rebuild Europe; USSR rejects it", category: "politics", wiki: "Marshall_Plan" },
    { id: "cia_created_1947", year: 1947, date: "1947-07-26", title: "US National Security Act signed", subtitle: "Creates CIA, Department of Defense, and National Security Council", category: "government", wiki: "National_Security_Act_of_1947" },

    // 1914 (Cancer)
    { id: "world_war_one_1914", year: 1914, date: "1914-07-28", title: "World War I begins", subtitle: "Austria-Hungary invades Serbia; global conflict erupts", category: "warfare", wiki: "World_War_I" },

    // 1881–1882 (Taurus)
    { id: "scramble_for_africa_1880s", year: 1881, title: "Scramble for Africa intensifies", subtitle: "European powers race to colonize the continent for resources", category: "empire", wiki: "Scramble_for_Africa" }
  ];

  const mark = (event) => {
    event.saturnPluto = true;
    event.astrologyMarker = "♄–♇";
    event.researchSource = source;
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

// Robust applicator – waits for HISTORICAL_EVENTS if necessary
function applySaturnPlutoMarkers() {
  if (!window.HISTORICAL_EVENTS || !Array.isArray(window.HISTORICAL_EVENTS)) {
    setTimeout(applySaturnPlutoMarkers, 30);
    return;
  }

  const events = window.HISTORICAL_EVENTS;
  const source = "https://en.wikipedia.org/wiki/Triple_conjunction";

  const existingIds = new Set([ /* add known IDs here if needed */ ]);

  const additions = [ /* the additions array is already in the file above */ ];

  // Re-run the marking logic on current events
  const mark = (event) => {
    event.saturnPluto = true;
    event.astrologyMarker = "♄–♇";
    event.researchSource = source;
    return event;
  };

  events.forEach((event) => {
    if (existingIds.has(event.id)) mark(event);
  });

  const knownIds = new Set(events.map((event) => event.id));
  additions.forEach((event) => {
    if (!knownIds.has(event.id)) {
      events.push(mark(event));
    }
  });

  if (typeof window.dispatchEvent === "function") {
    window.dispatchEvent(new CustomEvent("history:updated"));
  }
}

applySaturnPlutoMarkers();

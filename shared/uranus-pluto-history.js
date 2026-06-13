// Uranus-Pluto historical events (populated from research)
// Major conjunction windows: 1736-37, 1850-51, 1965-66, 2020
(function attachUranusPlutoHistory() {
  const events = window.HISTORICAL_EVENTS;
  if (!Array.isArray(events)) return;

  const source = "https://en.wikipedia.org/wiki/Triple_conjunction";

  const existingIds = new Set([
    // TBA
  ]);

  const additions = [
    // 1965–1966
    { id: "voting_rights_act_1965", year: 1965, date: "1965-08-06", title: "Voting Rights Act signed", subtitle: "Landmark US legislation outlaws literacy tests for voting", category: "government", wiki: "Voting_Rights_Act_of_1965" },
    { id: "watts_riots_1965", year: 1965, title: "Watts Riots", subtitle: "Major racial unrest in Los Angeles; 34 dead", category: "social", wiki: "Watts_riots" },
    { id: "computer_revolution_1960s", year: 1965, title: "Computer revolution begins", subtitle: "Microchips, BASIC language, and IBM disk storage emerge", category: "technology", wiki: "History_of_computing_hardware" },
    { id: "now_founded_1966", year: 1966, title: "National Organization for Women founded", subtitle: "NOW established to combat workplace discrimination", category: "social", wiki: "National_Organization_for_Women" },
    { id: "cultural_revolution_1966", year: 1966, title: "Chinese Cultural Revolution begins", subtitle: "Mao launches radical social and political restructuring", category: "politics", wiki: "Cultural_Revolution" },
    { id: "vietnam_war_escalation_1965", year: 1965, title: "Vietnam War escalates", subtitle: "US bombing of North Vietnam begins; anti-war movement surges", category: "warfare", wiki: "Vietnam_War" },

    // 1850–1851
    { id: "serfdom_abolished_1850", year: 1850, title: "Serfdom abolished in Austria and Prussia", subtitle: "Major improvement in legal status of peasantry", category: "social", wiki: "Serfdom" },
    { id: "industrial_expansion_1850s", year: 1850, title: "Industrial expansion accelerates", subtitle: "Cotton gin, electric generators, and mass production scale up", category: "technology", wiki: "Industrial_Revolution" },
    { id: "napoleon_iii_coup_1851", year: 1851, title: "Louis Napoléon launches coup", subtitle: "Becomes Emperor Napoleon III the following year", category: "politics", wiki: "French_coup_d%27%C3%A9tat_of_1851" },

    // 1736–1737
    { id: "afsharid_dynasty_1736", year: 1736, title: "Afsharid Dynasty established", subtitle: "Nader Shah crowned Shah of Persia after Ottoman-Persian War", category: "politics", wiki: "Nader_Shah" },
    { id: "ottoman_persian_war_1730", year: 1730, title: "Ottoman–Persian War (1730–1735)", subtitle: "Major regional conflict in the Caucasus", category: "warfare", wiki: "Ottoman%E2%80%93Persian_War_(1730%E2%80%931735)" },

    // 2020
    { id: "covid19_pandemic_2020", year: 2020, date: "2020-01-12", title: "COVID-19 pandemic begins", subtitle: "Novel coronavirus confirmed in China; global lockdowns follow", category: "disaster", wiki: "COVID-19_pandemic" },
    { id: "populism_rise_2016_2020", year: 2016, title: "Anti-establishment populism surges", subtitle: "Brexit referendum and Trump presidency challenge liberal order", category: "politics", wiki: "Populism" }
  ];

  const mark = (event) => {
    event.uranusPluto = true;
    event.astrologyMarker = "♅–♇";
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

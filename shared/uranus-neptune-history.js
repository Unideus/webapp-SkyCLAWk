// Uranus-Neptune historical events (populated from research)
// Major conjunction windows: 1882-83, 1918-19, 1954-55, 1989-90, 2022
(function attachUranusNeptuneHistory() {
  const events = window.HISTORICAL_EVENTS;
  if (!Array.isArray(events)) return;

  const source = "https://en.wikipedia.org/wiki/Triple_conjunction";

  const existingIds = new Set([
    // TBA
  ]);

  const additions = [
    // 1989–1990
    { id: "berlin_wall_falls_1989", year: 1989, date: "1989-11-09", title: "Berlin Wall falls", subtitle: "East Germany opens the border; reunification follows", category: "politics", wiki: "Fall_of_the_Berlin_Wall" },
    { id: "mandela_released_1990", year: 1990, date: "1990-02-11", title: "Nelson Mandela released", subtitle: "Mandela leaves prison as apartheid begins to dissolve", category: "social", wiki: "Nelson_Mandela" },
    { id: "tiananmen_square_1989", year: 1989, title: "Tiananmen Square protests", subtitle: "Pro-democracy demonstrations in China are suppressed", category: "politics", wiki: "1989_Tiananmen_Square_protests" },
    { id: "perestroika_1980s", year: 1985, title: "Perestroika begins in the USSR", subtitle: "Mikhail Gorbachev launches major political and economic restructuring", category: "politics", wiki: "Perestroika" },

    // 1954–1955
    { id: "korean_war_armistice_1953", year: 1953, date: "1953-07-27", title: "Korean War armistice signed", subtitle: "Fighting ends and the DMZ is established", category: "warfare", wiki: "Korean_Armistice_Agreement" },
    { id: "elvis_presley_1954", year: 1954, title: "Elvis Presley rises to fame", subtitle: "Rock 'n' roll explodes into mainstream culture", category: "culture", wiki: "Elvis_Presley" },
    { id: "nuclear_power_1950s", year: 1954, title: "Nuclear power age begins", subtitle: "First commercial nuclear power plants come online", category: "technology", wiki: "Nuclear_power" },
    { id: "colonial_empires_fall_1950s", year: 1954, title: "Colonial empires collapse", subtitle: "Independence movements sweep Africa and Asia", category: "empire", wiki: "Decolonisation_of_Africa" },

    // 1918–1919
    { id: "wwi_ends_1918", year: 1918, date: "1918-11-11", title: "World War I ends", subtitle: "Armistice signed; traditional empires collapse", category: "warfare", wiki: "Armistice_of_11_November_1918" },
    { id: "russian_revolution_1917", year: 1917, title: "Russian Revolution", subtitle: "Bolsheviks seize power and form the Soviet Union", category: "politics", wiki: "Russian_Revolution" },

    // 1882–1883
    { id: "scramble_for_africa_1880s", year: 1881, title: "Scramble for Africa intensifies", subtitle: "European powers race to colonize the continent", category: "empire", wiki: "Scramble_for_Africa" },
    { id: "nietzsche_zarathustra_1883", year: 1883, title: "Nietzsche publishes Thus Spoke Zarathustra", subtitle: "\"God is dead\" and the rise of nihilism", category: "culture", wiki: "Thus_Spoke_Zarathustra" },
    { id: "electricity_revolution_1880s", year: 1882, title: "Electricity revolution accelerates", subtitle: "Major advances in electrical systems and power distribution", category: "technology", wiki: "History_of_electric_power_transmission" }
  ];

  const mark = (event) => {
    event.uranusNeptune = true;
    event.astrologyMarker = "♅–♆";
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

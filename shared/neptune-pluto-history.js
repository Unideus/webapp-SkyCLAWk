// Neptune-Pluto historical events (populated from research)
// Major conjunction windows: 578-579, 1398-1399, 1891-1892
(function attachNeptunePlutoHistory() {
  const events = window.HISTORICAL_EVENTS;
  if (!Array.isArray(events)) return;

  const source = "https://en.wikipedia.org/wiki/Triple_conjunction";

  const existingIds = new Set([
    // TBA
  ]);

  const additions = [
    // 1891–1892
    { id: "chilean_civil_war_1891", year: 1891, title: "Chilean Civil War", subtitle: "Congressional forces defeat President Balmaceda; Parliamentary Era begins", category: "politics", wiki: "Chilean_Civil_War_of_1891" },
    { id: "general_electric_1892", year: 1892, title: "General Electric founded", subtitle: "Major multinational conglomerate established", category: "economics", wiki: "General_Electric" },
    { id: "coca_cola_1892", year: 1892, title: "Coca-Cola founded", subtitle: "Iconic global brand launched", category: "economics", wiki: "Coca-Cola" },
    { id: "motion_picture_1890s", year: 1891, title: "Motion picture camera invented", subtitle: "Early film technology emerges", category: "technology", wiki: "History_of_film" },
    { id: "freud_psychoanalysis_1890s", year: 1891, title: "Freud begins developing psychoanalysis", subtitle: "New discipline transforms understanding of the unconscious", category: "science", wiki: "Psychoanalysis" },
    { id: "x_rays_1895", year: 1895, title: "X-rays discovered", subtitle: "Wilhelm Röntgen discovers X-rays", category: "science", wiki: "X-ray" },
    { id: "houdini_1891", year: 1891, title: "Harry Houdini begins career", subtitle: "Master escape artist starts performing", category: "culture", wiki: "Harry_Houdini" },

    // 1398–1399
    { id: "sack_of_delhi_1398", year: 1398, date: "1398-12-17", title: "Sack of Delhi by Timur", subtitle: "Timur defeats the Sultan of Delhi; city sacked", category: "warfare", wiki: "Sack_of_Delhi_(1398)" },
    { id: "renaissance_begins_1398", year: 1398, title: "European Renaissance begins", subtitle: "Massive cultural and intellectual shift starts", category: "culture", wiki: "Renaissance" },
    { id: "great_schism_1378", year: 1378, title: "Great Schism in the Catholic Church", subtitle: "Rival popes divide the Church (1378–1417)", category: "religion", wiki: "Western_Schism" },
    { id: "ming_dynasty_1368", year: 1368, title: "Ming Dynasty modernizes China", subtitle: "New dynasty brings major reforms and exploration", category: "politics", wiki: "Ming_dynasty" },
    { id: "henry_navigator_1394", year: 1394, title: "Prince Henry the Navigator begins explorations", subtitle: "Portuguese maritime expansion starts", category: "empire", wiki: "Prince_Henry_the_Navigator" },

    // 578–579
    { id: "axial_age_578bce", year: -578, title: "Peak of the Axial Age", subtitle: "Pythagoras, Buddha, Lao Tzu, Confucius, and Jeremiah transform philosophy", category: "culture", wiki: "Axial_Age" },
    { id: "tiberius_ii_578", year: 578, date: "578-10-05", title: "Tiberius II Constantine becomes Byzantine Emperor", subtitle: "Reign marked by heavy military spending against Persians and Avars", category: "politics", wiki: "Tiberius_II_Constantine" },
    { id: "yang_jian_578", year: 578, title: "Yang Jian rises to power in China", subtitle: "Future founder of the Sui Dynasty gains influence", category: "politics", wiki: "Emperor_Wen_of_Sui" }
  ];

  const mark = (event) => {
    event.neptunePluto = true;
    event.astrologyMarker = "♆–♇";
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

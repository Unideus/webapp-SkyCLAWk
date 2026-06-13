// Historical events highlighted in The Astrology Podcast episode 483.
(function attachSaturnNeptuneHistory() {
  const events = window.HISTORICAL_EVENTS;
  if (!Array.isArray(events)) return;

  const source = "https://theastrologypodcast.com/2025/03/25/saturn-neptune-conjunctions-in-history/";
  const podcast = "https://www.youtube.com/watch?v=eCLto1i-Cxk";
  const transcript = "https://theastrologypodcast.com/transcripts/tap-ep-483-transcript-saturn-neptune-conjunctions-in-history/";

  const existingIds = new Set([
    "black_monday_1987", "aids_activism", "tiananmen", "world_wide_web",
    "exxon_valdez", "gulf_war", "cold_war_end", "moscow_coup",
    "nsa_founded", "dna_structure", "korean_armistice", "hydrogen_bomb",
    "brown_v_board", "mk_ultra", "rock_and_roll",
    "sarajevo", "trench_warfare", "us_enters_wwi", "armistice_1918",
    "treaty_versailles", "spanish_flu", "league_of_nations", "woman_suffrage", "palmer_raids",
    "einstein_general_relativity", "dada_surrealism", "great_migration_begins",
    "pendleton_act", "chinese_exclusion_act", "electrification",
    "krakatoa", "brooklyn_bridge", "nietzsche_god_is_dead",
    "first_anesthesia", "irish_famine", "communist_manifesto_econ", "seneca_falls",
    "forty_niners", "treaty_guadalupe_hidalgo",
    "oregon_treaty", "corn_laws_econ", "smithsonian", "manifest_destiny",
    "harriet_tubman", "international_slave_trade_end",
    "dalton_atomic", "steamboat", "gas_lighting_tech", "beethoven_5th",
    "boston_tea_party", "intolerable_acts", "continental_congress", "lexington",
    "bunker_hill", "priestley_oxygen", "lavoisier_oxygen", "abolition_movement_social",
    "mass_bay"
  ]);

  const additions = [
    { id: "sn_berlin_wall_falls", year: 1989, date: "1989-11-09", title: "Berlin Wall falls", subtitle: "East Germany opens the border; reunification follows", category: "politics", wiki: "Fall_of_the_Berlin_Wall" },
    { id: "sn_eastern_bloc_revolutions", year: 1989, title: "Revolutions of 1989", subtitle: "Communist governments collapse across Eastern Europe", category: "politics", wiki: "Revolutions_of_1989" },
    { id: "sn_panama_invasion", year: 1989, date: "1989-12-20", title: "US invasion of Panama", subtitle: "Operation Just Cause removes Manuel Noriega", category: "warfare", wiki: "United_States_invasion_of_Panama" },
    { id: "sn_mandela_released", year: 1990, date: "1990-02-11", title: "Nelson Mandela released", subtitle: "Mandela leaves prison as apartheid begins to dissolve", category: "social", wiki: "Nelson_Mandela" },
    { id: "sn_german_reunification", year: 1990, date: "1990-10-03", title: "German reunification", subtitle: "East and West Germany reunite", category: "politics", wiki: "German_reunification" },
    { id: "sn_soviet_dissolution", year: 1991, date: "1991-12-26", title: "Soviet Union dissolves", subtitle: "The USSR formally ceases to exist", category: "politics", wiki: "Dissolution_of_the_Soviet_Union" },
    { id: "sn_stalin_dies", year: 1953, date: "1953-03-05", title: "Stalin dies", subtitle: "A major Soviet succession and political turning point", category: "politics", wiki: "Death_and_state_funeral_of_Joseph_Stalin" },
    { id: "sn_iran_coup", year: 1953, date: "1953-08-19", title: "Iranian coup d'etat", subtitle: "US- and UK-backed coup removes Mohammad Mosaddegh", category: "psyops", wiki: "1953_Iranian_coup_d%27état" },
    { id: "sn_rosenbergs_executed", year: 1953, date: "1953-06-19", title: "Rosenbergs executed", subtitle: "Cold War espionage case culminates in execution", category: "psyops", wiki: "Julius_and_Ethel_Rosenberg" },
    { id: "sn_queen_coronation", year: 1953, date: "1953-06-02", title: "Elizabeth II coronation televised", subtitle: "Global television audience witnesses the coronation", category: "culture", wiki: "Coronation_of_Elizabeth_II" },
    { id: "sn_everest_ascent", year: 1953, date: "1953-05-29", title: "First ascent of Mount Everest", subtitle: "Hillary and Norgay reach the summit", category: "science", wiki: "1953_British_Mount_Everest_expedition" },
    { id: "sn_scientology_founded", year: 1953, title: "Church of Scientology founded", subtitle: "A new religious institution emerges in the United States", category: "culture", wiki: "Church_of_Scientology" },
    { id: "sn_russian_revolution", year: 1917, title: "Russian Revolution", subtitle: "Imperial rule collapses and the Bolsheviks seize power", category: "politics", wiki: "Russian_Revolution" },
    { id: "sn_easter_rising", year: 1916, date: "1916-04-24", title: "Easter Rising", subtitle: "Irish republicans launch an insurrection against British rule", category: "warfare", wiki: "Easter_Rising" },
    { id: "sn_zimmermann_telegram", year: 1917, date: "1917-01-16", title: "Zimmermann Telegram", subtitle: "Secret German proposal helps bring the US into World War I", category: "psyops", wiki: "Zimmermann_Telegram" },
    { id: "sn_chemical_warfare", year: 1915, date: "1915-04-22", title: "Large-scale chemical warfare", subtitle: "Chlorine gas is deployed at the Second Battle of Ypres", category: "warfare", wiki: "Chemical_weapons_in_World_War_I" },
    { id: "sn_canon_law", year: 1917, date: "1917-05-27", title: "Code of Canon Law promulgated", subtitle: "Catholic canon law is comprehensively codified", category: "government", wiki: "1917_Code_of_Canon_Law" },
    { id: "sn_alexander_ii_assassinated", year: 1881, date: "1881-03-13", title: "Alexander II assassinated", subtitle: "Russian emperor killed by revolutionary conspirators", category: "politics", wiki: "Assassination_of_Alexander_II_of_Russia" },
    { id: "sn_triple_alliance", year: 1882, date: "1882-05-20", title: "Triple Alliance formed", subtitle: "Germany, Austria-Hungary, and Italy form a defensive pact", category: "warfare", wiki: "Triple_Alliance_(1882)" },
    { id: "sn_standard_oil_trust", year: 1882, date: "1882-01-02", title: "Standard Oil Trust formed", subtitle: "Rockefeller consolidates an oil monopoly", category: "economics", wiki: "Standard_Oil" },
    { id: "sn_married_womens_property", year: 1882, title: "Married Women's Property Act", subtitle: "British married women gain control of their property", category: "social", wiki: "Married_Women%27s_Property_Act_1882" },
    { id: "sn_psychical_research", year: 1882, date: "1882-02-20", title: "Society for Psychical Research founded", subtitle: "Scientific investigation of paranormal claims is organized", category: "science", wiki: "Society_for_Psychical_Research" },
    { id: "sn_paris_convention", year: 1883, date: "1883-03-20", title: "Paris Convention signed", subtitle: "International industrial-property and patent protection established", category: "government", wiki: "Paris_Convention_for_the_Protection_of_Industrial_Property" },
    { id: "sn_standard_time", year: 1883, date: "1883-11-18", title: "Standard time zones adopted", subtitle: "North American railroads establish standardized time", category: "technology", wiki: "Standard_time" },
    { id: "sn_neptune_discovered", year: 1846, date: "1846-09-23", title: "Neptune discovered", subtitle: "The planet is observed near its mathematically predicted position", category: "science", wiki: "Discovery_of_Neptune" },
    { id: "sn_mexican_american_war", year: 1846, title: "Mexican-American War", subtitle: "War redraws the boundary between Mexico and the United States", category: "warfare", wiki: "Mexican–American_War" },
    { id: "sn_revolutions_1848", year: 1848, title: "Revolutions of 1848", subtitle: "A wave of political and national revolutions crosses Europe", category: "politics", wiki: "Revolutions_of_1848" },
    { id: "sn_liberia_independence", year: 1847, date: "1847-07-26", title: "Liberia declares independence", subtitle: "The republic is established by formerly enslaved settlers", category: "empire", wiki: "Liberian_Declaration_of_Independence" },
    { id: "sn_mormon_salt_lake", year: 1847, date: "1847-07-24", title: "Mormon pioneers reach Salt Lake", subtitle: "Brigham Young's party establishes a new religious center", category: "culture", wiki: "Mormon_pioneers" },
    { id: "sn_peninsular_war", year: 1808, title: "Peninsular War begins", subtitle: "Napoleonic occupation triggers resistance in Iberia", category: "warfare", wiki: "Peninsular_War" },
    { id: "sn_spanish_american_revolutions", year: 1810, title: "Spanish American wars of independence", subtitle: "Independence movements spread across Spain's American colonies", category: "empire", wiki: "Spanish_American_wars_of_independence" },
    { id: "sn_pugachev_rebellion", year: 1773, title: "Pugachev's Rebellion", subtitle: "A major Cossack and peasant uprising begins in Russia", category: "warfare", wiki: "Pugachev%27s_Rebellion" },
    { id: "sn_partition_poland", year: 1772, date: "1772-08-05", title: "First Partition of Poland", subtitle: "Russia, Prussia, and Austria divide Polish-Lithuanian territory", category: "empire", wiki: "First_Partition_of_Poland" },
    { id: "sn_black_death", year: 1346, title: "Black Death begins spreading west", subtitle: "The most lethal recorded plague pandemic reaches Europe and Asia", category: "disaster", wiki: "Black_Death" },
    { id: "sn_malleus", year: 1486, title: "Malleus Maleficarum published", subtitle: "Influential witch-hunting treatise intensifies religious persecution", category: "culture", wiki: "Malleus_Maleficarum" },
    { id: "sn_luther_new_testament", year: 1522, title: "Luther's German New Testament", subtitle: "Vernacular translation breaks a major language barrier", category: "culture", wiki: "Luther_Bible" },
    { id: "sn_great_plague_london", year: 1665, title: "Great Plague of London", subtitle: "A major bubonic plague outbreak strikes London", category: "disaster", wiki: "Great_Plague_of_London" },
    { id: "sn_sunni_shia_divide", year: 661, title: "Assassination of Ali", subtitle: "Succession crisis deepens the historic Sunni-Shia division", category: "culture", wiki: "Assassination_of_Ali" },
    { id: "sn_notre_dame_begins", year: 1163, title: "Notre-Dame construction begins", subtitle: "Construction begins on the cathedral in Paris", category: "technology", wiki: "Notre-Dame_de_Paris" },
    { id: "sn_charlemagne_king", year: 768, title: "Charlemagne becomes king", subtitle: "Charlemagne begins the reign that reshapes western Europe", category: "empire", wiki: "Charlemagne" }
  ];

  const mark = (event) => {
    event.saturnNeptune = true;
    event.astrologyMarker = "♄–♆";
    event.researchSource = source;
    event.researchPodcast = podcast;
    event.researchTranscript = transcript;
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

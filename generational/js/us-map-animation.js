(function() {
  "use strict";

  let CANVAS_W = 700;
  let CANVAS_H = 485;
  function setDefaultSize() {
    CANVAS_W = Math.min(980, Math.floor(window.innerWidth * 0.7));
    CANVAS_H = Math.round(CANVAS_W / 1.444);
  }
  const MARGIN = 20;

  let canvas = null, ctx = null, container = null;
  let active = false, rafId = null;
  let dragging = false, dragOffX = 0, dragOffY = 0;
  let resizing = false, resizeStartW = 0, resizeStartH = 0, resizeStartX = 0, resizeStartY = 0;
  let showLegend = true;
  let lastYear = -9999;

  const LON_MIN = -125, LON_MAX = -66, LAT_MIN = 24, LAT_MAX = 50;
  let projectedStates = [];

  function lonToX(lon) { return MARGIN + (lon - LON_MIN) / (LON_MAX - LON_MIN) * (CANVAS_W - MARGIN * 2); }
  function latToY(lat) { return MARGIN + (CANVAS_H - MARGIN * 2) - (lat - LAT_MIN) / (LAT_MAX - LAT_MIN) * (CANVAS_H - MARGIN * 2); }
  function projectCoords(coords) { return coords.map(function(p){ return [lonToX(p[0]), latToY(p[1])]; }); }
  function project() {
    projectedStates = US_STATES.map(function(st){
      var polys = st.polygons.map(projectCoords);
      var a = STATE_ADMISSIONS[st.name];
      return { name:st.name, abbr:st.abbr, polygons:polys, admitted:a?a.admitted:0, faction:a?a.faction:"territory" };
    });
  }

  // === COLONIAL TERRITORY ASSIGNMENTS (pre-admission) ===
  // Before each state's admission, it belonged to a colonial power
  // Key: state name -> {until: year, power: "british"|"french"|"spanish"|"mexican"}
  // Power assigned by the dominant European claim before US annexation
  var COLONIAL_POWER = {
    "Alabama":"spanish","Arizona":"mexican","Arkansas":"french","California":"mexican",
    "Colorado":"mexican","Connecticut":"british","Delaware":"british","Florida":"spanish",
    "Georgia":"british","Idaho":"british","Illinois":"french","Indiana":"french","Iowa":"french",
    "Kansas":"french","Kentucky":"british","Louisiana":"french","Maine":"british",
    "Maryland":"british","Massachusetts":"british","Michigan":"french","Minnesota":"french",
    "Mississippi":"french","Missouri":"french","Montana":"british","Nebraska":"french",
    "Nevada":"mexican","New Hampshire":"british","New Jersey":"british","New Mexico":"mexican",
    "New York":"british","North Carolina":"british","North Dakota":"british","Ohio":"french",
    "Oklahoma":"french","Oregon":"british","Pennsylvania":"british","Rhode Island":"british",
    "South Carolina":"british","South Dakota":"british","Tennessee":"british","Texas":"mexican",
    "Utah":"mexican","Vermont":"british","Virginia":"british","Washington":"british",
    "West Virginia":"british","Wisconsin":"french","Wyoming":"british"
  };

  // Year each colonial power's claim effectively ended for each region
  // british -> 1776 (Declaration) / 1783 (Treaty of Paris)
  // spanish -> 1819 (Adams-Onis) / 1821 (Mexican independence)
  // french -> 1803 (Louisiana Purchase)
  // mexican -> 1848 (Treaty of Guadalupe Hidalgo)
  var COLONIAL_UNTIL = {
    british: Date.parse("1776-07-04T00:00:00Z"),
    french: Date.parse("1803-12-20T00:00:00Z"),
    spanish: Date.parse("1819-02-22T00:00:00Z"),
    mexican: Date.parse("1848-02-02T00:00:00Z")
  };

  // 13 original colonies + their founding
  var COLONIES = {
    "Virginia":1607,"Massachusetts":1620,"New Hampshire":1623,"New York":1624,
    "Connecticut":1636,"Maryland":1634,"Rhode Island":1636,"Delaware":1638,
    "Pennsylvania":1682,"New Jersey":1664,"North Carolina":1653,"South Carolina":1663,
    "Georgia":1732
  };

  var COLONY_COLORS = {
    british:   {fill:"rgba(60, 90, 160, 0.4)", stroke:"rgba(80, 120, 200, 0.5)"},
    french:    {fill:"rgba(40, 80, 140, 0.4)", stroke:"rgba(60, 110, 180, 0.5)"},
    spanish:   {fill:"rgba(140, 100, 60, 0.4)", stroke:"rgba(180, 140, 80, 0.5)"},
    mexican:   {fill:"rgba(100, 140, 60, 0.4)", stroke:"rgba(140, 180, 80, 0.5)"}
  };

  // === HISTORICAL TOWNS ===
  var HISTORIC_TOWNS = [
    {name:"St. Augustine", lon:-81.3, lat:29.9, founded:1565, type:"settlement"},
    {name:"Roanoke Colony", lon:-75.7, lat:35.9, founded:1585, type:"settlement"},
    {name:"Jamestown", lon:-76.8, lat:37.2, founded:1607, type:"settlement"},
    {name:"Quebec", lon:-71.2, lat:46.8, founded:1608, type:"settlement"},
    {name:"Santa Fe", lon:-105.9, lat:35.7, founded:1610, type:"settlement"},
    {name:"Plymouth", lon:-70.7, lat:41.9, founded:1620, type:"settlement"},
    {name:"New Amsterdam", lon:-74.0, lat:40.7, founded:1624, type:"city"},
    {name:"Boston", lon:-71.1, lat:42.4, founded:1630, type:"city"},
    {name:"Williamsburg", lon:-76.7, lat:37.3, founded:1632, type:"city"},
    {name:"Philadelphia", lon:-75.2, lat:39.9, founded:1682, type:"city"},
    {name:"Charleston", lon:-79.9, lat:32.8, founded:1670, type:"city"},
    {name:"New Orleans", lon:-90.1, lat:29.9, founded:1718, type:"city"},
    {name:"San Antonio", lon:-98.5, lat:29.4, founded:1718, type:"mission"},
    {name:"San Diego", lon:-117.2, lat:32.7, founded:1769, type:"mission"},
    {name:"San Francisco", lon:-122.4, lat:37.8, founded:1776, type:"mission"},
    {name:"Nashville", lon:-86.8, lat:36.2, founded:1779, type:"city"},
    {name:"St. Louis", lon:-90.2, lat:38.6, founded:1764, type:"city"},
    {name:"Pittsburgh", lon:-80.0, lat:40.4, founded:1758, type:"city"},
    {name:"Detroit", lon:-83.0, lat:42.3, founded:1701, type:"city"},
    {name:"Savannah", lon:-81.1, lat:32.1, founded:1733, type:"city"},
    {name:"Portland", lon:-122.7, lat:45.5, founded:1845, type:"city"},
    {name:"Salt Lake City", lon:-111.9, lat:40.8, founded:1847, type:"city"},
    {name:"Denver", lon:-104.9, lat:39.7, founded:1858, type:"city"},
    {name:"Seattle", lon:-122.3, lat:47.6, founded:1851, type:"city"},
    {name:"Los Angeles", lon:-118.2, lat:34.0, founded:1781, type:"city"},
    {name:"Chicago", lon:-87.6, lat:41.9, founded:1833, type:"city"},
    {name:"Richmond", lon:-77.5, lat:37.5, founded:1737, type:"city"},
    {name:"Atlanta", lon:-84.4, lat:33.7, founded:1837, type:"city"},
    {name:"Houston", lon:-95.4, lat:29.8, founded:1836, type:"city"},
    {name:"Dallas", lon:-96.8, lat:32.8, founded:1841, type:"city"},
    {name:"Cincinnati", lon:-84.5, lat:39.1, founded:1788, type:"city"},
    {name:"Indianapolis", lon:-86.2, lat:39.8, founded:1821, type:"city"},
    {name:"Cleveland", lon:-81.7, lat:41.5, founded:1796, type:"city"},
    {name:"Montreal", lon:-73.6, lat:45.5, founded:1642, type:"city"},
    {name:"Halifax", lon:-63.6, lat:44.6, founded:1749, type:"city"},
    {name:"Vancouver", lon:-123.1, lat:49.3, founded:1886, type:"city"},
    // Western forts / fur trade posts
    {name:"Fort Vancouver", lon:-122.7, lat:45.6, founded:1825, type:"settlement"},
    {name:"Bent's Fort", lon:-103.4, lat:38.0, founded:1833, type:"settlement"},
    {name:"Fort Laramie", lon:-104.6, lat:42.2, founded:1834, type:"settlement"},
    {name:"Sutter's Fort", lon:-121.5, lat:38.6, founded:1839, type:"settlement"}
  ];

  var TOWN_DOT_COLORS = { settlement:"#ffd700", mission:"#ff9944", city:"#6ab0ff" };
  var TOWN_FONT_SIZES = { settlement:10, mission:9, city:8 };

  // === ROUTE HELPERS ===
  function routeProgress(route, dateMs) {
    var year = dateMs / 31557600000 + 1970;
    if (year < route.startYear) return 0;
    if (year >= route.endYear) return 1;
    return (dateMs - route.startYear * 31557600000) / ((route.endYear - route.startYear) * 31557600000);
  }

  // === COLORS ===
  var FACTION_FILL = { original:"rgba(60, 100, 200, 0.55)", confed:"rgba(200, 60, 60, 0.55)", border:"rgba(160, 140, 60, 0.55)", territory:"rgba(60, 70, 90, 0.35)" };
  var FACTION_STROKE = { original:"rgba(100, 150, 255, 0.8)", confed:"rgba(255, 100, 100, 0.8)", border:"rgba(200, 180, 80, 0.8)", territory:"rgba(100, 110, 130, 0.5)" };
  var LINE_COLORS = { trail:"rgba(200, 160, 80, 0.7)", railroad:"rgba(120, 180, 255, 0.7)", highway:"rgba(255, 180, 60, 0.7)" };

  // === DRAW ===
  function draw() {
    if (!ctx || !container) return;
    var dateMs = window.timeState ? window.timeState.dateUTC.getTime() : Date.now();
    var year = dateMs / 31557600000 + 1970;
    var w = CANVAS_W, h = CANVAS_H;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "rgba(10, 14, 28, 0.92)";
    ctx.fillRect(0, 0, w, h);

    // Grid
    ctx.strokeStyle = "rgba(255,255,255,0.04)";
    ctx.lineWidth = 0.5;
    for (var lon = -120; lon <= -70; lon += 10) {
      var x = lonToX(lon); ctx.beginPath(); ctx.moveTo(x, MARGIN); ctx.lineTo(x, h - MARGIN); ctx.stroke();
    }
    for (var lat = 25; lat <= 45; lat += 5) {
      var y = latToY(lat); ctx.beginPath(); ctx.moveTo(MARGIN, y); ctx.lineTo(w - MARGIN, y); ctx.stroke();
    }

    // === DRAW STATES (with colonial coloring before admission) ===
    for (var si = 0; si < projectedStates.length; si++) {
      var st = projectedStates[si];
      var admitted = dateMs >= st.admitted;

      for (var ri = 0; ri < st.polygons.length; ri++) {
        var ring = st.polygons[ri];
        if (ring.length < 3) continue;

        ctx.beginPath();
        ctx.moveTo(ring[0][0], ring[0][1]);
        for (var pi = 1; pi < ring.length; pi++) ctx.lineTo(ring[pi][0], ring[pi][1]);
        ctx.closePath();

        if (admitted) {
          // Post-Civil War unification: all states turn to unified USA color after 1865
          if (dateMs >= Date.parse("1865-04-09T00:00:00Z")) {
            ctx.fillStyle = "rgba(60, 90, 160, 0.55)";
            ctx.strokeStyle = "rgba(90, 130, 210, 0.8)";
            ctx.lineWidth = 1.5;
          } else {
            ctx.fillStyle = FACTION_FILL[st.faction] || FACTION_FILL.territory;
            ctx.strokeStyle = FACTION_STROKE[st.faction] || FACTION_STROKE.territory;
            ctx.lineWidth = 1.2;
          }
        } else {
          // Colonial / unorganized territory coloring
          var COLONIAL_START = {british:1607, french:1534, spanish:1513, mexican:1821};
          var colPower = COLONIAL_POWER[st.name] || "british";
          var colUntil = COLONIAL_UNTIL[colPower] || COLONIAL_UNTIL.british;
          var colStartYear = COLONIAL_START[colPower] || 1607;
          var colStartMs = colStartYear * 31557600000;
          var isColonialEra = dateMs >= colStartMs && dateMs < colUntil;

          if (isColonialEra) {
            var cc = COLONY_COLORS[colPower] || COLONY_COLORS.british;
            ctx.fillStyle = cc.fill;
            ctx.strokeStyle = cc.stroke;
            ctx.lineWidth = 0.8;
          } else if (dateMs >= colUntil) {
            // Between colonial end and admission — unorganized US territory
            ctx.fillStyle = "rgba(30, 35, 50, 0.2)";
            ctx.strokeStyle = "rgba(60, 65, 80, 0.3)";
            ctx.lineWidth = 0.5;
          } else {
            // Pre-colonial / Indigenous territory
            ctx.fillStyle = "rgba(40, 50, 30, 0.2)";
            ctx.strokeStyle = "rgba(80, 90, 60, 0.2)";
            ctx.lineWidth = 0.5;
          }
        }
        ctx.fill();
        ctx.stroke();

        // Abbreviation label for admitted states
        if (admitted) {
          var cx = 0, cy = 0;
          for (var pp = 0; pp < ring.length; pp++) { cx += ring[pp][0]; cy += ring[pp][1]; }
          cx /= ring.length; cy /= ring.length;
          ctx.fillStyle = "rgba(255,255,255,0.5)";
          ctx.font = "10px system-ui, sans-serif";
          ctx.textAlign = "center"; ctx.textBaseline = "middle";
          ctx.fillText(st.abbr, cx, cy);
        }
      }
    }


    // === DYNAMIC LEGEND KEY (bottom-left) ===
    // Tells the map's story based on the current timeline era
    if (showLegend) {
      var legItems = [];

      var afterRev = dateMs >= Date.parse("1783-09-03T00:00:00Z");
      var afterCW = dateMs >= Date.parse("1865-04-09T00:00:00Z");
      var beforeColonial = dateMs < Date.parse("1492-01-01T00:00:00Z");

      if (beforeColonial) {
        legItems.push({color:"rgba(40, 50, 30, 0.2)", stroke:"rgba(80, 90, 60, 0.2)", label:"Pre-colonial / Indigenous"});
      } else if (!afterRev) {
        legItems.push({color:COLONY_COLORS.british.fill, stroke:COLONY_COLORS.british.stroke, label:"British territory"});
        legItems.push({color:COLONY_COLORS.french.fill, stroke:COLONY_COLORS.french.stroke, label:"French territory"});
        legItems.push({color:COLONY_COLORS.spanish.fill, stroke:COLONY_COLORS.spanish.stroke, label:"Spanish territory"});
        legItems.push({color:COLONY_COLORS.mexican.fill, stroke:COLONY_COLORS.mexican.stroke, label:"Mexican territory"});
      } else if (!afterCW) {
        var confedActive = dateMs >= Date.parse("1861-02-04T00:00:00Z");
        if (confedActive) {
          legItems.push({color:FACTION_FILL.original, stroke:FACTION_STROKE.original, label:"Union states"});
          legItems.push({color:FACTION_FILL.confed, stroke:FACTION_STROKE.confed, label:"Confederate states"});
          legItems.push({color:FACTION_FILL.border, stroke:FACTION_STROKE.border, label:"Border / slave states"});
        } else {
          legItems.push({color:FACTION_FILL.original, stroke:FACTION_STROKE.original, label:"Original 13 / Union"});
          legItems.push({color:FACTION_FILL.territory, stroke:FACTION_STROKE.territory, label:"Territorial additions"});
          legItems.push({color:"rgba(30, 35, 50, 0.2)", stroke:"rgba(60, 65, 80, 0.3)", label:"Unorganized territory"});
        }
      } else {
        legItems.push({color:"rgba(60, 90, 160, 0.55)", stroke:"rgba(90, 130, 210, 0.8)", label:"United States"});
      }

      // Route colors (once they start appearing)
      var year = 1970 + dateMs / 31557600000;
      if (year >= 1821) {
        legItems.push({color:"rgba(200, 160, 80, 0.7)", stroke:"transparent", label:"Trails"});
        legItems.push({color:"rgba(120, 180, 255, 0.7)", stroke:"transparent", label:"Railroads"});
      }
      if (year >= 1900) {
        legItems.push({color:"rgba(255, 180, 60, 0.7)", stroke:"transparent", label:"Roads / Highways"});
      }

      // Town dot colors
      if (year >= 1565) {
        legItems.push({color:TOWN_DOT_COLORS.settlement, stroke:"transparent", label:"Settlements / Forts"});
      }
      if (year >= 1600) {
        legItems.push({color:TOWN_DOT_COLORS.city, stroke:"transparent", label:"Cities / Missions"});
      }

      // Layout
      var rows = Math.ceil(legItems.length / 2);
      var legW = 320;
      var legH = 26 + rows * 20;
      var legX = MARGIN;
      var legY = h - 10 - legH;

      ctx.fillStyle = "rgba(0,0,0,0.6)";
      ctx.fillRect(legX, legY, legW, legH);
      ctx.strokeStyle = "rgba(255,255,255,0.15)";
      ctx.lineWidth = 0.5;
      ctx.strokeRect(legX, legY, legW, legH);

      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.font = "12px system-ui, sans-serif";
      ctx.textAlign = "left"; ctx.textBaseline = "top";
      ctx.fillText("Map Key", legX + 8, legY + 4);

      for (var li = 0; li < legItems.length; li++) {
        var col = li % 2;
        var row = Math.floor(li / 2);
        var lx = legX + 8 + col * 152;
        var ly2 = legY + 22 + row * 20;
        if (legItems[li].stroke !== "transparent") {
          ctx.fillStyle = legItems[li].color;
          ctx.fillRect(lx, ly2, 18, 12);
          ctx.strokeStyle = legItems[li].stroke;
          ctx.lineWidth = 1;
          ctx.strokeRect(lx, ly2, 18, 12);
        } else {
          ctx.strokeStyle = legItems[li].color;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(lx, ly2 + 6);
          ctx.lineTo(lx + 18, ly2 + 6);
          ctx.stroke();
          if (legItems[li].label.indexOf("Trails") >= 0) {
            ctx.setLineDash([4, 4]);
            ctx.strokeStyle = legItems[li].color.replace("0.7", "0.3");
            ctx.lineWidth = 1.5;
            ctx.stroke();
            ctx.setLineDash([]);
          }
          if (legItems[li].label.indexOf("Settlements") >= 0 || legItems[li].label.indexOf("Cities") >= 0) {
            ctx.beginPath();
            ctx.arc(lx + 9, ly2 + 6, 6, 0, Math.PI * 2);
            ctx.fillStyle = legItems[li].color;
            ctx.fill();
          }
        }
        ctx.fillStyle = "rgba(255,255,255,0.5)";
        ctx.font = "12px system-ui, sans-serif";
        ctx.textAlign = "left"; ctx.textBaseline = "top";
        ctx.fillText(legItems[li].label, lx + 24, ly2);
      }
    }

    // === EXPLORER EVENTS ===
    var events = [
      {name:"Columbus lands", lon:-74.5, lat:24.5, year:1492, type:"explorer"},
      {name:"Cabot (Newfoundland)", lon:-55, lat:47.5, year:1497, type:"explorer"},
      {name:"Cartier (St. Lawrence)", lon:-67, lat:48.5, year:1534, type:"explorer"},
      {name:"Ponce de Leon (Florida)", lon:-81.5, lat:29.5, year:1513, type:"explorer"},
      {name:"Coronado (SW)", lon:-107, lat:35, year:1540, type:"explorer"},
      {name:"De Soto (Mississippi)", lon:-90.5, lat:34.5, year:1541, type:"explorer"}
    ];
    for (var ei = 0; ei < events.length; ei++) {
      var ev = events[ei];
      var evMs = Date.UTC(ev.year, 0, 1);
      var evEndMs = Date.UTC(ev.year + 5, 0, 1);
      if (dateMs < evMs || dateMs > evEndMs) continue;
      var ex = lonToX(ev.lon), ey = latToY(ev.lat);
      // Large marker dot
      ctx.beginPath();
      ctx.arc(ex, ey, 6, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255, 215, 0, 0.8)";
      ctx.fill();
      ctx.strokeStyle = "rgba(255, 255, 200, 0.4)";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      // Label
      ctx.fillStyle = "rgba(255, 215, 0, 0.9)";
      ctx.font = "12px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      ctx.fillText(ev.name + " (" + ev.year + ")", ex, ey - 8);
    }

    // === HISTORIC TOWNS ===
    for (var ti = 0; ti < HISTORIC_TOWNS.length; ti++) {
      var town = HISTORIC_TOWNS[ti];
      var foundedMs = Date.UTC(town.founded, 0, 1);
      if (dateMs < foundedMs) continue;

      var px = lonToX(town.lon);
      var py = latToY(town.lat);

      // Town dot
      ctx.beginPath();
      ctx.arc(px, py, town.type === "settlement" ? 5 : 4, 0, Math.PI * 2);
      ctx.fillStyle = TOWN_DOT_COLORS[town.type] || "#6ab0ff";
      ctx.fill();

      // Town label (type-dependent size)
      ctx.fillStyle = TOWN_DOT_COLORS[town.type] || "#6ab0ff";
      ctx.globalAlpha = 0.7;
      ctx.font = (TOWN_FONT_SIZES[town.type] + 2 || 8) + "px system-ui, sans-serif";
      ctx.textAlign = "left";
      ctx.textBaseline = "bottom";
      // Only show label if it's a settlement/mission or year close to founding for cities
      var showLabel = town.type !== "city" || year - town.founded < 100;
      if (showLabel) {
        ctx.fillText(town.name, px + 5, py - 2);
      }
      ctx.globalAlpha = 1.0;
    }

    // === ROUTES ===
    for (var ri2 = 0; ri2 < US_ROUTES.length; ri2++) {
      var route = US_ROUTES[ri2];
      var prog = routeProgress(route, dateMs);
      if (prog <= 0) continue;

      var projectedCoords = projectCoords(route.coords);
      var numPoints = Math.max(2, Math.floor(projectedCoords.length * prog));
      var visible = projectedCoords.slice(0, numPoints);

      ctx.beginPath();
      ctx.moveTo(visible[0][0], visible[0][1]);
      for (var pi3 = 1; pi3 < visible.length; pi3++) ctx.lineTo(visible[pi3][0], visible[pi3][1]);

      var color = LINE_COLORS[route.type] || "rgba(200,200,200,0.5)";
      ctx.strokeStyle = color;
      ctx.lineWidth = route.type === "highway" ? 4 : (route.type === "railroad" ? 3 : 2);
      ctx.stroke();

      if (route.type === "trail") {
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = color.replace("0.7", "0.25");
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.setLineDash([]);
      }
      if (prog > 0.3 && visible.length > 2) {
        var midIdx = Math.floor(visible.length / 2);
        var pt = visible[midIdx];
        ctx.fillStyle = color;
        ctx.font = "12px system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "bottom";
        ctx.fillText(route.label, pt[0], pt[1] - 3);
      }
    }

    // === DATE + STATE COUNT ===
    var d = new Date(dateMs);
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.font = "11px system-ui, sans-serif";
    ctx.textAlign = "right";
    ctx.textBaseline = "bottom";
    ctx.fillText("" + d.getUTCFullYear(), w - MARGIN, h - MARGIN);
    var cnt = projectedStates.filter(function(s){ return dateMs >= s.admitted; }).length;
    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.font = "12px system-ui, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(cnt + " states", MARGIN + 2, h - MARGIN);

    // Title bar
    ctx.fillStyle = "rgba(255,255,255,0.12)";
    ctx.fillRect(0, 0, w, 24);
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.font = "13px system-ui, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText("US States Map", 8, 11);
  }

  function loop() { if (!active) return; draw(); rafId = requestAnimationFrame(loop); }

  // === DRAG ===
  function startDrag(e) {
    if (resizing) return; dragging = true;
    var r = container.getBoundingClientRect();
    dragOffX = e.clientX - r.left; dragOffY = e.clientY - r.top;
    container.style.cursor = "grabbing"; container.style.transition = "none";
    e.preventDefault();
  }
  function onDrag(e) {
    if (!dragging) return;
    container.style.left = (e.clientX - dragOffX) + "px";
    container.style.top = (e.clientY - dragOffY) + "px";
    container.style.right = "auto"; container.style.bottom = "auto";
    e.preventDefault();
  }
  function endDrag() { dragging = false; if (container) container.style.cursor = ""; }

  // === RESIZE ===
  function startResize(e) {
    resizing = true; resizeStartW = CANVAS_W; resizeStartH = CANVAS_H;
    resizeStartX = e.clientX; resizeStartY = e.clientY;
    container.style.transition = "none"; e.preventDefault(); e.stopPropagation();
  }
  function onResize(e) {
    if (!resizing) return;
    var newW = Math.max(480, resizeStartW + (e.clientX - resizeStartX));
    newW = Math.min(1200, newW);
    var newH = Math.round(newW / 1.444); // fixed 520/360 aspect ratio
    newH = Math.max(220, Math.min(900, newH));
    CANVAS_W = newW; CANVAS_H = newH;
    canvas.width = CANVAS_W; canvas.height = CANVAS_H;
    container.style.width = CANVAS_W + "px"; container.style.height = CANVAS_H + "px";
    project(); draw(); e.preventDefault();
  }
  function endResize() { resizing = false; }

  // === BUILD / OPEN / CLOSE ===
  function buildContainer() {
    setDefaultSize();
    container = document.getElementById("usMapContainer");
    if (!container) { container = document.createElement("div"); container.id = "usMapContainer"; document.body.appendChild(container); }
    container.innerHTML = "";
    container.style.cssText = "position:fixed;left:"+Math.round((window.innerWidth-CANVAS_W)/2)+"px;top:"+Math.round((window.innerHeight-CANVAS_H)/2)+"px;z-index:9999998;"+
      "border:1px solid rgba(255,255,255,.15);border-radius:10px;overflow:hidden;"+
      "box-shadow:0 8px 32px rgba(0,0,0,.6);width:"+CANVAS_W+"px;height:"+CANVAS_H+"px;"+
      "background:rgba(10,14,28,0.95);cursor:grab;user-select:none;";
    canvas = document.createElement("canvas");
    canvas.width = CANVAS_W; canvas.height = CANVAS_H; canvas.style.display = "block";
    container.appendChild(canvas); ctx = canvas.getContext("2d");

    // Resize handle
    var h = document.createElement("div");
    h.id = "usMapResizeHandle";
    h.style.cssText = "position:absolute;bottom:0;right:0;width:16px;height:16px;cursor:nwse-resize;color:rgba(255,255,255,0.4);font-size:10px;display:flex;align-items:center;justify-content:center;z-index:5001;user-select:none;";
    h.textContent = "\u2B0C";
    container.appendChild(h);

    // Close button
    var cb = document.createElement("div");
    cb.id = "usMapCloseBtn";
    cb.style.cssText = "position:absolute;top:2px;right:4px;width:16px;height:16px;cursor:pointer;color:rgba(255,255,255,0.4);font-size:13px;display:flex;align-items:center;justify-content:center;z-index:5002;user-select:none;";
    cb.textContent = "\u00D7";
    cb.title = "Close map";
    cb.addEventListener("click", function(e){ e.stopPropagation(); close(); });
    container.appendChild(cb);

    // Click-to-front
    container.addEventListener("mousedown", function(){ 
      container.style.zIndex = "10000020"; 
      var wm = document.getElementById("wheelModal"); 
      if(wm) wm.style.zIndex = "9999999"; 
    });
    return true;
  }

  function open() {
    if (active) return;
    setDefaultSize();
    if (!container || !container.isConnected) { if (!buildContainer()) return; }
    container.style.display = "block"; active = true;
    container.addEventListener("mousedown", startDrag);
    document.addEventListener("mousemove", onDrag);
    document.addEventListener("mouseup", endDrag);
    var h = document.getElementById("usMapResizeHandle");
    if (h) h.addEventListener("mousedown", startResize);
    document.addEventListener("mousemove", onResize);
    document.addEventListener("mouseup", endResize);
    project(); loop();
  }

  function close() {
    active = false;
    if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
    if (container) { container.style.display = "none"; container.removeEventListener("mousedown", startDrag); }
    document.removeEventListener("mousemove", onDrag);
    document.removeEventListener("mouseup", endDrag);
    document.removeEventListener("mousemove", onResize);
    document.removeEventListener("mouseup", endResize);
  }

  function toggle() { if (active) close(); else open(); }

  window.USMapAnimation = { open:open, close:close, toggle:toggle, draw:draw };
  console.log("[US Map v3] Legend + colonies + towns loaded");
})();

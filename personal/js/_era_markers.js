// js/_era_markers.js
// Cathedral: global data (non-module). Loaded before screw-renderer.js.

window.ERA_MARKERS = [] // emptied — data moved to _historical_events.js

window.ERA_STYLE = {
  dropPx: 60,          // vertical line length (down from axis)
  textGapPx: 12,       // gap between line end and text
  dotR: 2.8,           // anchor dot radius
  lineW: .8,
  fontSize: 12,
  opacity: 0.85
};

window.ERA_STYLE_ERA = {
  // =========================
  // ERA LABEL LANE (near axis)
  // =========================

  // VERTICAL (all are px BELOW the axis)
  baseY: 105,          // where ERA text starts (main label baseline)
  nearAxisPx: 26,      // fallback if baseY is not used by your renderer

  // AUTO-SEPARATION (lane packing)
  padPx: 10,           // extra breathing room between labels (px)
  charPx: 7,           // width estimate per character (bigger = more spacing)
  maxAutoLanes: 8,     // maximum auto lanes allowed for ERAs
  minLabelW: 160,   // minimum reserved width (px) for any era label

  // TEXT LOOK
  fontSize: 12,        // main label size
  opacity: 0.85,       // label opacity (0..1)
  dateFontSize: 9,     // smaller date line size
  dateDy: 12,          // spacing between main label and date line (px)

  // LANE GEOMETRY
  lanes: 3,            // legacy/manual lanes (still used if your renderer falls back)
  laneGapPx: 14,       // vertical distance between lanes (px)
  minGapPx: 190        // legacy/manual x-gap trigger (px)
};


window.ERA_STYLE_WAR = {
  // =========================
  // WAR LABEL LANE (with drops)
  // =========================

  // VERTICAL (all are px BELOW the axis)
  baseY: 58,           // where WAR text starts (main label baseline)
  dropPx: 50,          // length of the drop line from axis down (px)
  textGapPx: 12,       // gap after line end IF renderer falls back to (dropPx + textGapPx)

  // AUTO-SEPARATION (lane packing)
  padPx: 6,           // extra breathing room between labels (px)
  charPx: 5,           // width estimate per character
  maxAutoLanes: 1,     // maximum auto lanes allowed for WARS
  minLabelW: 60,

  // WAR MARKER LOOK
  dotR: 2.8,           // axis dot radius
  lineW: 0.8,          // drop line width

  // TEXT LOOK
  fontSize: 12,
  opacity: 0.85,
  dateFontSize: 9,
  dateDy: 12,

  // LANE GEOMETRY
  lanes: 1,
  laneGapPx: 18,
  minGapPx: 120
};


window.ERA_STYLE_EVENT = {
  // =========================
  // EVENT LANE (future dense layer)
  // =========================

  // VERTICAL (px BELOW the axis)
  baseY: 140,         // where EVENT text starts (main label baseline)

  // AUTO-SEPARATION (lane packing)
  padPx: 10,          // extra breathing room between labels (px)
  charPx: 7,          // width estimate per character
  maxAutoLanes: 16,   // events need more lanes than eras/wars
  minLabelW: 180,

  // LANE GEOMETRY
  lanes: 10,          // legacy/manual lanes (fine to keep)
  laneGapPx: 16,      // vertical distance between event lanes (px)
  minGapPx: 200,      // legacy/manual x-gap trigger (px)

  // TEXT LOOK
  fontSize: 11,
  opacity: 0.8,
  dateFontSize: 9,
  dateDy: 12
};

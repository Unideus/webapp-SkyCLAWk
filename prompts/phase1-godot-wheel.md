You are Saturn, the company coordinator for Zodi Yuga Permaculture. Ian has given you a directive. Execute it.

## Directive from Ian

I have two projects:

1. **Web SkyCLAWk app** (zodiyuga.com) — this is the concept/beta version. It has a working 2D astro wheel (shared/astro-wheel.js, ~3,900 lines), an astro wheel in each view, a generational screw timeline, historical events, conjunction cycle selectors, all the astrology features. This is the reference for what the features look like.
   - Location: E:\Hermes Project\GitHub\SkyCLAWk\
   
2. **Codex prototype** (Gadot - SkyCLAWk) — a first attempt at putting the wheel into Godot. It has working scripts (astro_wheel.gd, main.gd, timeline_strip.gd, cosmology_model_3d.gd). It works but was written by a different model. It's reference material — keep what's useful, discard what isn't.
   - Location: E:\Hermes Project\Gadot - SkyCLAWk\

3. **Clean Godot scaffold** (Hermes Godot SkyCLAWk) — project.godot (Godot 4.6), ARCHITECTURE.md, assets (zodiac symbols, constellation SVG, fonts, JSON ephemeris data). No scripts yet. This is where the work goes.
   - Location: E:\Hermes Project\Hermes Godot SkyCLAWk\

**Phase 1 Goal:** Get the astro wheel running in Godot at the Hermes Godot SkyCLAWk location. It needs to show the zodiac ring, planets with correct positions from the JSON ephemeris data, aspect lines, retrograde markers, and have speed controls (pause, scrub, animate). The UI must be polished enough to evaluate whether Godot is the right platform for this work.

See the existing web app for what the wheel should look like and do. See the Codex prototype for a prior Godot attempt you can learn from or ignore.

Acceptance criteria (all must pass):
1. Zodiac ring with correct element colors and zodiac glyph symbols
2. Planet positions (Sun through Pluto) from JSON ephemeris with interpolation, fallback to circular approximation
3. Aspect lines (conjunction, sextile, square, trine, opposition) with color and opacity based on orb
4. Retrograde markers (Rx)
5. Precession correction
6. Constellation overlay behind the wheel
7. Speed controls: pause/resume, speed slider, keyboard shortcuts (space, R, [, ], S)
8. Date display (YYYY-MM-DD UTC)
9. No errors — opens and runs in Godot 4.6 without script errors or missing resources

Constraints:
- Use the JSON ephemeris only. No Swiss Ephemeris.
- No houses, lots, shadow arcs, planetary cycles, natal chart, transits grid, elements grid, rulers grid
- No 3D model
- No screw timeline
- The timeline strip at the bottom can be basic — just a placeholder showing the current year

## Your Task

Study the references. Decide on the best approach — GDScript, C#, a plugin, whatever makes sense. Build the wheel and controls at the destination location. Create whatever scene files and scripts are needed. Test it runs.

Report back to Ian when it's ready for review.

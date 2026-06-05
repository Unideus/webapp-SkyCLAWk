# Skyclock Cycle Ephemeris Report

## Short answer

For Skyclock cycle shapes, Astronomy Engine is likely sufficient as long as the app is using real geocentric apparent ecliptic longitudes and not the simple fallback orbit model.

Swiss Ephemeris would improve consistency with the Personal and Generational timeline pages and may improve confidence for exact astrological timing, but the correctness of the visual cycle shapes depends more on sampling, event detection, and coordinate-frame consistency than on Swiss vs Astronomy Engine.

## What needs to be real

The important cycle features are:

- retrograde loop/station pattern shape
- synodic conjunction/opposition rhythm
- correct relative geometry around the zodiac/ecliptic
- visually correct cycle chords/pins

Those patterns come from real geocentric apparent longitudes changing over time. Astronomy Engine can provide those real planetary positions.

## Main risk

The main risk is not that Astronomy Engine creates fake ratios. The larger risks are implementation details:

- sampling resolution is too coarse
- time-step jumps skip events
- coordinate frames do not match between planets and cycle overlays
- synodic target logic is wrong
- inner and outer planets are treated the same when they should not be
- the cycle overlay rotates/transforms differently from the planets

These can make the cycle shapes wrong even if Swiss is used underneath.

## Current Skyclock concern

Skyclock should avoid silently falling back to the toy/simple period model for cycle drawing.

The desired rule:

- If a real ephemeris provider is available, cycles may render.
- If only the toy fallback is available, cycles should be disabled or visibly marked degraded.

That prevents fake-looking-but-plausible cycle patterns.

## Recommended cycle architecture

Build cycle logic around a provider abstraction:

```js
getCycleLongitudes(date)
```

Current implementation can use Astronomy Engine.

Future implementation can switch to Swiss Ephemeris.

The cycle logic should not care which engine provides the longitudes.

## Recommended sampling approach

Use adaptive sub-sampling instead of checking only the current animation frame.

Suggested starting intervals:

- Mercury/Venus: 0.25–1 day
- Mars/Jupiter/Saturn: 1–3 days
- Uranus/Neptune/Pluto: 5–10 days

Also cap maximum sub-steps per frame to protect performance.

## Recommended event detection

Use zero-crossing/sign-change logic.

Retrograde/station:

- compare signed longitude motion over time
- station occurs when motion changes sign

Synodic events:

- Mercury/Venus: conjunction with Sun, target `planet - sun = 0°`
- Outer planets: opposition to Sun, target `planet - sun = 180°`

Optional refinement:

- interpolate between previous and current samples to place event pins closer to the actual event longitude/time

## Recommendation for current development

Stay with Astronomy Engine while the Skyclock mode and visual behavior are still being worked out.

Reasons:

- It already supplies real planetary positions.
- It avoids Swiss async/load complexity during visual-mode iteration.
- It allows the cycle geometry, modal behavior, sampling, and overlay design to be developed first.
- Later migration to Swiss should be straightforward if cycle logic depends on `getCycleLongitudes(date)` instead of a specific library.

## Bottom line

You do not need Swiss to get correct cycle shapes if Astronomy Engine is active and real ephemeris data is being used.

Swiss is still a good future migration target for consistency and exactness, but the biggest determinant of correct visual patterns is the cycle detection/sampling algorithm and coordinate transform discipline.

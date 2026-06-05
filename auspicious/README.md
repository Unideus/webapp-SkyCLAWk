# Auspicious Time Calculator

Electional astrology tool for finding the best times for specific events (gambling, marriage, relocation, surgery, contracts, etc.).

## Features
- Two modes: "Find Best Time" (scan range) and "Check a Specific Time"
- 17 event topics with topic-specific scoring rules
- Swiss Ephemeris calculations (whole sign houses, sect, dignities, aspects)
- City autocomplete + reverse geocoding
- Interactive planet cards with detailed modal explanations
- Local-first (no external API calls for core functionality)

## Run locally

```bash
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
PORT=5177 python server.py
```

Then open http://localhost:5177

## Project structure
- `index.html` — Main UI (single-file app)
- `server.py` — FastAPI backend
- `astro_engine.py` — Swiss Ephemeris calculations
- `rules_engine.py` — Electional scoring logic per topic
- `static/cities.json` — City database for autocomplete

## Deployment
Designed to be deployed as a static site + lightweight Python API (or fully static with WASM Swiss Ephemeris in the future).

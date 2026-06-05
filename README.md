# SkyCLAWk

**Sky Conjunction Layer, Astro Wheel, and Clock** — a suite of independent astrological visualization pages under one roof. Each page is a standalone app with its own HTML, JS, and zero cross-page bleed. Shared modules (sign glyphs, Swiss Ephemeris wrapper, astro wheel) live in `shared/`.

## Pages

| Page | Route | Description |
|---|---|---|
| **Generational** | `/` or `/generational/` | Grand conjunction saeculum timeline — historical eras mapped to Saturn-Jupiter conjunctions |
| **Personal** | `/personal/` | Individual life timeline with natal chart, lifeline, and personal events |
| **Planting** | `/planting/` | Moon-phase planting calendar with static astro wheel and permaculture plan links |
| **Skyclock** | `/skyclock/` | Cyclical yuga/zodiac/conjunction display |
| **Auspicious** | `/auspicious/` | Auspicious time calculator — score any moment for a given topic using Swiss Ephemeris |

## Build

```bash
npm install
npm run build        # builds dist/ — ready for Cloudflare Pages
npm run dev          # Vite dev server on port 3000
npm run preview      # preview local build
```

## Architecture

```
SkyCLAWk/
├── generational/     # Standalone generational timeline app
├── personal/         # Standalone personal timeline app
├── planting/         # Standalone planting calendar app
├── skyclock/         # Standalone cyclical skyclock app
├── auspicious/       # Standalone auspicious time calculator (Vite + WASM)
├── shared/           # Common modules (constants, astro-wheel, swe-init, etc.)
├── css/              # Shared base styles
├── data/             # cities.json
├── images/           # President portraits and assets
├── public/ephe/      # Swiss Ephemeris .se1 files
├── vite.config.js    # Multi-entry build config
├── copy-static.js    # Post-build static asset copier
└── _redirects        # Cloudflare Pages routes
```

### Key Principles

- **No cross-page bleed.** Each page has its own `ui-controller.js`, `screw-renderer.js`, and engine files. Editing personal never affects planting.
- **Shared modules are stable data.** `shared/constants.js`, `shared/astro-wheel.js`, etc. are genuinely identical across all consumers.
- **Full page reloads between scales.** Each page is a standalone HTML document with its own `<script>` tags. Navigation uses standard `<a>` links.
- **One build command.** `npm run build` compiles all 5 pages to `dist/`.

## Deployment

Deploy `dist/` to Cloudflare Pages:

```bash
npm run build
# Upload dist/ to Cloudflare Pages with:
#   Build command: npm run build
#   Output directory: dist
```

The `_redirects` file handles all route mapping.

## License

MIT

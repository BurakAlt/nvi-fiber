# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

FiberPlan Chrome is a Manifest V3 Chrome Extension for FTTH fiber network planning on Turkey's NVI address portal (adres.nvi.gov.tr). Field engineers select buildings within city blocks (adas), and the system auto-calculates OLT placement, splitter cascades, cable routing, loss budgets, and costs per GPON ITU-T G.984 Class B+ standards.

## Development

**No build step.** Vanilla JavaScript, no bundler, no framework. Load the extension in Chrome via `chrome://extensions` → Developer mode → "Load unpacked" → select `fiber-chrome/`.

**Debug logging:** Run `python scripts/log-monitor.py` to see real-time logs from the debug bridge (connects to `http://127.0.0.1:7777/log`).

**Testing:** Open `fiber-chrome/dashboard/test-topology.html` in browser for topology calculation tests.

## Architecture

### Module System

All modules use the IIFE pattern (`const Module = (() => { ... })()`) exposing a public API object. No imports/exports — every module is a global. **Load order in manifest.json is critical** because each module depends on globals from earlier scripts:

```
leaflet → debug → ws-bridge → pon-engine → topology → storage → map-utils →
draw-polygon → review-engine → scraper → overlay → panels → main
```

### Core Data Flow

```
NviScraper polls NVI DOM (1s interval)
  → groups <tr> rows by binaNo into buildings
  → main.js adds buildings to active ada via Topology.addBuilding()
  → PonEngine.recalculateAda(ada) runs full pipeline
  → Overlay.render() updates map + Panels.refresh() updates sidebar
  → Storage.autoSave() persists to chrome.storage.local
```

### Recalculation Pipeline (PonEngine.recalculateAda)

Runs in this exact order — each step depends on the previous:

1. **OLT placement** — weighted geometric median (BB×distance), electric buildings preferred
2. **OLT capacity** — GPON port count (128 BB/port, 64 ONT/port)
3. **FDH assignment** — greedy clustering, max 8 buildings per FDH
4. **MST routing** — Prim's algorithm, two-level (OLT→FDH feeder, FDH→buildings distribution)
5. **Cable sizing** — backbone (PON port-based), distribution (downstream demand-based), drop (per-building internal), ring (MST leaf closure)
6. **Splitter cascade** — 2-level: level 1 at FDH (by building count), level 2 at building (by effective BB after penetration rate)
7. **Loss budget** — per building: splitter + fiber (0.35 dB/km) + connectors (4×0.5 dB) + splices (2×0.1 dB) ≤ 28 dB
8. **Inventory & costs** — aggregates equipment from catalog with quantities

### Two Routing Modes

- **Auto mode:** MST-generated, recalculates on every change. `ada.topology.manualEdges` is empty.
- **Manual mode:** User draws cables via KABLO CIZ. Edges stored in `ada.topology.manualEdges[]`. Only recalculates on explicit HESAPLA button click. `Topology.copyMstToManualEdges()` seeds manual edges from current MST.

### Map & NVI Integration

The extension creates its **own Leaflet map** (Overlay.js) — it does NOT use NVI's inaccessible map. NVI's map coordinates are captured via **MAIN world script injection** (`injectMainWorldCoordReader()` in scraper.js) because content scripts run in Chrome's ISOLATED world and can't access NVI's Leaflet instance.

**CSP workaround:** `MapUtils.FetchTileLayer` fetches tiles via content script `fetch()` → blob URLs, bypassing NVI page's Content-Security-Policy img-src restrictions.

### Storage

`chrome.storage.local` with `fp_` prefix. One-time migration from IndexedDB exists in main.js. Key entries:
- `fp_current` — full project state (Topology.getState())
- `fp_catalog_custom` — user-customized equipment prices
- `fp_map_position` — last map viewport (lat, lng, zoom)

### Key Files

| File | Role |
|------|------|
| `lib/pon-engine.js` | All GPON calculations: splitters, loss budget, MST, FDH, inventory, costs. `CONSTANTS` and `CATALOG` are the source of truth for fiber parameters and equipment prices. |
| `lib/topology.js` | Project data model (PROJECT singleton), ada/building CRUD, multi-ada OLT grouping, export (JSON/CSV/GeoJSON), penetration rate management. |
| `content/scraper.js` | NVI DOM scraping. Groups `<tr bagimsizbolumkimlikno>` rows into buildings by composite key (ada+parsel+disKapiNo). |
| `content/overlay.js` | Self-contained Leaflet map overlay with satellite/street tiles, building markers (pentagon SVG), cable lines, boundary polygons, map modes (OLT/cable/boundary). |
| `content/panels.js` | Toolbar + side panel UI. Ada selector, building list with inline editing, cable draw mode, bulk delete, context menus. |
| `content/main.js` | Entry point. Orchestrates init, auto-polling, auto-save, coordinate capture, IndexedDB migration. |
| `lib/map-utils.js` | Pentagon icon generation, CSP-safe tile layers, building type colors, cable styles. |
| `lib/review-engine.js` | Quality classifier: evaluates topology across 6 weighted categories (loss budget, standards, splitter, OLT, cable, cost). |
| `dashboard/dashboard.js` | Full-page CRM dashboard. Loads same lib/ modules, reads from chrome.storage.local. Separate extension page. |

## Domain Constants (GPON Class B+)

```
Max loss budget:   28 dB
Fiber loss:        0.35 dB/km @ 1310nm
Connector loss:    0.5 dB per connector (4 connectors default)
Splice loss:       0.1 dB per splice (2 splices default)
Splitter loss:     {2: 3.5, 4: 7.0, 8: 10.5, 16: 14.0, 32: 17.5, 64: 21.0} dB
Max BB per port:   128
Max ONT per port:  64
Penetration rate:  70% default (per-ada and per-building configurable)
```

### Splitter Sizing Rules

```
effBB ≤ 8  → 1:8      (10.5 dB)
effBB ≤ 16 → 1:16     (14.0 dB)
effBB ≤ 24 → 1:16+1:8 cascade
effBB ≤ 32 → 1:32     (17.5 dB)
```

Cascade: level 1 at FDH (by building count), level 2 at building (by effective BB). Total ratio ≤ 1:128.

### Building Types & Map Colors

| Type | Hex | Condition |
|------|-----|-----------|
| OLT | #8B5CF6 | OLT assigned building |
| FDH | #3B82F6 | Splitter node |
| MDU Large | #22C55E | ≥ 20 BB |
| MDU Medium | #F97316 | 8–19 BB |
| SFU | #EAB308 | 1–7 BB |

## Operating Principles

1. **Ada-scoped** — every operation works within an ada context. Buildings are never a flat list.
2. **Runs ON NVI portal** — pentagon markers, panels, and controls inject into NVI's DOM. The extension's map is separate from NVI's.
3. **Satellite tiles only** — Esri World Imagery. OpenStreetMap lacks building data in rural Turkey.
4. **Dynamic recalculation** — any change (add/remove building, move OLT, change splitter) triggers `PonEngine.recalculateAda()`.
5. **Backend-ready** — all data structures are JSON-serializable for future online monitoring.

## Skills & Subagents

Skills live in `.claude/skills/` (each has `SKILL.md` + `scripts/`). Subagents in `.claude/agents/` are read-only reporters — all code changes happen in the parent agent.

| Skill | Purpose |
|-------|---------|
| `fiber-topology` | Ada-based FTTH topology planning |
| `nvi-integration` | NVI portal DOM scraping |
| `fiber-report` | Topology reports with schematics |
| `chrome-ext-build` | Build and package extension |
| `chrome-ext-debug` | Debug content scripts |
| `fiber-qa` | Validate calculations and loss budgets |

| Subagent | Purpose |
|----------|---------|
| `fiber-expert` | GPON standards compliance review |
| `code-reviewer` | Code review with domain context |
| `qa` | Test generation and execution |
| `research` | Fiber standards and technical docs |

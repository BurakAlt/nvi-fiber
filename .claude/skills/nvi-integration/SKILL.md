---
name: nvi-integration
description: NVI portal DOM scraping and building data extraction via Chrome Extension
triggers:
  - NVI scraping
  - building data extraction
  - NVI portal integration
  - address portal
  - content script
---

# NVI Integration

## Purpose
Integrate with NVI address portal (adres.nvi.gov.tr) via Chrome Extension content scripts. Scrape building data from NVI DOM, inject UI overlays, and handle map interactions.

## When to Use
- Building Chrome Extension content scripts for NVI
- Scraping building/address data from NVI portal
- Injecting panels, overlays, or controls into NVI page
- Working with NVI's map component
- Handling building click events on NVI

## NVI Portal Structure
- URL: `https://adres.nvi.gov.tr/`
- Map: Built-in map component (likely OpenLayers or Leaflet)
- Buildings: Clickable polygons on the map
- Address data: Available in DOM after clicking a building

## Content Script Injection Points
1. **Map overlay**: Inject Leaflet satellite layer on top of NVI map
2. **Side panel**: Inject right-side panel for building list and ada management
3. **Bottom panel**: Inject bottom panel for calculations (loss budget, inventory, costs)
4. **Context menu**: Right-click menu on buildings for OLT/Antenna assignment
5. **Toolbar**: Top toolbar with "Ada Bitir", export, view toggle buttons

## Building Data Extraction
When user clicks a building on NVI:
```javascript
// Scrape from NVI DOM
const buildingData = {
  name: /* building name from NVI */,
  addr: /* full address */,
  ada: /* ada (city block) number */,
  parsel: /* parsel number */,
  bb: /* bagimsiz bolum count */,
  lat: /* latitude from map click */,
  lng: /* longitude from map click */,
  il: /* province */,
  ilce: /* district */,
  mahalle: /* neighborhood */
};
```

## DOM Selectors
<!-- To be discovered and updated during development -->
NVI DOM changes over time. When selectors break:
1. Inspect current NVI page structure
2. Update selectors in scraper.js
3. Update this SKILL.md with new selectors

## Map Integration
- NVI has its own map - we overlay our Esri satellite tiles
- Pentagon markers are added as Leaflet markers on top
- Cable lines drawn as Leaflet polylines
- All positioned using NVI's coordinate system

## Permissions Required (manifest.json)
```json
{
  "content_scripts": [{
    "matches": ["https://adres.nvi.gov.tr/*"],
    "js": ["content/main.js"],
    "css": ["styles/overlay.css"]
  }],
  "permissions": ["storage", "activeTab"],
  "host_permissions": ["https://adres.nvi.gov.tr/*"]
}
```

## Key Constraints
- NVI may block or throttle scraping - handle gracefully
- DOM structure may change without notice - use resilient selectors
- Must not interfere with NVI's core functionality
- All injected UI should be removable/toggleable
- Use Shadow DOM for injected components to avoid CSS conflicts

## Learnings
<!-- Updated by self-annealing loop -->

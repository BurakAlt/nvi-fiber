---
name: chrome-ext-build
description: Build, package, and test Chrome Extension
triggers:
  - build extension
  - package extension
  - chrome extension build
  - manifest
  - load extension
---

# Chrome Extension Build

## Purpose
Build, package, and manage the FiberPlan Chrome Extension. Handle manifest configuration, content script bundling, and extension loading.

## When to Use
- Setting up or modifying manifest.json
- Adding new content scripts or resources
- Packaging the extension for distribution
- Testing extension loading in Chrome
- Updating extension permissions

## Manifest V3 Template
```json
{
  "manifest_version": 3,
  "name": "FiberPlan Chrome",
  "version": "1.0.0",
  "description": "FTTH Fiber Network Planning on NVI Portal",
  "permissions": ["storage", "activeTab"],
  "host_permissions": ["https://adres.nvi.gov.tr/*"],
  "content_scripts": [{
    "matches": ["https://adres.nvi.gov.tr/*"],
    "js": [
      "lib/pon-engine.js",
      "lib/topology.js",
      "lib/storage.js",
      "lib/map-utils.js",
      "content/scraper.js",
      "content/overlay.js",
      "content/panels.js",
      "content/main.js"
    ],
    "css": ["styles/overlay.css"],
    "run_at": "document_idle"
  }],
  "action": {
    "default_popup": "popup/popup.html",
    "default_icon": {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  },
  "icons": {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  },
  "web_accessible_resources": [{
    "resources": ["styles/*", "icons/*"],
    "matches": ["https://adres.nvi.gov.tr/*"]
  }]
}
```

## File Structure
```
fiber-chrome/
├── manifest.json
├── content/
│   ├── main.js          # Entry point, event listeners
│   ├── scraper.js       # NVI DOM scraping
│   ├── overlay.js       # Map overlay (Leaflet + Esri tiles)
│   └── panels.js        # Side/bottom panels
├── lib/
│   ├── pon-engine.js    # GPON calculations
│   ├── topology.js      # Ring topology generation
│   ├── storage.js       # IndexedDB wrapper
│   └── map-utils.js     # Map utilities (pentagon, cables)
├── popup/
│   ├── popup.html
│   ├── popup.js
│   └── popup.css
├── styles/
│   └── overlay.css
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

## Build Steps
1. Validate manifest.json
2. Check all referenced files exist
3. Load in Chrome via chrome://extensions (Developer Mode)
4. Test on adres.nvi.gov.tr

## Loading for Development
1. Open `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select `fiber-chrome/` directory
5. Navigate to `adres.nvi.gov.tr`
6. Extension auto-injects content scripts

## Learnings
<!-- Updated by self-annealing loop -->

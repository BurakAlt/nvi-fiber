# 🕵️ Adversarial Code Review: 6-5 Komsu Ada Sematigi ve Seri Planlama

## ❌ OVERALL VERDICT: CHANGES REQUESTED
The implementation establishes a solid foundation for spatial navigation and breadcrumb history tracking. However, there are significant logic flaws in the history management, an XSS vulnerability in the new UI rendering, and the semantic traversal fails to properly fetch neighbors automatically upon navigation. I have discovered **6 specific issues** that must be resolved before this story can be considered complete.

---

## 🚨 CRITICAL / HIGH ISSUES

### 1. [Logic] Missing Auto-fetch of Neighbors on Navigation (`lib/marketing-data-house.js`, `content/panels.js`)
**Problem:** When `MarketingDataHouse.navigateToNeighbor(adaNo)` is called and switches to the target ada, it triggers `Panels.refresh()` which in turn renders the neighbor panel. However, `detectNeighbors(targetAda)` is NEVER called automatically after the switch.
**Impact:** A newly navigated (or automatically created) ada will always display an empty schematic ("Komsu ada bilgisi mevcut degil") holding stale/empty data until the user manually clicks "KOMSULARI TARA", which violates the acceptance criteria stating the schematic must update to the new ada's neighbors automatically.
**Expected Fix:** Auto-trigger `detectNeighbors` inside `navigateToNeighbor` before emitting the render refresh, or trigger it inside `renderNeighborPanel` if the cache is empty.

### 2. [Security] DOM-based XSS Risk inside Neighbor Panel (`content/panels.js`)
**Problem:** In `renderNeighborPanel()`, variables like `codeText` (derived from `n.adaCode` or `n.adaNo`) are concatenated directly into an `innerHTML` string (`html += '<span class="fp-neighbor-code">' + codeText + '</span>'`) without escaping. 
**Impact:** Since `adaCode` can easily be injected via a malicious or malformed Topology `.json` import upload, this directly exposes a DOM-based Cross-Site Scripting (XSS) vulnerability.
**Expected Fix:** Utilize the existing `escapeHtml()` utility to properly sanitize `n.adaCode`, `n.adaNo`, and `statusLabel` before injecting them into the DOM.

### 3. [Logic] History Pollution on Deleted Target Adas (`lib/marketing-data-house.js`)
**Problem:** In `MarketingDataHouse.navigateToHistory(adaId)`, the function pushes `currentAda` onto the `_navigationHistory` array *before* validating if `Topology.getAda(adaId)` actually exists.
**Impact:** If a user tries to navigate back to an ada that was recently deleted from the topology, the function aborts (`return null;`), but `currentAda` has already been pushed to the history array. This creates a ghost/duplicate history entry that corrupts the breadcrumb.
**Expected Fix:** Move `_addToHistory(currentAda)` strictly *after* the `if (!targetAda) return null;` validation check.

---

## ⚠️ MEDIUM / LOW ISSUES

### 4. [Architecture/Edge Case] Fallback Ada Creation Mismatch (`lib/marketing-data-house.js`)
**Problem:** `_parseTopologyAdas` uses a fallback naming convention (`adaNo = 'T-' + a.id`) if an ada lacks a standard recognizable name or number. However, the exact equivalent search logic in `navigateToNeighbor(adaNo, adaId)` strictly searches `a.buildings[0].adaNo` or regexes for `Ada \d+`.
**Impact:** If `adaId` is missing from the data-attributes and a user attempts to navigate to a fallback neighbor (e.g. "T-5"), `navigateToNeighbor` won't find it and will inadvertently create a brand new duplicate ada named "Ada T-5".
**Expected Fix:** Guarantee that `adaId` is strictly utilized, or make `navigateToNeighbor` recognize the `T-` string fallback logic during its search loop.

### 5. [Test Coverage] `detectNeighbors` DOM Logic is Untested (`dashboard/test-marketing-data-house.html`)
**Problem:** The unit tests for `detectNeighbors` execute in a mocked sandbox environment without any NVI DOM `<select>` elements or mock tables for `NviScraper.scrapeAllRows()`.
**Impact:** The test suite passes exclusively via the Topology caching fallback. The core AC requirement (parsing NVI DOM dropdowns and tables) is completely untested and immune to regression checks.
**Expected Fix:** Create dummy `document.querySelectorAll('select')` DOM trees and mock `NviScraper.scrapeAllRows` strictly within the test suite before running the assertions.

### 6. [UX/Inconsistency] Native Navigations Bypass the Breadcrumb (`content/panels.js`, `lib/topology.js`)
**Problem:** The breadcrumb tracks array pushes specifically hooked to `navigateToNeighbor`. If a user manually changes the active ada using the native application UI tabs or the general select dropdown (`Topology.switchView`), these transitions are entirely missed.
**Impact:** The breadcrumb easily becomes out of sync with the user's actual navigation flow, leading to confusing states where the breadcrumb portrays a conflicting path.
**Expected Fix:** Listen to `activeAdaId` changes globally via `EventBus` rather than only within sibling traversal methods, or visibly label the breadcrumb as exclusively "Sematik Gezinme Gecmisi" to clarify the limitation.

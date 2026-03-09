/**
 * FiberPlan Debug Bridge
 * Intercepts all console output, captures errors, sends to local Python monitor.
 *
 * Usage: Automatically active when extension loads.
 * Monitor: Run `python scripts/log-monitor.py` to see real-time logs.
 *
 * Log levels: LOG, WARN, ERROR, EXCEPTION, DOM, NET
 */

const FPDebug = (() => {
  const CONFIG = {
    enabled: true,
    serverUrl: 'http://127.0.0.1:7777/log',
    bufferSize: 200,
    sendInterval: 500,    // ms - batch send interval
    captureDOM: true,     // capture DOM mutations
    captureNet: true,     // capture fetch/XHR
    captureConsole: true, // intercept console.*
    captureErrors: true   // window.onerror + unhandledrejection
  };

  const buffer = [];
  const history = [];
  let sendTimer = null;
  let sequence = 0;
  const startTime = Date.now();

  /**
   * Create log entry
   */
  function entry(level, source, message, data) {
    const item = {
      seq: ++sequence,
      ts: Date.now(),
      elapsed: Date.now() - startTime,
      level: level,
      source: source,
      message: String(message),
      data: data || null,
      url: window.location.href
    };

    history.push(item);
    if (history.length > CONFIG.bufferSize) history.shift();

    buffer.push(item);
    scheduleSend();

    return item;
  }

  /**
   * Batch send logs to Python monitor
   */
  function scheduleSend() {
    if (sendTimer) return;
    sendTimer = setTimeout(() => {
      sendTimer = null;
      if (buffer.length === 0) return;

      const batch = buffer.splice(0);

      fetch(CONFIG.serverUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent: 'FiberPlan', batch: batch }),
        keepalive: true
      }).catch(() => {
        // Server not running - silently fail
      });
    }, CONFIG.sendInterval);
  }

  /**
   * Intercept console methods
   */
  function hookConsole() {
    if (!CONFIG.captureConsole) return;

    const orig = {
      log: console.log.bind(console),
      warn: console.warn.bind(console),
      error: console.error.bind(console),
      info: console.info.bind(console)
    };

    console.log = (...args) => {
      orig.log(...args);
      const msg = args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 0) : String(a)).join(' ');
      if (msg.includes('[FiberPlan]')) {
        entry('LOG', 'console', msg);
      }
    };

    console.warn = (...args) => {
      orig.warn(...args);
      const msg = args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 0) : String(a)).join(' ');
      entry('WARN', 'console', msg);
    };

    console.error = (...args) => {
      orig.error(...args);
      const msg = args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 0) : String(a)).join(' ');
      entry('ERROR', 'console', msg);
    };

    console.info = (...args) => {
      orig.info(...args);
      const msg = args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 0) : String(a)).join(' ');
      if (msg.includes('[FiberPlan]')) {
        entry('LOG', 'console', msg);
      }
    };
  }

  /**
   * Capture uncaught errors and unhandled rejections
   */
  function hookErrors() {
    if (!CONFIG.captureErrors) return;

    window.addEventListener('error', (e) => {
      entry('EXCEPTION', 'window.onerror', e.message, {
        filename: e.filename,
        lineno: e.lineno,
        colno: e.colno,
        stack: e.error?.stack || ''
      });
    });

    window.addEventListener('unhandledrejection', (e) => {
      const reason = e.reason;
      entry('EXCEPTION', 'unhandledrejection',
        reason?.message || String(reason), {
          stack: reason?.stack || ''
        });
    });
  }

  /**
   * Monitor DOM changes relevant to NVI table
   */
  function hookDOM() {
    if (!CONFIG.captureDOM) return;

    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        // Track when NVI result rows appear/disappear
        for (const node of m.addedNodes) {
          if (node.nodeType !== 1) continue;

          // BB rows added
          if (node.matches && node.matches('tr[bagimsizbolumkimlikno]')) {
            const binaNo = node.querySelector('label[id="binaNo"]')?.textContent || '?';
            const blokAdi = node.querySelector('label[id="blokAdi"]')?.textContent || '?';
            entry('DOM', 'table', `BB row added: ${blokAdi} (binaNo: ${binaNo})`);
          }

          // Check children too
          const bbRows = node.querySelectorAll ? node.querySelectorAll('tr[bagimsizbolumkimlikno]') : [];
          if (bbRows.length > 0) {
            entry('DOM', 'table', `${bbRows.length} BB rows appeared in DOM`);
          }

          // Map container
          if (node.matches && (node.matches('.leaflet-container') || node.classList?.contains('leaflet-container'))) {
            entry('DOM', 'map', 'Leaflet map container appeared');
          }
          const mapEl = node.querySelector ? node.querySelector('.leaflet-container') : null;
          if (mapEl) {
            entry('DOM', 'map', 'Leaflet map found inside added node');
          }

          // Doğrula buttons
          const verifyBtns = node.querySelectorAll ? node.querySelectorAll('.haritaDogrulaButton') : [];
          if (verifyBtns.length > 0) {
            entry('DOM', 'button', `${verifyBtns.length} Dogrula buttons appeared`);
          }

          // FP injected buttons
          const fpBtns = node.querySelectorAll ? node.querySelectorAll('.fp-add-btn') : [];
          if (fpBtns.length > 0) {
            entry('DOM', 'inject', `${fpBtns.length} FP buttons injected`);
          }
        }
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
    entry('DOM', 'observer', 'DOM mutation observer started');
  }

  /**
   * Snapshot current NVI page state for debugging
   */
  function snapshot() {
    const bbRows = document.querySelectorAll('tr[bagimsizbolumkimlikno]');
    const verifyBtns = document.querySelectorAll('.haritaDogrulaButton');
    const fpBtns = document.querySelectorAll('.fp-add-btn');
    const mapEl = document.querySelector('.leaflet-container');
    const tables = document.querySelectorAll('table');

    const snap = {
      url: window.location.href,
      title: document.title,
      bbRows: bbRows.length,
      verifyButtons: verifyBtns.length,
      fpButtons: fpBtns.length,
      hasMap: !!mapEl,
      tables: tables.length,
      bodyClasses: document.body.className,
      timestamp: new Date().toISOString()
    };

    // Sample first BB row structure
    if (bbRows.length > 0) {
      const row = bbRows[0];
      snap.sampleRow = {
        attr: row.getAttribute('bagimsizbolumkimlikno'),
        tds: row.querySelectorAll('td').length,
        labels: Array.from(row.querySelectorAll('label')).map(l => ({
          id: l.id,
          text: l.textContent.trim().substring(0, 50)
        })),
        html: row.outerHTML.substring(0, 500)
      };
    }

    entry('LOG', 'snapshot', 'Page state captured', snap);
    return snap;
  }

  /**
   * Initialize debug system
   */
  function init() {
    if (!CONFIG.enabled) return;

    hookConsole();
    hookErrors();
    hookDOM();

    entry('LOG', 'debug', 'FPDebug initialized', {
      url: window.location.href,
      userAgent: navigator.userAgent.substring(0, 100)
    });

    // Auto-snapshot after page settles
    setTimeout(() => snapshot(), 3000);
    setTimeout(() => snapshot(), 8000);

    // Expose to window for manual debugging
    window.__FPDebug = {
      snapshot,
      history: () => history,
      config: CONFIG,
      scrapeTest: () => {
        if (typeof NviScraper !== 'undefined') {
          const result = NviScraper.extractAll();
          entry('LOG', 'manual', 'Manual scrape test', {
            rows: result.rows.length,
            buildings: result.buildings.length,
            adaGroups: result.adaGroups.size,
            buildingNames: result.buildings.map(b => `${b.name} (${b.bb} BB)`)
          });
          return result;
        }
        return 'NviScraper not loaded';
      }
    };
  }

  return { init, entry, snapshot, history: () => history };
})();

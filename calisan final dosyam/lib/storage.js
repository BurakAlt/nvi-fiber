/**
 * Storage - chrome.storage.local wrapper for persistent project data
 * Uses chrome.storage.local instead of IndexedDB so data is shared
 * across all extension contexts (content script, popup, dashboard page)
 */

const Storage = (() => {
  const PREFIX = 'fp_';
  const DEFAULT_KEY = 'current';

  /**
   * Initialize storage (no-op for chrome.storage, kept for API compat)
   */
  function init() {
    return Promise.resolve();
  }

  /**
   * Save project state
   */
  function save(data, key) {
    key = PREFIX + (key || DEFAULT_KEY);
    return new Promise(function(resolve, reject) {
      var obj = {};
      obj[key] = { data: data, updatedAt: new Date().toISOString() };
      chrome.storage.local.set(obj, function() {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Load project state
   */
  function load(key) {
    key = PREFIX + (key || DEFAULT_KEY);
    return new Promise(function(resolve, reject) {
      chrome.storage.local.get(key, function(result) {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          var entry = result[key];
          resolve(entry ? entry.data : null);
        }
      });
    });
  }

  /**
   * List all saved project keys
   */
  function listProjects() {
    return new Promise(function(resolve, reject) {
      chrome.storage.local.get(null, function(result) {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          var keys = Object.keys(result)
            .filter(function(k) { return k.indexOf(PREFIX) === 0; })
            .map(function(k) { return k.substring(PREFIX.length); });
          resolve(keys);
        }
      });
    });
  }

  /**
   * Delete a project
   */
  function deleteProject(key) {
    key = PREFIX + (key || DEFAULT_KEY);
    return new Promise(function(resolve, reject) {
      chrome.storage.local.remove(key, function() {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Auto-save: saves current Topology state
   */
  function autoSave() {
    try {
      var state = Topology.getState();
      return save(state);
    } catch (e) {
      console.warn('[FiberPlan] Auto-save failed:', e);
      return Promise.resolve();
    }
  }

  /**
   * Auto-load: restores Topology state from storage
   */
  function autoLoad() {
    return load().then(function(state) {
      if (state) {
        Topology.loadState(state);
        return true;
      }
      return false;
    }).catch(function(e) {
      console.warn('[FiberPlan] Auto-load failed:', e);
      return false;
    });
  }

  /**
   * Save custom catalog entries
   */
  function saveCatalog(customEntries) {
    return new Promise(function(resolve, reject) {
      var obj = {};
      obj['fp_catalog_custom'] = customEntries;
      chrome.storage.local.set(obj, function() {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Load custom catalog entries
   */
  function loadCatalog() {
    return new Promise(function(resolve, reject) {
      chrome.storage.local.get('fp_catalog_custom', function(result) {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(result['fp_catalog_custom'] || null);
        }
      });
    });
  }

  // Public API
  return {
    init: init,
    save: save,
    load: load,
    listProjects: listProjects,
    deleteProject: deleteProject,
    autoSave: autoSave,
    autoLoad: autoLoad,
    saveCatalog: saveCatalog,
    loadCatalog: loadCatalog
  };
})();

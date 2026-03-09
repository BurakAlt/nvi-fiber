/**
 * GDrive - Google Drive REST API v3 wrapper for FiberPlan
 * Uses chrome.identity for OAuth2 token management
 * ES5+ compatible
 */

var GDrive = (function() {
  'use strict';

  var FOLDER_NAME = 'FiberPlan';
  var MIME_JSON = 'application/json';
  var MIME_FOLDER = 'application/vnd.google-apps.folder';
  var API_BASE = 'https://www.googleapis.com';

  var _folderId = null; // Cached FiberPlan folder ID

  /**
   * Get OAuth2 token via chrome.identity
   * @param {boolean} interactive - Show login popup if needed
   * @returns {Promise<string>} access token
   */
  function getToken(interactive) {
    return new Promise(function(resolve, reject) {
      if (!chrome || !chrome.identity) {
        reject(new Error('chrome.identity API mevcut degil'));
        return;
      }
      chrome.identity.getAuthToken({ interactive: !!interactive }, function(token) {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        resolve(token);
      });
    });
  }

  /**
   * Revoke current token (logout)
   */
  function revokeToken() {
    return new Promise(function(resolve, reject) {
      chrome.identity.getAuthToken({ interactive: false }, function(token) {
        if (!token) { resolve(); return; }
        chrome.identity.removeCachedAuthToken({ token: token }, function() {
          // Also revoke on Google's side
          var xhr = new XMLHttpRequest();
          xhr.open('GET', 'https://accounts.google.com/o/oauth2/revoke?token=' + token);
          xhr.onload = function() { _folderId = null; resolve(); };
          xhr.onerror = function() { resolve(); }; // ignore revoke errors
          xhr.send();
        });
      });
    });
  }

  /**
   * Authenticated API request with auto-refresh on 401
   */
  function apiRequest(method, url, body, contentType) {
    return getToken(false).then(function(token) {
      return doRequest(method, url, body, contentType, token);
    }).then(function(result) {
      return result;
    }).catch(function(err) {
      if (err && err.status === 401) {
        // Token expired, get a fresh one
        return new Promise(function(resolve, reject) {
          chrome.identity.removeCachedAuthToken({ token: '' }, function() {
            getToken(true).then(function(newToken) {
              return doRequest(method, url, body, contentType, newToken);
            }).then(resolve).catch(reject);
          });
        });
      }
      throw err;
    });
  }

  function doRequest(method, url, body, contentType, token) {
    return new Promise(function(resolve, reject) {
      var xhr = new XMLHttpRequest();
      xhr.open(method, url);
      xhr.setRequestHeader('Authorization', 'Bearer ' + token);
      if (contentType) xhr.setRequestHeader('Content-Type', contentType);
      xhr.onload = function() {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            resolve(xhr.responseText ? JSON.parse(xhr.responseText) : null);
          } catch (e) {
            resolve(xhr.responseText);
          }
        } else {
          var err = new Error('API Error: ' + xhr.status);
          err.status = xhr.status;
          err.body = xhr.responseText;
          reject(err);
        }
      };
      xhr.onerror = function() { reject(new Error('Ag hatasi')); };
      xhr.send(body || null);
    });
  }

  /**
   * Ensure FiberPlan folder exists in Drive root
   */
  function ensureFolder() {
    if (_folderId) return Promise.resolve(_folderId);

    var searchUrl = API_BASE + '/drive/v3/files?q=' +
      encodeURIComponent("name='" + FOLDER_NAME + "' and mimeType='" + MIME_FOLDER + "' and trashed=false") +
      '&fields=files(id,name)&spaces=drive';

    return apiRequest('GET', searchUrl).then(function(result) {
      if (result.files && result.files.length > 0) {
        _folderId = result.files[0].id;
        return _folderId;
      }
      // Create folder
      var meta = JSON.stringify({ name: FOLDER_NAME, mimeType: MIME_FOLDER });
      return apiRequest('POST', API_BASE + '/drive/v3/files', meta, MIME_JSON).then(function(folder) {
        _folderId = folder.id;
        return _folderId;
      });
    });
  }

  /**
   * List saved projects in FiberPlan folder
   */
  function listProjects() {
    return ensureFolder().then(function(folderId) {
      var url = API_BASE + '/drive/v3/files?q=' +
        encodeURIComponent("'" + folderId + "' in parents and trashed=false") +
        '&fields=files(id,name,modifiedTime,size)&orderBy=modifiedTime desc';
      return apiRequest('GET', url).then(function(r) { return r.files || []; });
    });
  }

  /**
   * Save project to Drive (create or update)
   * @param {Object} data - Project data to save
   * @param {string|null} fileId - Existing file ID to update, null to create
   * @param {string} fileName - File name
   */
  function saveProject(data, fileId, fileName) {
    var content = JSON.stringify(data, null, 2);
    var boundary = 'fp_boundary_' + Date.now();
    var name = fileName || ('FiberPlan_' + new Date().toISOString().split('T')[0] + '.json');

    if (fileId) {
      // Update existing file (PATCH)
      var updateBody = '--' + boundary + '\r\n' +
        'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
        JSON.stringify({ name: name }) + '\r\n' +
        '--' + boundary + '\r\n' +
        'Content-Type: application/json\r\n\r\n' +
        content + '\r\n' +
        '--' + boundary + '--';

      return apiRequest('PATCH',
        API_BASE + '/upload/drive/v3/files/' + fileId + '?uploadType=multipart&fields=id,name,modifiedTime',
        updateBody,
        'multipart/related; boundary=' + boundary
      );
    }

    // Create new file
    return ensureFolder().then(function(folderId) {
      var createBody = '--' + boundary + '\r\n' +
        'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
        JSON.stringify({ name: name, parents: [folderId] }) + '\r\n' +
        '--' + boundary + '\r\n' +
        'Content-Type: application/json\r\n\r\n' +
        content + '\r\n' +
        '--' + boundary + '--';

      return apiRequest('POST',
        API_BASE + '/upload/drive/v3/files?uploadType=multipart&fields=id,name,modifiedTime',
        createBody,
        'multipart/related; boundary=' + boundary
      );
    });
  }

  /**
   * Load project from Drive
   */
  function loadProject(fileId) {
    return apiRequest('GET', API_BASE + '/drive/v3/files/' + fileId + '?alt=media');
  }

  /**
   * List revisions of a file
   */
  function listRevisions(fileId) {
    return apiRequest('GET', API_BASE + '/drive/v3/files/' + fileId + '/revisions?fields=revisions(id,modifiedTime,size)');
  }

  /**
   * Load a specific revision
   */
  function loadRevision(fileId, revisionId) {
    return apiRequest('GET', API_BASE + '/drive/v3/files/' + fileId + '/revisions/' + revisionId + '?alt=media');
  }

  /**
   * Delete a project file
   */
  function deleteProject(fileId) {
    return apiRequest('DELETE', API_BASE + '/drive/v3/files/' + fileId);
  }

  /**
   * Check if user is authenticated (non-interactive)
   */
  function isAuthenticated() {
    return getToken(false).then(function() { return true; }).catch(function() { return false; });
  }

  return {
    getToken: getToken,
    revokeToken: revokeToken,
    ensureFolder: ensureFolder,
    listProjects: listProjects,
    saveProject: saveProject,
    loadProject: loadProject,
    listRevisions: listRevisions,
    loadRevision: loadRevision,
    deleteProject: deleteProject,
    isAuthenticated: isAuthenticated
  };
})();

/**
 * WsBridge - WebSocket client for Chrome Extension ↔ Sync Server
 * Connects to ws://localhost:8000/ws/sync/chrome
 * Auto-reconnect every 5 seconds on disconnect
 */

var WsBridge = (function() {
  var ws = null;
  var connected = false;
  var reconnectTimer = null;
  var url = 'ws://localhost:8000/ws/sync/chrome';
  var statusCallback = null;
  var messageHandlers = {};

  /**
   * Connect to sync server
   * @param {Function} onStatusChange - called with (boolean) on connect/disconnect
   */
  function connect(onStatusChange) {
    statusCallback = onStatusChange || function() {};

    if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    try {
      ws = new WebSocket(url);

      ws.onopen = function() {
        connected = true;
        console.log('[WsBridge] Connected to ' + url);
        statusCallback(true);
        // Clear reconnect timer on successful connect
        if (reconnectTimer) {
          clearTimeout(reconnectTimer);
          reconnectTimer = null;
        }
      };

      ws.onclose = function(e) {
        connected = false;
        console.log('[WsBridge] Disconnected (code: ' + e.code + ')');
        statusCallback(false);
        scheduleReconnect();
      };

      ws.onerror = function(e) {
        console.warn('[WsBridge] Connection error');
      };

      ws.onmessage = function(e) {
        try {
          var data = JSON.parse(e.data);
          var type = data.type;
          if (type && messageHandlers[type]) {
            messageHandlers[type](data);
          }
        } catch (err) {
          console.warn('[WsBridge] Parse error:', err);
        }
      };
    } catch (err) {
      console.warn('[WsBridge] WebSocket creation failed:', err);
      scheduleReconnect();
    }
  }

  /**
   * Schedule auto-reconnect (5 second delay)
   */
  function scheduleReconnect() {
    if (reconnectTimer) return;
    reconnectTimer = setTimeout(function() {
      reconnectTimer = null;
      console.log('[WsBridge] Reconnecting...');
      connect(statusCallback);
    }, 5000);
  }

  /**
   * Disconnect from server
   */
  function disconnect() {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    if (ws) {
      ws.onclose = null; // Prevent auto-reconnect
      ws.close();
      ws = null;
    }
    connected = false;
    if (statusCallback) statusCallback(false);
  }

  /**
   * Send message to server
   * @param {string} type - Message type (e.g. 'TRANSFER_BUILDINGS')
   * @param {object} data - Message payload
   */
  function send(type, data) {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      console.warn('[WsBridge] Cannot send - not connected');
      return false;
    }

    var msg = Object.assign({}, data || {}, { type: type });
    ws.send(JSON.stringify(msg));
    console.log('[WsBridge] Sent: ' + type);
    return true;
  }

  /**
   * Register handler for incoming message type
   * @param {string} type - Message type to listen for
   * @param {Function} handler - Called with parsed message data
   */
  function on(type, handler) {
    messageHandlers[type] = handler;
  }

  /**
   * Check connection status
   */
  function isConnected() {
    return connected;
  }

  return {
    connect: connect,
    disconnect: disconnect,
    send: send,
    on: on,
    isConnected: isConnected
  };
})();

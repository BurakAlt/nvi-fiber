/**
 * SpeedTest — Hiz Testi Motoru
 * Download/Upload hizi, latency ve jitter olcumu yapar.
 * Demo modda simule edilmis sonuclar uretir.
 */
const SpeedTest = (() => {
  'use strict';

  let _running = false;
  let _cancelled = false;
  let _onProgress = null;

  /**
   * Hiz testi baslatir
   * @param {object} opts — { planDownload, planUpload, onProgress, testServerUrl }
   * @returns {Promise<{download, upload, latency, jitter}>}
   */
  async function run(opts) {
    opts = opts || {};
    if (_running) return { ok: false, error: 'Test zaten calisiyor' };
    _running = true;
    _cancelled = false;
    _onProgress = opts.onProgress || null;

    try {
      // Faz 1: Latency testi
      _notify('latency', 0, 'Latency olculuyor...');
      var latencyResult = await _measureLatency(opts.testServerUrl);
      if (_cancelled) return _cancelResult();

      // Faz 2: Download testi
      _notify('download', 0, 'Download hizi olculuyor...');
      var downloadResult = await _measureDownload(opts.planDownload || 100, opts.testServerUrl);
      if (_cancelled) return _cancelResult();

      // Faz 3: Upload testi
      _notify('upload', 0, 'Upload hizi olculuyor...');
      var uploadResult = await _measureUpload(opts.planUpload || 20, opts.testServerUrl);
      if (_cancelled) return _cancelResult();

      _notify('complete', 100, 'Test tamamlandi');

      return {
        ok: true,
        data: {
          download: downloadResult,
          upload: uploadResult,
          latency: latencyResult.avg,
          jitter: latencyResult.jitter,
          timestamp: new Date().toISOString()
        }
      };
    } finally {
      _running = false;
    }
  }

  function cancel() {
    _cancelled = true;
  }

  function isRunning() { return _running; }

  function _cancelResult() {
    return { ok: false, error: 'Test iptal edildi' };
  }

  function _notify(phase, progress, message) {
    if (_onProgress) {
      _onProgress({ phase: phase, progress: progress, message: message });
    }
  }

  // ── Demo: Simule edilmis latency olcumu ──
  async function _measureLatency(serverUrl) {
    var samples = [];
    var count = 20;
    for (var i = 0; i < count; i++) {
      if (_cancelled) break;
      // Gercek ortamda: serverUrl'a HTTP HEAD veya WebSocket ping
      await _sleep(50);
      var latency = 5 + Math.random() * 20 + (Math.random() > 0.9 ? 15 : 0);
      samples.push(latency);
      _notify('latency', Math.round((i + 1) / count * 100), 'Ping: ' + Math.round(latency) + ' ms');
    }

    // Median hesapla
    samples.sort(function(a, b) { return a - b; });
    var mid = Math.floor(samples.length / 2);
    var median = samples.length % 2 === 0 ? (samples[mid - 1] + samples[mid]) / 2 : samples[mid];

    // Jitter: ardindan olcumler arasindaki ortalama fark
    var jitterSum = 0;
    for (var j = 1; j < samples.length; j++) {
      jitterSum += Math.abs(samples[j] - samples[j - 1]);
    }
    var jitter = samples.length > 1 ? jitterSum / (samples.length - 1) : 0;

    return {
      avg: Math.round(median * 10) / 10,
      jitter: Math.round(jitter * 10) / 10,
      samples: samples
    };
  }

  // ── Demo: Simule edilmis download olcumu ──
  async function _measureDownload(planMbps, serverUrl) {
    var steps = 30;
    var currentSpeed = 0;
    var maxSpeed = planMbps * (0.8 + Math.random() * 0.2);
    var rampUp = 10; // ilk N adim rampa

    for (var i = 0; i < steps; i++) {
      if (_cancelled) break;
      await _sleep(100);

      if (i < rampUp) {
        currentSpeed = maxSpeed * (i / rampUp) * (0.9 + Math.random() * 0.2);
      } else {
        currentSpeed = maxSpeed * (0.9 + Math.random() * 0.15);
      }
      currentSpeed = Math.max(0, currentSpeed);

      _notify('download', Math.round((i + 1) / steps * 100),
        Math.round(currentSpeed * 10) / 10 + ' Mbps');
    }

    return Math.round(maxSpeed * 10) / 10;
  }

  // ── Demo: Simule edilmis upload olcumu ──
  async function _measureUpload(planMbps, serverUrl) {
    var steps = 25;
    var currentSpeed = 0;
    var maxSpeed = planMbps * (0.75 + Math.random() * 0.25);
    var rampUp = 8;

    for (var i = 0; i < steps; i++) {
      if (_cancelled) break;
      await _sleep(100);

      if (i < rampUp) {
        currentSpeed = maxSpeed * (i / rampUp) * (0.85 + Math.random() * 0.3);
      } else {
        currentSpeed = maxSpeed * (0.85 + Math.random() * 0.2);
      }
      currentSpeed = Math.max(0, currentSpeed);

      _notify('upload', Math.round((i + 1) / steps * 100),
        Math.round(currentSpeed * 10) / 10 + ' Mbps');
    }

    return Math.round(maxSpeed * 10) / 10;
  }

  function _sleep(ms) {
    return new Promise(function(resolve) { setTimeout(resolve, ms); });
  }

  return {
    run: run,
    cancel: cancel,
    isRunning: isRunning
  };
})();

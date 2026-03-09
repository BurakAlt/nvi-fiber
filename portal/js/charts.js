/**
 * PortalCharts — Canvas bazli basit grafik helper
 * Harici kutuphane kullanmadan sparkline, gauge, bar chart cizer.
 */
const PortalCharts = (() => {
  'use strict';

  // ── Renkler ──
  const COLORS = {
    primary: '#6366f1',
    success: '#22c55e',
    warning: '#f59e0b',
    danger: '#ef4444',
    text: '#e2e8f0',
    textDim: '#94a3b8',
    grid: '#1e293b',
    bg: '#0f172a',
    surface: '#1e293b'
  };

  /**
   * Sparkline cizer — kucuk trend grafik
   * @param {HTMLCanvasElement} canvas
   * @param {number[]} values
   * @param {object} opts — { color, fillAlpha, lineWidth }
   */
  function sparkline(canvas, values, opts) {
    if (!canvas || !values || values.length < 2) return;
    opts = opts || {};
    var ctx = canvas.getContext('2d');
    var w = canvas.width = canvas.offsetWidth * (window.devicePixelRatio || 1);
    var h = canvas.height = canvas.offsetHeight * (window.devicePixelRatio || 1);
    ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
    var dw = canvas.offsetWidth;
    var dh = canvas.offsetHeight;
    ctx.clearRect(0, 0, w, h);

    var min = Math.min.apply(null, values);
    var max = Math.max.apply(null, values);
    var range = max - min || 1;
    var pad = 4;
    var step = (dw - pad * 2) / (values.length - 1);
    var color = opts.color || COLORS.primary;

    // Cizgi
    ctx.beginPath();
    for (var i = 0; i < values.length; i++) {
      var x = pad + i * step;
      var y = dh - pad - ((values[i] - min) / range) * (dh - pad * 2);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = opts.lineWidth || 2;
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Dolgu
    if (opts.fillAlpha) {
      ctx.lineTo(pad + (values.length - 1) * step, dh - pad);
      ctx.lineTo(pad, dh - pad);
      ctx.closePath();
      ctx.fillStyle = color.replace(')', ', ' + opts.fillAlpha + ')').replace('rgb', 'rgba');
      if (color.charAt(0) === '#') {
        var r = parseInt(color.slice(1, 3), 16);
        var g = parseInt(color.slice(3, 5), 16);
        var b = parseInt(color.slice(5, 7), 16);
        ctx.fillStyle = 'rgba(' + r + ',' + g + ',' + b + ',' + opts.fillAlpha + ')';
      }
      ctx.fill();
    }
  }

  /**
   * Gauge (yarim daire skor gosterge) cizer
   * @param {HTMLCanvasElement} canvas
   * @param {number} value — 0-100 arasi
   * @param {object} opts — { label, colors }
   */
  function gauge(canvas, value, opts) {
    if (!canvas) return;
    opts = opts || {};
    var ctx = canvas.getContext('2d');
    var dpr = window.devicePixelRatio || 1;
    var size = Math.min(canvas.offsetWidth, canvas.offsetHeight);
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, size, size);

    var cx = size / 2;
    var cy = size * 0.6;
    var r = size * 0.38;
    var lw = size * 0.1;
    var startAngle = Math.PI;
    var endAngle = 2 * Math.PI;

    // Arka plan yayi
    ctx.beginPath();
    ctx.arc(cx, cy, r, startAngle, endAngle);
    ctx.strokeStyle = COLORS.grid;
    ctx.lineWidth = lw;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Deger yayi
    var pct = Math.max(0, Math.min(100, value)) / 100;
    var valAngle = startAngle + pct * Math.PI;
    var color = value >= 70 ? COLORS.success : value >= 40 ? COLORS.warning : COLORS.danger;
    ctx.beginPath();
    ctx.arc(cx, cy, r, startAngle, valAngle);
    ctx.strokeStyle = color;
    ctx.lineWidth = lw;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Skor metni
    ctx.fillStyle = COLORS.text;
    ctx.textAlign = 'center';
    ctx.font = 'bold ' + Math.round(size * 0.2) + 'px sans-serif';
    ctx.fillText(Math.round(value), cx, cy - 4);

    // Etiket
    if (opts.label) {
      ctx.fillStyle = COLORS.textDim;
      ctx.font = Math.round(size * 0.09) + 'px sans-serif';
      ctx.fillText(opts.label, cx, cy + size * 0.15);
    }
  }

  /**
   * Yatay bar chart cizer
   * @param {HTMLCanvasElement} canvas
   * @param {Array<{label:string, value:number, color?:string}>} items
   */
  function barChart(canvas, items, opts) {
    if (!canvas || !items || items.length === 0) return;
    opts = opts || {};
    var ctx = canvas.getContext('2d');
    var dpr = window.devicePixelRatio || 1;
    var dw = canvas.offsetWidth;
    var dh = canvas.offsetHeight;
    canvas.width = dw * dpr;
    canvas.height = dh * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, dw, dh);

    var max = 0;
    for (var i = 0; i < items.length; i++) { if (items[i].value > max) max = items[i].value; }
    if (max === 0) max = 1;

    var barH = Math.min(28, (dh - 20) / items.length - 6);
    var labelW = opts.labelWidth || 100;
    var barArea = dw - labelW - 60;

    for (var j = 0; j < items.length; j++) {
      var y = 10 + j * (barH + 6);
      var bw = (items[j].value / max) * barArea;
      var color = items[j].color || COLORS.primary;

      // Etiket
      ctx.fillStyle = COLORS.textDim;
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(items[j].label, labelW - 8, y + barH / 2);

      // Bar
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.roundRect(labelW, y, Math.max(bw, 2), barH, 4);
      ctx.fill();

      // Deger
      ctx.fillStyle = COLORS.text;
      ctx.textAlign = 'left';
      ctx.fillText(items[j].value + (opts.unit || ''), labelW + bw + 8, y + barH / 2);
    }
  }

  /**
   * Doughnut chart cizer
   * @param {HTMLCanvasElement} canvas
   * @param {Array<{label:string, value:number, color:string}>} segments
   * @param {object} opts — { centerText }
   */
  function doughnut(canvas, segments, opts) {
    if (!canvas || !segments || segments.length === 0) return;
    opts = opts || {};
    var ctx = canvas.getContext('2d');
    var dpr = window.devicePixelRatio || 1;
    var size = Math.min(canvas.offsetWidth, canvas.offsetHeight);
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, size, size);

    var cx = size / 2;
    var cy = size / 2;
    var r = size * 0.38;
    var lw = size * 0.15;

    var total = 0;
    for (var i = 0; i < segments.length; i++) total += segments[i].value;
    if (total === 0) total = 1;

    var angle = -Math.PI / 2;
    for (var j = 0; j < segments.length; j++) {
      var sliceAngle = (segments[j].value / total) * 2 * Math.PI;
      ctx.beginPath();
      ctx.arc(cx, cy, r, angle, angle + sliceAngle);
      ctx.strokeStyle = segments[j].color;
      ctx.lineWidth = lw;
      ctx.lineCap = 'butt';
      ctx.stroke();
      angle += sliceAngle;
    }

    // Merkez metin
    if (opts.centerText) {
      ctx.fillStyle = COLORS.text;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = 'bold ' + Math.round(size * 0.15) + 'px sans-serif';
      ctx.fillText(opts.centerText, cx, cy);
    }
  }

  /**
   * Speedometer animasyonlu gauge cizer
   * @param {HTMLCanvasElement} canvas
   * @param {number} targetValue — hedef deger
   * @param {number} maxValue — max skala
   * @param {object} opts — { unit, duration, onUpdate }
   */
  function speedometer(canvas, targetValue, maxValue, opts) {
    if (!canvas) return;
    opts = opts || {};
    var duration = opts.duration || 1500;
    var unit = opts.unit || 'Mbps';
    var ctx = canvas.getContext('2d');
    var dpr = window.devicePixelRatio || 1;
    var size = Math.min(canvas.offsetWidth, canvas.offsetHeight);
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    var cx = size / 2;
    var cy = size * 0.55;
    var r = size * 0.4;
    var startAngle = 0.75 * Math.PI;
    var endAngle = 2.25 * Math.PI;
    var totalArc = endAngle - startAngle;
    var startTime = null;

    function draw(currentVal) {
      ctx.clearRect(0, 0, size, size);
      var lw = size * 0.06;

      // Arka plan yayi
      ctx.beginPath();
      ctx.arc(cx, cy, r, startAngle, endAngle);
      ctx.strokeStyle = COLORS.grid;
      ctx.lineWidth = lw;
      ctx.lineCap = 'round';
      ctx.stroke();

      // Deger yayi
      var pct = Math.min(currentVal / maxValue, 1);
      var valAngle = startAngle + pct * totalArc;
      var gradient = ctx.createLinearGradient(cx - r, cy, cx + r, cy);
      gradient.addColorStop(0, COLORS.success);
      gradient.addColorStop(0.5, COLORS.warning);
      gradient.addColorStop(1, COLORS.danger);
      ctx.beginPath();
      ctx.arc(cx, cy, r, startAngle, valAngle);
      ctx.strokeStyle = gradient;
      ctx.lineWidth = lw;
      ctx.lineCap = 'round';
      ctx.stroke();

      // Deger
      ctx.fillStyle = COLORS.text;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = 'bold ' + Math.round(size * 0.18) + 'px sans-serif';
      ctx.fillText(Math.round(currentVal * 10) / 10, cx, cy - 8);

      // Birim
      ctx.fillStyle = COLORS.textDim;
      ctx.font = Math.round(size * 0.08) + 'px sans-serif';
      ctx.fillText(unit, cx, cy + size * 0.1);

      if (opts.onUpdate) opts.onUpdate(currentVal);
    }

    function animate(ts) {
      if (!startTime) startTime = ts;
      var elapsed = ts - startTime;
      var progress = Math.min(elapsed / duration, 1);
      // Ease-out
      var eased = 1 - Math.pow(1 - progress, 3);
      var currentVal = eased * targetValue;
      draw(currentVal);
      if (progress < 1) requestAnimationFrame(animate);
    }

    requestAnimationFrame(animate);
  }

  return {
    sparkline: sparkline,
    gauge: gauge,
    barChart: barChart,
    doughnut: doughnut,
    speedometer: speedometer,
    COLORS: COLORS
  };
})();

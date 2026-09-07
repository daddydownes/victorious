/* Flappy V clean-paint obstacle renderer.
   The supplied polygon remains the collision silhouette. Every obstacle pixel,
   including the flat V/star paint and its outward drips, is clipped inside it.
   `s.d` is the backing-store DPR used by the destination canvas. */
(function (root) {
  'use strict';

  var metalCache = new Map();
  var CACHE_LIMIT = 64;
  var CACHE_BYTE_LIMIT = 16 * 1024 * 1024, metalCacheBytes = 0;
  var PAINT = '#f0d492';

  function q(n, step) { return Math.round(n / step) * step; }
  function pathPolygon(g, p, ox, oy) {
    g.beginPath();
    g.moveTo(p[0][0] - ox, p[0][1] - oy);
    for (var i = 1; i < p.length; i++) g.lineTo(p[i][0] - ox, p[i][1] - oy);
    g.closePath();
  }
  function bounds(p) {
    var x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (var i = 0; i < p.length; i++) {
      x0 = Math.min(x0, p[i][0]); y0 = Math.min(y0, p[i][1]);
      x1 = Math.max(x1, p[i][0]); y1 = Math.max(y1, p[i][1]);
    }
    return { x: x0, y: y0, w: Math.max(1, x1 - x0), h: Math.max(1, y1 - y0) };
  }
  function cachePut(key, value) {
    var bytes = value.width * value.height * 4;
    if (bytes > CACHE_BYTE_LIMIT) return value;
    while (metalCache.size >= CACHE_LIMIT || metalCacheBytes + bytes > CACHE_BYTE_LIMIT) {
      var oldest = metalCache.keys().next().value, prior = metalCache.get(oldest);
      metalCacheBytes -= prior.width * prior.height * 4;
      metalCache.delete(oldest);
    }
    metalCache.set(key, value);
    metalCacheBytes += bytes;
    return value;
  }
  function makeCanvas(w, h) {
    var c = document.createElement('canvas');
    c.width = Math.max(2, w); c.height = Math.max(2, h);
    return c;
  }
  function addStopGradient(g, x0, y0, x1, y1, stops) {
    var gr = g.createLinearGradient(x0, y0, x1, y1);
    for (var i = 0; i < stops.length; i++) gr.addColorStop(stops[i][0], stops[i][1]);
    return gr;
  }

  function textureSprite(w, d, kind, side) {
    /* Height, translation and animation phase deliberately stay out of this key.
       One short vertical tile serves a pole while it deploys or moves. */
    var h = 192, rasterD = Math.min(d, 2048 / Math.max(1, w));
    var key = [q(w, 2), q(rasterD, .25), kind, side].join('|');
    if (metalCache.has(key)) return metalCache.get(key);

    var cw = Math.max(2, Math.ceil(w * rasterD)), ch = Math.max(2, Math.ceil(h * rasterD));
    var c = makeCanvas(cw, ch), g = c.getContext('2d');
    g.scale(rasterD, rasterD);

    // Quiet charcoal keeps the flat paint legible without adding a second texture language.
    g.fillStyle = addStopGradient(g, 0, 0, w, 0, [
      [0, '#151511'], [.24, '#302d24'], [.55, '#27251e'], [1, '#11110e']
    ]);
    g.fillRect(0, 0, w, h);

    return cachePut(key, c);
  }

  function passageSegments(p, side) {
    var area = 0, out = [];
    for (var i = 0, j = p.length - 1; i < p.length; j = i++)
      area += p[j][0] * p[i][1] - p[i][0] * p[j][1];
    for (i = 0; i < p.length; i++) {
      var a = p[i], z = p[(i + 1) % p.length];
      var dx = z[0] - a[0], dy = z[1] - a[1], len = Math.hypot(dx, dy);
      if (len < .01) continue;
      /* Shoelace sign works in canvas coordinates as written. */
      var ny = area >= 0 ? -dx / len : dx / len;
      if ((side === 0 && ny > .22) || (side === 1 && ny < -.22)) out.push([a, z]);
    }
    return out;
  }
  function strokeSegments(ctx, segments) {
    ctx.beginPath();
    for (var i = 0; i < segments.length; i++) {
      ctx.moveTo(segments[i][0][0], segments[i][0][1]);
      ctx.lineTo(segments[i][1][0], segments[i][1][1]);
    }
    ctx.stroke();
  }
  function verticalRange(p, x, fallback) {
    var ys = [];
    for (var i = 0; i < p.length; i++) {
      var a = p[i], z = p[(i + 1) % p.length], lo = Math.min(a[0], z[0]), hi = Math.max(a[0], z[0]);
      if (x < lo - .01 || x > hi + .01) continue;
      if (Math.abs(z[0] - a[0]) < .01) { ys.push(a[1], z[1]); continue; }
      var t = (x - a[0]) / (z[0] - a[0]);
      if (t >= 0 && t <= 1) ys.push(a[1] + (z[1] - a[1]) * t);
    }
    if (!ys.length) return { min: fallback.y, max: fallback.y + fallback.h };
    return { min: Math.min.apply(Math, ys), max: Math.max.apply(Math, ys) };
  }
  function logoContours(includeStar) {
    if (typeof FLAP_LOGO_CONTOURS === 'undefined' || !FLAP_LOGO_CONTOURS.length ||
        typeof VB === 'undefined') return [];
    if (includeStar || FLAP_LOGO_CONTOURS.length === 1) return FLAP_LOGO_CONTOURS;
    var best = FLAP_LOGO_CONTOURS[0], bestArea = 0;
    for (var i = 0; i < FLAP_LOGO_CONTOURS.length; i++) {
      var b = bounds(FLAP_LOGO_CONTOURS[i]), area = b.w * b.h;
      if (area > bestArea) { best = FLAP_LOGO_CONTOURS[i]; bestArea = area; }
    }
    return [best];
  }
  function fillLogo(ctx, cx, cy, height, includeStar) {
    var contours = logoContours(includeStar);
    if (!contours.length || height <= 0) return false;
    var scale = height / VB.h, left = cx - VB.w * scale / 2, top = cy - height / 2;
    ctx.beginPath();
    for (var i = 0; i < contours.length; i++) {
      var contour = contours[i];
      if (!contour.length) continue;
      ctx.moveTo(left + (contour[0][0] - VB.x) * scale, top + (contour[0][1] - VB.y) * scale);
      for (var j = 1; j < contour.length; j++)
        ctx.lineTo(left + (contour[j][0] - VB.x) * scale, top + (contour[j][1] - VB.y) * scale);
      ctx.closePath();
    }
    ctx.fillStyle = PAINT;
    ctx.fill();
    return true;
  }
  function passageY(segments, x, fallback) {
    var nearest = Infinity, result = fallback;
    for (var i = 0; i < segments.length; i++) {
      var a = segments[i][0], z = segments[i][1], lo = Math.min(a[0], z[0]), hi = Math.max(a[0], z[0]);
      var at = Math.max(lo, Math.min(hi, x)), distance = Math.abs(at - x);
      if (distance > nearest) continue;
      var t = Math.abs(z[0] - a[0]) < .01 ? 0 : (at - a[0]) / (z[0] - a[0]);
      nearest = distance; result = a[1] + (z[1] - a[1]) * t;
    }
    return result;
  }
  function drawFacePaint(ctx, polygon, b, side, segments) {
    var cx = b.x + b.w * .5, range = verticalRange(polygon, cx, b), depth = range.max - range.min;
    if (depth < 18 || !segments.length) return;
    var span = Math.min(112, b.w * .58), x0 = cx - span / 2, x1 = cx + span / 2;
    var lineW = Math.min(7, Math.max(4, depth * .15));
    var drip = Math.min(12, Math.max(5, depth * .23)), clear = 5;
    // The upper swash starts high enough for natural downward drips to end before
    // the passage; the lower swash starts below the same clear strip.
    var offset = side ? clear + lineW : -(clear + drip + lineW);
    function paintY(x) { return passageY(segments, x, side ? range.min : range.max) + offset; }

    ctx.strokeStyle = PAINT; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.lineWidth = lineW;
    ctx.beginPath();
    ctx.moveTo(x0, paintY(x0));
    ctx.lineTo(cx, paintY(cx) + lineW * .55);
    ctx.lineTo(x1, paintY(x1));
    ctx.stroke();

    // Two deliberate gravity drips use a soft shoulder, narrow neck and round
    // terminal bulb. The upper bulbs retain the same five-unit gap clearance.
    function roundedDrip(x, start, targetLength, available) {
      var bulbW = Math.max(3.4, lineW * .72), bulbR = bulbW / 2;
      var length = Math.min(targetLength, available) - bulbR;
      if (length <= 1.5) return;
      ctx.lineWidth = Math.max(1.6, lineW * .28);
      ctx.beginPath(); ctx.moveTo(x, start); ctx.lineTo(x, start + length); ctx.stroke();
      ctx.lineWidth = Math.max(2.2, lineW * .43);
      ctx.beginPath(); ctx.moveTo(x, start); ctx.lineTo(x, start + Math.min(2.2, length * .28)); ctx.stroke();
      ctx.lineWidth = bulbW;
      ctx.beginPath(); ctx.moveTo(x, start + length); ctx.lineTo(x + .01, start + length); ctx.stroke();
    }
    [-.22, .18].forEach(function (position, index) {
      var x = cx + span * position, start = paintY(x) + lineW * .25;
      var length = drip * (index ? .68 : 1);
      var available = side ? length : Math.max(0, passageY(segments, x, range.max) - clear - start);
      roundedDrip(x, start, length, available);
    });

    // Three quiet flecks soften only the swash edge; no haze expands the hazard.
    var dot = Math.max(1, lineW * .18), y = paintY(cx) - lineW * .8;
    ctx.fillStyle = PAINT;
    ctx.fillRect(cx - span * .39, y, dot, dot);
    ctx.fillRect(cx + span * .31, y + lineW * .45, dot, dot);
    ctx.fillRect(cx + span * .39, y - lineW * .25, dot * .7, dot * .7);
  }

  function flapDrawPaintBackdrop(ctx, w, h) {
    if (!ctx || !w || !h) return;
    ctx.save();
    // One V is baked into the scene sprite. It never joins the per-frame work.
    ctx.globalAlpha = .052;
    var markH = h * .34, cx = w * .69, cy = h * .40;
    if (fillLogo(ctx, cx, cy, markH, false)) {
      ctx.strokeStyle = PAINT; ctx.lineCap = 'round'; ctx.lineWidth = Math.max(.7, h * .003);
      ctx.beginPath();
      ctx.moveTo(cx - markH * .10, cy + markH * .34); ctx.lineTo(cx - markH * .10, cy + markH * .47);
      ctx.moveTo(cx + markH * .08, cy + markH * .30); ctx.lineTo(cx + markH * .08, cy + markH * .39);
      ctx.stroke();
    }
    ctx.restore();
  }

  function flapDrawMetal(ctx, polygon, s, kind, side, phase) {
    if (!ctx || !polygon || polygon.length < 3) return;
    kind = kind || 'pillar'; side = side ? 1 : 0;
    var b = bounds(polygon), d = Math.max(1, (s && s.d) || 1);
    var sprite = textureSprite(b.w, d, kind, side);

    ctx.save();
    pathPolygon(ctx, polygon, 0, 0);
    ctx.clip();
    var segs = passageSegments(polygon, side);
    ctx.drawImage(sprite, 0, 0, sprite.width, sprite.height, b.x, b.y, b.w, b.h);
    drawFacePaint(ctx, polygon, b, side, segs);

    // The uninterrupted passage lip remains the brightest collision boundary.
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.lineWidth = 8; ctx.strokeStyle = '#6f6041';
    strokeSegments(ctx, segs);
    ctx.lineWidth = 3; ctx.strokeStyle = '#c5ae77';
    strokeSegments(ctx, segs);

    pathPolygon(ctx, polygon, 0, 0);
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(219,198,149,.48)';
    ctx.stroke();

    ctx.restore();
  }

  flapDrawMetal.clearCache = function () { metalCache.clear(); metalCacheBytes = 0; };
  flapDrawMetal.cacheSize = function () { return metalCache.size; };
  flapDrawMetal.cacheBytes = function () { return metalCacheBytes; };
  flapDrawMetal.passageSegmentCount = function (polygon, side) {
    return passageSegments(polygon, side ? 1 : 0).length;
  };
  root.flapDrawMetal = flapDrawMetal;
  root.flapDrawPaintBackdrop = flapDrawPaintBackdrop;
})(typeof window !== 'undefined' ? window : globalThis);

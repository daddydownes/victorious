/* Flappy V clean-paint obstacle renderer.
   The supplied polygon remains the collision silhouette. Every obstacle pixel,
   including the flat V/star paint and its outward drips, is clipped inside it.
   `s.d` is the backing-store DPR used by the destination canvas. */
(function (root) {
  'use strict';

  var metalCache = new Map();
  var CACHE_LIMIT = 64;
  var CACHE_BYTE_LIMIT = 16 * 1024 * 1024, metalCacheBytes = 0;
  var graffitiCache = new Map(), graffitiCacheBytes = 0, graffitiPaths = Object.create(null);
  var GRAFFITI_CACHE_LIMIT = 4, GRAFFITI_BYTE_LIMIT = 4 * 1024 * 1024;
  var PILLAR_TOP_MOTIFS = [0, 1, 2], PILLAR_BOTTOM_MOTIFS = [3, 4];
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

  function graffitiArt() {
    return typeof FLAPPY_GRAFFITI_ART !== 'undefined' && FLAPPY_GRAFFITI_ART &&
      FLAPPY_GRAFFITI_ART.motifs && FLAPPY_GRAFFITI_ART.motifs.length ? FLAPPY_GRAFFITI_ART : null;
  }
  function graffitiPath(motif, index) {
    var key = motif.id + '|' + index;
    if (!graffitiPaths[key]) graffitiPaths[key] = new Path2D(motif.paths[index].d);
    return graffitiPaths[key];
  }
  function cacheGraffiti(key, atlas) {
    var bytes = atlas.canvas.width * atlas.canvas.height * 4;
    if (bytes > GRAFFITI_BYTE_LIMIT) return atlas;
    while (graffitiCache.size >= GRAFFITI_CACHE_LIMIT || graffitiCacheBytes + bytes > GRAFFITI_BYTE_LIMIT) {
      var oldest = graffitiCache.keys().next().value, prior = graffitiCache.get(oldest);
      graffitiCacheBytes -= prior.canvas.width * prior.canvas.height * 4;
      graffitiCache.delete(oldest);
    }
    graffitiCache.set(key, atlas); graffitiCacheBytes += bytes;
    return atlas;
  }
  function graffitiAtlas(d) {
    var art = graffitiArt();
    if (!art || typeof Path2D === 'undefined') return null;
    var rasterD = Math.max(1, Math.ceil(d * 4) / 4), key = String(rasterD);
    if (graffitiCache.has(key)) return graffitiCache.get(key);
    var cellH = 36, gap = 4, width = gap, i;
    for (i = 0; i < art.motifs.length; i++) width += cellH * art.motifs[i].aspect + gap;
    var canvas = makeCanvas(Math.ceil(width * rasterD), Math.ceil(cellH * rasterD));
    var ctx = canvas.getContext('2d'), rects = [], at = gap;
    ctx.scale(rasterD, rasterD);
    for (i = 0; i < art.motifs.length; i++) {
      var motif = art.motifs[i], motifW = cellH * motif.aspect;
      ctx.save(); ctx.translate(at, 0);
      ctx.scale(motifW / art.viewBox[2], cellH / art.viewBox[3]);
      ctx.translate(-art.viewBox[0], -art.viewBox[1]);
      for (var p = 0; p < motif.paths.length; p++) {
        ctx.globalAlpha = motif.paths[p].opacity === undefined ? 1 : motif.paths[p].opacity;
        ctx.fillStyle = PAINT; ctx.fill(graffitiPath(motif, p));
      }
      ctx.restore();
      rects.push({ x: at, w: motifW }); at += motifW + gap;
    }
    return cacheGraffiti(key, { canvas: canvas, rects: rects, d: rasterD, h: cellH });
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

  function graffitiStamp(ctx, art, atlas, index, cx, cy, height, turn) {
    var motif = art.motifs[index], rect = atlas.rects[index], width = height * motif.aspect;
    ctx.save(); ctx.globalAlpha = .64; ctx.translate(cx, cy);
    if (turn) ctx.rotate(-Math.PI / 2);
    ctx.drawImage(atlas.canvas,
      Math.round(rect.x * atlas.d), 0, Math.max(1, Math.round(rect.w * atlas.d)), atlas.canvas.height,
      -width / 2, -height / 2, width, height);
    ctx.restore();
  }

  function drawGraffiti(ctx, polygon, b, side, kind, s) {
    var art = graffitiArt(), atlas = graffitiAtlas(Math.max(1, (s && s.d) || 1));
    if (!art || !atlas) return;
    var cssScale = s && s.cssH ? s.cssH / s.h : 1;

    if (kind === 'pillar') {
      // These screen-stable slots do not redistribute while a pole deploys;
      // incomplete slots stay withheld. Wide word marks turn down the body;
      // their source cell is 36 units high, so every destination is a downscale.
      var indices = side ? PILLAR_BOTTOM_MOTIFS : PILLAR_TOP_MOTIFS;
      var slot = Math.min(88, Math.max(72, s.h * .115)), edgePad = 14;
      for (var i = 0; i < indices.length; i++) {
        var motifIndex = indices[i], motif = art.motifs[motifIndex], turn = motifIndex !== 0;
        var crossLimit = b.w - 8;
        if (!turn) crossLimit /= motif.aspect;
        var height = Math.min(16, crossLimit, (slot - 10) / (turn ? motif.aspect : 1),
          Math.max(9 / Math.max(.1, cssScale), turn ? 11 : 13));
        if (height <= 3) continue;
        var longSide = height * motif.aspect;
        var cy = side ? b.y + b.h - edgePad - (i + .5) * slot : b.y + edgePad + (i + .5) * slot;
        var cx = b.x + b.w * (i % 2 ? .57 : .43);
        var halfY = (turn ? longSide : height) / 2;
        // Keep the complete tag away from the painted passage lip. During the
        // reveal it appears only after its fixed slot is fully inside the slab.
        if (side ? (cy - halfY < b.y + 16 || cy + halfY > b.y + b.h - 5) :
            (cy - halfY < b.y + 5 || cy + halfY > b.y + b.h - 16)) continue;
        graffitiStamp(ctx, art, atlas, motifIndex, cx, cy, height, turn);
      }
      return;
    }

    // Finite arches, slants and iris jaws carry one fitted horizontal tag. If a
    // word would be illegible, the compact canonical symbol takes its place.
    var motifIndex = ((kind === 'arch' ? 1 : kind === 'slant' ? 3 : 2) + side) % art.motifs.length;
    var motif = art.motifs[motifIndex], rangeX = b.x + b.w * (side ? .68 : .32);
    var localRange = verticalRange(polygon, rangeX, b), depth = localRange.max - localRange.min;
    var height = Math.min(13, (b.w - 8) / motif.aspect, depth - 21,
      Math.max(8 / Math.max(.1, cssScale), 9));
    if (height * cssScale < 7 && motifIndex !== 0) {
      motifIndex = 0; motif = art.motifs[0];
      height = Math.min(13, (b.w - 8) / motif.aspect, depth - 21,
        Math.max(8 / Math.max(.1, cssScale), 9));
    }
    if (height <= 3) return;
    var width = height * motif.aspect;
    rangeX = Math.max(b.x + 4 + width / 2, Math.min(b.x + b.w - 4 - width / 2, rangeX));
    var cy = side ? localRange.max - 5 - height / 2 : localRange.min + 5 + height / 2;
    graffitiStamp(ctx, art, atlas, motifIndex, rangeX, cy, height, false);
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
    drawGraffiti(ctx, polygon, b, side, kind, s);

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

  flapDrawMetal.clearCache = function () {
    metalCache.clear(); metalCacheBytes = 0;
    graffitiCache.clear(); graffitiCacheBytes = 0; graffitiPaths = Object.create(null);
  };
  flapDrawMetal.cacheSize = function () { return metalCache.size; };
  flapDrawMetal.cacheBytes = function () { return metalCacheBytes; };
  flapDrawMetal.graffitiCacheSize = function () { return graffitiCache.size; };
  flapDrawMetal.graffitiCacheBytes = function () { return graffitiCacheBytes; };
  flapDrawMetal.passageSegmentCount = function (polygon, side) {
    return passageSegments(polygon, side ? 1 : 0).length;
  };
  root.flapDrawMetal = flapDrawMetal;
  root.flapDrawPaintBackdrop = flapDrawPaintBackdrop;
})(typeof window !== 'undefined' ? window : globalThis);

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
  var PILLAR_TOP_MOTIFS = [
    { index: 0, angle: -.314, x: .34, offset: 48, cover: .72 },
    { index: 1, angle: .419, x: .64, offset: 140, cover: .95 },
    { index: 2, angle: -.489, x: .42, offset: 230, cover: .95 }
  ];
  var PILLAR_BOTTOM_MOTIFS = [
    { index: 3, angle: .593, x: .66, offset: 180, cover: .95 },
    { index: 4, angle: 1.431, x: .38, offset: 48, cover: .64 }
  ];
  var FINITE_MOTIFS = {
    arch: [{ index: 1, angle: -.244, x: .38, cover: .70 }, { index: 0, angle: .314, x: .64, cover: .54 }],
    slant: [{ index: 0, angle: .209, x: .36, cover: .54 }, { index: 1, angle: -.384, x: .62, cover: .72 }],
    iris: [{ index: 1, angle: .279, x: .40, cover: .68 }, { index: 0, angle: -.349, x: .60, cover: .52 }]
  };
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
    canvas.__flappyGraffitiAtlas = true;
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
  function graffitiStamp(ctx, art, atlas, index, cx, cy, height, angle) {
    var motif = art.motifs[index], rect = atlas.rects[index], width = height * motif.aspect;
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(angle);
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
      // Screen-stable angled slots do not redistribute while a pole deploys.
      // Every destination stays at or below the atlas's 36-unit source height.
      var indices = side ? PILLAR_BOTTOM_MOTIFS : PILLAR_TOP_MOTIFS;
      for (var i = 0; i < indices.length; i++) {
        var placement = indices[i], motifIndex = placement.index, motif = art.motifs[motifIndex];
        var cosine = Math.abs(Math.cos(placement.angle)), sine = Math.abs(Math.sin(placement.angle));
        var widthFactor = motif.aspect * cosine + sine, heightFactor = motif.aspect * sine + cosine;
        var targetWidth = (b.w - 10) * placement.cover;
        var height = Math.min(36, targetWidth / widthFactor, 72 / heightFactor);
        if (height <= 3) continue;
        var boxW = height * widthFactor, boxH = height * heightFactor;
        if (height * cssScale < 7 && motifIndex !== 0) continue;
        var cy = side ? b.y + b.h - placement.offset : b.y + placement.offset;
        var cx = b.x + b.w * placement.x;
        cx = Math.max(b.x + 5 + boxW / 2, Math.min(b.x + b.w - 5 - boxW / 2, cx));
        // Keep the complete tag away from the structural passage lip. During the
        // reveal it appears only after its fixed slot is fully inside the slab.
        if (side ? (cy - boxH / 2 < b.y + 16 || cy + boxH / 2 > b.y + b.h - 5) :
            (cy - boxH / 2 < b.y + 5 || cy + boxH / 2 > b.y + b.h - 16)) continue;
        graffitiStamp(ctx, art, atlas, motifIndex, cx, cy, height, placement.angle);
      }
      return;
    }

    // Finite arches, slants and iris jaws carry one fitted compact mark.
    var placement = (FINITE_MOTIFS[kind] || FINITE_MOTIFS.arch)[side];
    var motifIndex = placement.index, motif = art.motifs[motifIndex], rangeX = b.x + b.w * placement.x;
    var localRange = verticalRange(polygon, rangeX, b), depth = localRange.max - localRange.min;
    var cosine = Math.abs(Math.cos(placement.angle)), sine = Math.abs(Math.sin(placement.angle));
    var widthFactor = motif.aspect * cosine + sine, heightFactor = motif.aspect * sine + cosine;
    var height = Math.min(36, (b.w - 10) * placement.cover / widthFactor, (depth - 21) / heightFactor);
    if (height <= 3 || height * cssScale < 7) return;
    var boxW = height * widthFactor, boxH = height * heightFactor;
    rangeX = Math.max(b.x + 5 + boxW / 2, Math.min(b.x + b.w - 5 - boxW / 2, rangeX));
    var cy = side ? localRange.max - 5 - boxH / 2 : localRange.min + 5 + boxH / 2;
    graffitiStamp(ctx, art, atlas, motifIndex, rangeX, cy, height, placement.angle);
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

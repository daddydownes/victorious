const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const base = (process.env.DEMO_URL || 'https://vctrsclo.com').replace(/\/$/, '');
const out = process.env.AUDIT_OUT || '/private/tmp/vctrs-touch-settle-live-diagnostic';
fs.mkdirSync(out, { recursive: true });
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const sha256 = data => crypto.createHash('sha256').update(data).digest('hex');

async function state(page, label) {
  return page.evaluate(label => {
    const section = document.querySelector('#story-vault');
    const frame = document.querySelector('#story-vault-frame');
    const rect = section?.getBoundingClientRect();
    return {
      label,
      t: performance.now(),
      scrollY,
      inner: [innerWidth, innerHeight],
      visual: visualViewport ? [visualViewport.width, visualViewport.height, visualViewport.offsetTop, visualViewport.scale] : null,
      top: rect?.top,
      bottom: rect?.bottom,
      visible: rect ? Math.max(0, Math.min(innerHeight, rect.bottom) - Math.max(0, rect.top)) / innerHeight : null,
      active: window.__storyVault?.active,
      settling: window.__storyVault?.settling,
      landing: window.__storyVault?.landing,
      pending: window.__storyVault?.entryPending,
      loaded: window.__storyVault?.loaded,
      resetting: window.__storyVault?.resetting,
      committing: section?.classList.contains('is-committing'),
      inert: frame?.inert,
      pointer: frame ? getComputedStyle(frame).pointerEvents : null,
      hidden: document.hidden,
      visibility: document.visibilityState,
      readyState: document.readyState,
      bodyClass: document.body?.className || '',
      overlayClass: document.querySelector('#flapOverlay')?.className || '',
      motion: matchMedia('(prefers-reduced-motion: reduce)').matches
    };
  }, label);
}

async function mark(page, label, detail = {}) {
  await page.evaluate(({ label, detail }) => window.__touchDiag?.mark(label, detail), { label, detail });
}

async function openAt(page, fraction = .3) {
  const response = await page.goto(`${base}/experience/#story-return`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  const responseBody = await response.body();
  const responseIdentity = {
    url: response.url(),
    status: response.status(),
    fromServiceWorker: response.fromServiceWorker(),
    headers: response.headers(),
    bytes: responseBody.length,
    sha256: sha256(responseBody),
    browserVersion: await page.context().browser().version(),
    userAgent: await page.evaluate(() => navigator.userAgent)
  };
  await page.waitForFunction(() => window.__storyVault?.loaded === true, null, { timeout: 15000 });
  await page.evaluate(fraction => {
    const section = document.querySelector('#story-vault');
    const top = section.getBoundingClientRect().top + scrollY;
    scrollTo(0, top - innerHeight * (1 - fraction));
  }, fraction);
  await page.waitForTimeout(220);
  const pre = await state(page, 'controlled-precondition');
  assert(Math.abs(pre.visible - fraction) < .035 && !pre.active && !pre.settling, JSON.stringify(pre));
  return { pre, responseIdentity };
}

async function swipeVisible(page, session, label, direction = 'forward', distance = 70) {
  const points = await page.evaluate(({ direction, distance }) => {
    const rect = document.querySelector('#story-vault').getBoundingClientRect();
    const low = Math.max(12, rect.top + 12);
    const high = innerHeight - 12;
    const start = Math.max(low, Math.min(high, rect.top + Math.max(40, (innerHeight - Math.max(0, rect.top)) * .62)));
    const sign = direction === 'forward' ? -1 : 1;
    return { x: innerWidth * .5, start, end: Math.max(12, Math.min(innerHeight - 12, start + sign * distance)), rectTop: rect.top };
  }, { direction, distance });
  await mark(page, `${label}:before`, { direction, distance, points });
  const touch = y => [{ x: points.x, y, radiusX: 3, radiusY: 3, force: 1, id: 1 }];
  await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: touch(points.start) });
  for (let i = 1; i <= 5; i++) {
    const y = points.start + (points.end - points.start) * i / 5;
    await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: touch(y) });
    await delay(10);
  }
  await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await mark(page, `${label}:after`, { direction, distance, points });
  return points;
}

function classify(samples) {
  let transitions = 0;
  let interruptions = 0;
  let last = null;
  for (const sample of samples) {
    if (last && sample.settling !== last.settling) transitions++;
    if (!sample.settling && !sample.active && sample.top > 2 && sample.visible >= .24) interruptions++;
    last = sample;
  }
  return { transitions, interruptions, first: samples[0], last: samples.at(-1) };
}

(async () => {
  const report = { base, checkedAt: new Date().toISOString(), errors: [], console: [], navigations: [], lifecycle: [] };
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
    const page = await context.newPage();
    page.on('pageerror', error => report.errors.push({ type: 'pageerror', message: error.message, at: Date.now() }));
    page.on('console', message => report.console.push({ type: message.type(), text: message.text(), at: Date.now() }));
    page.on('framenavigated', frame => report.navigations.push({ url: frame.url(), main: frame === page.mainFrame(), at: Date.now() }));
    await page.addInitScript(() => {
      const events = [];
      const samples = [];
      let interval = 0;
      let lastScroll = -Infinity;
      function targetName(target) {
        if (!target) return null;
        const id = target.id ? `#${target.id}` : '';
        const classes = typeof target.className === 'string' && target.className.trim() ? `.${target.className.trim().replace(/\s+/g, '.')}` : '';
        return `${target.tagName || target.nodeName || 'unknown'}${id}${classes}`;
      }
      function snapshot() {
        const section = document.querySelector('#story-vault');
        const frame = document.querySelector('#story-vault-frame');
        const rect = section?.getBoundingClientRect();
        return {
          t: performance.now(), scrollY, inner: [innerWidth, innerHeight],
          visual: visualViewport ? [visualViewport.width, visualViewport.height, visualViewport.offsetTop, visualViewport.scale] : null,
          top: rect?.top, bottom: rect?.bottom,
          visible: rect ? Math.max(0, Math.min(innerHeight, rect.bottom) - Math.max(0, rect.top)) / innerHeight : null,
          active: window.__storyVault?.active, settling: window.__storyVault?.settling,
          landing: window.__storyVault?.landing, pending: window.__storyVault?.entryPending,
          loaded: window.__storyVault?.loaded, resetting: window.__storyVault?.resetting,
          committing: section?.classList.contains('is-committing'), inert: frame?.inert,
          hidden: document.hidden, visibility: document.visibilityState, readyState: document.readyState,
          bodyClass: document.body?.className || '', overlayClass: document.querySelector('#flapOverlay')?.className || ''
        };
      }
      function push(kind, detail = {}) { events.push({ kind, ...snapshot(), ...detail }); }
      function touchDetail(event, phase) {
        const list = source => Array.from(source || []).map(touch => ({ id: touch.identifier, x: touch.clientX, y: touch.clientY, pageY: touch.pageY, force: touch.force }));
        return {
          phase, trusted: event.isTrusted, cancelable: event.cancelable, defaultPrevented: event.defaultPrevented,
          touches: list(event.touches), changed: list(event.changedTouches), target: targetName(event.target),
          path: event.composedPath().slice(0, 5).map(targetName)
        };
      }
      for (const type of ['touchstart', 'touchmove', 'touchend', 'touchcancel']) {
        addEventListener(type, event => {
          push(type, touchDetail(event, 'capture'));
          queueMicrotask(() => push(type, touchDetail(event, 'after-dispatch')));
        }, { capture: true, passive: true });
      }
      for (const type of ['load', 'resize', 'orientationchange', 'pageshow', 'pagehide', 'freeze', 'resume']) {
        addEventListener(type, event => push(type, { persisted: event.persisted ?? null }), { capture: true });
      }
      document.addEventListener('visibilitychange', () => push('visibilitychange'), { capture: true });
      addEventListener('scroll', () => { if (performance.now() - lastScroll > 30) { lastScroll = performance.now(); push('scroll'); } }, { passive: true });
      if (visualViewport) {
        visualViewport.addEventListener('resize', () => push('visualViewport.resize'), { passive: true });
        visualViewport.addEventListener('scroll', () => push('visualViewport.scroll'), { passive: true });
      }
      addEventListener('DOMContentLoaded', () => {
        push('DOMContentLoaded');
        const body = document.body;
        const overlay = document.querySelector('#flapOverlay');
        if (body) new MutationObserver(records => push('body-mutation', { attrs: records.map(record => record.attributeName) })).observe(body, { attributes: true, attributeFilter: ['class'] });
        if (overlay) new MutationObserver(records => push('overlay-mutation', { attrs: records.map(record => record.attributeName) })).observe(overlay, { attributes: true, attributeFilter: ['class'] });
      }, { once: true });
      window.__touchDiag = {
        events, samples,
        mark(label, detail) { push('mark', { label, detail }); },
        start() { if (!interval) interval = setInterval(() => samples.push(snapshot()), 12); push('sampling-start'); },
        stop() { if (interval) clearInterval(interval); interval = 0; push('sampling-stop'); return { events, samples }; }
      };
    });
    const session = await context.newCDPSession(page);
    await session.send('Page.enable');
    session.on('Page.lifecycleEvent', event => report.lifecycle.push({ ...event, at: Date.now() }));
    const opened = await openAt(page);
    report.pre = opened.pre;
    report.responseIdentity = opened.responseIdentity;
    await page.evaluate(() => window.__touchDiag.start());
    await swipeVisible(page, session, 'initial', 'forward', 72);
    await page.waitForFunction(() => window.__storyVault?.settling === true, null, { timeout: 2500 });
    await page.waitForTimeout(90);
    report.initial = await state(page, 'initial-settling');
    await page.screenshot({ path: path.join(out, '01-initial.png') });
    for (let i = 0; i < 3; i++) {
      await delay(i ? 95 : 80);
      await swipeVisible(page, session, `extra-${i + 1}`, 'forward', 70);
      await page.screenshot({ path: path.join(out, `0${i + 2}-after-extra-${i + 1}.png`) });
    }
    await delay(2400);
    report.final = await state(page, 'final');
    await page.screenshot({ path: path.join(out, '05-final.png') });
    report.browserFetch = await page.evaluate(async () => {
      const response = await fetch(location.pathname, { cache: 'no-store' });
      const bytes = await response.arrayBuffer();
      const digest = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))).map(value => value.toString(16).padStart(2, '0')).join('');
      const text = new TextDecoder().decode(bytes);
      return {
        url: response.url, status: response.status, bytes: bytes.byteLength, sha256: digest,
        headers: Object.fromEntries([...response.headers].filter(([name]) => ['age', 'cache-control', 'cf-cache-status', 'etag', 'last-modified'].includes(name.toLowerCase()))),
        signatures: {
          hasQuietHandoff: text.includes('HANDOFF_QUIET=140'),
          hasLandingState: text.includes('get landing(){return landing}'),
          hasOldTouchCancel: text.includes('if(settling)cancelEntry();touchHeld=true')
        }
      };
    });
    const diag = await page.evaluate(() => window.__touchDiag.stop());
    report.events = diag.events;
    report.samples = diag.samples;
    report.classification = classify(diag.samples);
    report.touchSummary = diag.events.filter(event => event.phase === 'capture' && event.kind.startsWith('touch')).map(event => ({
      kind: event.kind, t: event.t, trusted: event.trusted, cancelable: event.cancelable, defaultPrevented: event.defaultPrevented,
      touches: event.touches, changed: event.changed, target: event.target,
      state: { scrollY: event.scrollY, top: event.top, visible: event.visible, settling: event.settling, landing: event.landing, pending: event.pending, active: event.active, hidden: event.hidden }
    }));
    await context.close();
  } catch (error) {
    report.errors.push({ type: 'harness', message: error.message, stack: error.stack, at: Date.now() });
  } finally {
    if (browser) await browser.close();
    fs.writeFileSync(path.join(out, 'results.json'), JSON.stringify(report, null, 2));
    console.log(JSON.stringify({ out, responseIdentity: report.responseIdentity, browserFetch: report.browserFetch, classification: report.classification, final: report.final, errors: report.errors }));
    if (report.errors.length) process.exitCode = 1;
  }
})();

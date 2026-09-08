const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium, webkit } = require('playwright');

const base = (process.env.DEMO_URL || 'http://127.0.0.1:8922').replace(/\/$/, '');
const out = process.env.AUDIT_OUT || '/private/tmp/vctrs-fast-scroll-stress';
const loops = Number(process.env.LOOPS || 3);
fs.mkdirSync(out, { recursive: true });
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function state(page, label) {
  return page.evaluate(label => {
    const section = document.querySelector('#story-vault');
    const frame = document.querySelector('#story-vault-frame');
    const r = section?.getBoundingClientRect();
    const v = window.__storyVault || {};
    return {
      label, t: performance.now(), href: location.href, y: scrollY,
      viewport: [innerWidth, innerHeight], maxY: document.documentElement.scrollHeight - innerHeight,
      section: r && { top: r.top, bottom: r.bottom, height: r.height,
        committing: section.classList.contains('is-committing') },
      vault: { active: !!v.active, loaded: !!v.loaded, pending: !!v.entryPending,
        settling: !!v.settling, resetting: !!v.resetting, cycle: v.cycle },
      frame: frame && { inert: frame.inert, hidden: frame.getAttribute('aria-hidden'),
        pointer: getComputedStyle(frame).pointerEvents,
        open: !!frame.contentDocument?.body.classList.contains('next-vault-open'),
        nested: !!frame.contentDocument?.querySelector('#story-vault-frame') }
    };
  }, label);
}

async function waitLoaded(page) {
  await page.waitForFunction(() => window.__storyVault?.loaded === true, null, { timeout: 15000 });
}

async function waitActive(page) {
  await page.waitForFunction(() => window.__storyVault?.active === true && !window.__storyVault?.settling,
    null, { timeout: 8000 });
  await page.waitForFunction(() => document.querySelector('#story-vault-frame')?.contentDocument?.body
    .classList.contains('next-vault-open'), null, { timeout: 10000 });
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  const s = await state(page, 'active');
  assert(Math.abs(s.section.top) <= 2.5, `Vault top missed viewport: ${JSON.stringify(s)}`);
  assert(Math.abs(s.section.bottom - s.viewport[1]) <= 2.5, `Vault bottom missed viewport: ${JSON.stringify(s)}`);
  assert(!s.frame.inert && s.frame.hidden === 'false' && s.frame.pointer === 'auto' && !s.frame.nested,
    `Vault frame not cleanly active: ${JSON.stringify(s)}`);
  return s;
}

async function installTrace(page) {
  await page.evaluate(() => {
    window.__fastStress = { frames: [], wheels: [], lifecycle: [], started: performance.now() };
    const q = window.__fastStress;
    addEventListener('wheel', e => q.wheels.push({ t: performance.now() - q.started, dy: e.deltaY,
      mode: e.deltaMode, cancelable: e.cancelable, prevented: e.defaultPrevented }), { passive: true });
    let prior = {};
    function tick(t) {
      const v = window.__storyVault || {};
      const section = document.querySelector('#story-vault');
      const now = { t: t - q.started, y: scrollY, active: !!v.active, settling: !!v.settling,
        pending: !!v.entryPending, resetting: !!v.resetting,
        committing: !!section?.classList.contains('is-committing'), cycle: v.cycle };
      q.frames.push(now);
      for (const k of ['active', 'settling', 'pending', 'resetting', 'committing', 'cycle']) {
        if (now[k] !== prior[k]) q.lifecycle.push({ t: now.t, key: k, from: prior[k], to: now[k] });
      }
      prior = now;
      if (q.frames.length > 30000) q.frames.splice(0, 5000);
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  });
}

async function resetTrace(page) {
  await page.evaluate(() => { const q = window.__fastStress; q.frames = []; q.wheels = []; q.lifecycle = []; q.started = performance.now(); });
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}

async function wheelBurst(page, deltas, gap = 0) {
  for (const dy of deltas) { await page.mouse.wheel(0, dy); if (gap) await page.waitForTimeout(gap); }
}

async function surface(page) {
  const before = (await state(page, 'before-surface')).vault.cycle;
  await page.frameLocator('#story-vault-frame').locator('#surfaceBtn').click();
  await page.waitForFunction(c => window.__storyVault?.cycle > c && !window.__storyVault?.resetting && scrollY <= 2,
    before, { timeout: 12000 });
  const s = await state(page, 'surface-reset');
  assert(!s.vault.active && !s.vault.settling && !s.section.committing, JSON.stringify(s));
  assert(!new URL(s.href).hash, `Surface reset retained hash: ${s.href}`);
  return s;
}

function analyze(trace, requireActive = true) {
  const f = trace.frames;
  let backward = 0, starts = 0, activations = 0, incomplete = 0;
  for (let i = 1; i < f.length; i++) {
    if (f[i - 1].settling && f[i].y < f[i - 1].y - 2) backward++;
    if (f[i].settling && !f[i - 1].settling) starts++;
    if (f[i].active && !f[i - 1].active) activations++;
    if (f[i - 1].settling && !f[i].settling && !f[i].active) incomplete++;
  }
  assert.equal(backward, 0, `backward frames while settling: ${backward}`);
  assert(f.at(-1)?.active && !f.at(-1)?.settling, 'entry did not finish active');
  assert(starts <= 1, `entry restarted ${starts} times`);
  if (requireActive) assert.equal(activations, 1, `activation count ${activations}`);
  return { frames: f.length, wheels: trace.wheels.length, backward, starts, activations, incomplete };
}

async function traceData(page) { return page.evaluate(() => window.__fastStress); }

async function runEngine(engine, type) {
  const browser = await type.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push({ kind: 'pageerror', message: e.message }));
  page.on('console', m => { if (m.type() === 'error') errors.push({ kind: 'console', message: m.text() }); });
  const result = { engine, scenarios: [], errors };
  let current = 'setup';
  try {
    await page.goto(`${base}/experience/`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await installTrace(page);

    current = 'top-to-terminal-huge-bursts';
    await resetTrace(page);
    await wheelBurst(page, [1600, 2400, 5000, 9000, 16000]);
    await page.waitForFunction(() => window.__storyVault?.settling || window.__storyVault?.active, null, { timeout: 4000 });
    await wheelBurst(page, Array(20).fill(1300), 8);
    const firstActive = await waitActive(page);
    await sleep(220);
    const firstTrace = await traceData(page);
    result.scenarios.push({ name: current, end: firstActive, analysis: analyze(firstTrace), trace: firstTrace });

    for (let i = 1; i <= loops; i++) {
      current = `surface-fast-bottom-${i}`;
      const reset = await surface(page);
      await resetTrace(page);
      await wheelBurst(page, [5000, 12000, 24000, 24000]);
      await page.waitForFunction(() => window.__storyVault?.settling || window.__storyVault?.active, null, { timeout: 4000 });
      await wheelBurst(page, Array(12).fill(2200), 5);
      const active = await waitActive(page);
      const trace = await traceData(page);
      result.scenarios.push({ name: current, reset, end: active, analysis: analyze(trace), trace });
    }

    current = 'deliberate-reverse-and-retry';
    const reset = await surface(page);
    await page.locator('#story-vault').evaluate(el => scrollTo(0, el.offsetTop - innerHeight * .72));
    await sleep(100);
    await resetTrace(page);
    await page.mouse.wheel(0, 950);
    await page.waitForFunction(() => window.__storyVault?.settling === true, null, { timeout: 3000 });
    await wheelBurst(page, [1400, 1400, -1800, -1800], 18);
    await page.waitForFunction(() => !window.__storyVault?.settling, null, { timeout: 4000 });
    const cancelled = await state(page, 'reverse-cancelled');
    assert(!cancelled.vault.active, `reverse did not cancel: ${JSON.stringify(cancelled)}`);
    await wheelBurst(page, [5000, 12000, 24000]);
    await page.waitForFunction(() => window.__storyVault?.settling || window.__storyVault?.active, null, { timeout: 4000 });
    await wheelBurst(page, Array(10).fill(1600), 5);
    const active = await waitActive(page);
    const trace = await traceData(page);
    result.scenarios.push({ name: current, reset, cancelled, end: active, trace,
      note: 'Analysis is recorded but not subjected to the single-start invariant because deliberate reverse/retry requires two starts.' });

    assert.deepEqual(errors, [], `browser errors: ${JSON.stringify(errors)}`);
    await page.screenshot({ path: path.join(out, `${engine}-pass.png`), fullPage: true });
    return result;
  } catch (error) {
    const failure = { scenario: current, message: error.message, stack: error.stack,
      state: await state(page, 'failure').catch(e => ({ captureError: e.message })),
      trace: await traceData(page).catch(e => ({ captureError: e.message })), errors };
    result.failure = failure;
    fs.writeFileSync(path.join(out, `${engine}-failure.json`), JSON.stringify(failure, null, 2));
    await page.screenshot({ path: path.join(out, `${engine}-failure.png`), fullPage: true }).catch(() => {});
    throw Object.assign(error, { engineResult: result });
  } finally {
    await context.close();
    await browser.close();
  }
}

(async () => {
  const report = { base, out, loops, checkedAt: new Date().toISOString(), results: [], limits: [
    'Headless Playwright Chromium/WebKit desktop automation; huge wheel events approximate adversarial wheel/trackpad input but are not physical hardware momentum.',
    'Each engine runs serially in its own fresh context. Chromium and WebKit do not share timing or browser state.',
    'The harness intentionally tests desktop wheel handling; trusted mobile touch is covered by the separate vault-entry candidate harness.'
  ] };
  try {
    for (const [name, type] of [['chromium', chromium], ['webkit', webkit]]) {
      console.log(`START ${name}`);
      report.results.push(await runEngine(name, type));
      console.log(`PASS ${name}`);
    }
    report.pass = true;
  } catch (error) {
    report.pass = false;
    if (error.engineResult) report.results.push(error.engineResult);
    report.error = { message: error.message, stack: error.stack };
    process.exitCode = 1;
  } finally {
    report.finishedAt = new Date().toISOString();
    fs.writeFileSync(path.join(out, 'results.json'), JSON.stringify(report, null, 2));
    console.log(JSON.stringify({ pass: report.pass, out, engines: report.results.map(r => r.engine) }));
  }
})();

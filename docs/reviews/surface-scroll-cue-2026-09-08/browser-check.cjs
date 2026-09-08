const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { webkit, chromium } = require('playwright');

const base = (process.env.DEMO_URL || 'http://127.0.0.1:8922').replace(/\/$/, '');
const out = process.env.AUDIT_OUT || '/private/tmp/vctrs-loop-cue';
const expectFixed = process.env.EXPECT_FIXED === '1';
const baselineOnly = process.env.MODE === 'baseline';
fs.mkdirSync(out, { recursive: true });
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function cueState(page, label) {
  return page.evaluate(label => {
    const cue = document.querySelector('.story-cue');
    const brand = document.querySelector('#brand-title');
    const style = getComputedStyle(cue);
    const active = document.activeElement;
    const rect = cue.getBoundingClientRect();
    return {
      label,
      url: location.href,
      scrollY,
      active: { tag: active?.tagName || null, id: active?.id || '', className: typeof active?.className === 'string' ? active.className : '' },
      cue: {
        focused: active === cue,
        focusVisible: cue.matches(':focus-visible'),
        outline: `${style.outlineWidth} ${style.outlineStyle} ${style.outlineColor}`,
        outlineOffset: style.outlineOffset,
        color: style.color,
        background: style.backgroundColor,
        boxShadow: style.boxShadow,
        rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height }
      },
      brand: { focused: active === brand, tabindex: brand?.getAttribute('tabindex') },
      vault: window.__storyVault ? { active: __storyVault.active, loaded: __storyVault.loaded, resetting: __storyVault.resetting, cycle: __storyVault.cycle } : null
    };
  }, label);
}

async function childFrame(page) {
  await page.waitForFunction(() => document.querySelector('#story-vault-frame')?.contentDocument?.getElementById('surfaceBtn'), null, { timeout: 15000 });
  const handle = await page.locator('#story-vault-frame').elementHandle();
  const frame = await handle.contentFrame();
  assert(frame, 'embedded Vault frame unavailable');
  return frame;
}

async function desktopWheel(page) {
  await page.mouse.wheel(0, 620);
  await sleep(130);
}

async function touchSwipe(page, session, width, height) {
  const x = width * .52;
  const y0 = height * .78;
  const y1 = height * .24;
  const point = y => [{ x, y, radiusX: 3, radiusY: 3, force: 1, id: 1 }];
  await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: point(y0) });
  for (const ratio of [.25, .5, .75, 1]) {
    await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: point(y0 + (y1 - y0) * ratio) });
    await sleep(14);
  }
  await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await sleep(180);
}

async function reachVault(page, action) {
  for (let i = 0; i < 36; i++) {
    if (await page.evaluate(() => window.__storyVault?.active === true)) return i;
    await action();
  }
  await page.waitForFunction(() => window.__storyVault?.active === true, null, { timeout: 7000 });
  return 36;
}

async function surfaceReturn(page, useTouch, name, loop) {
  const prior = await page.evaluate(() => __storyVault.cycle);
  const frame = await childFrame(page);
  const button = frame.locator('#surfaceBtn');
  await button.waitFor({ state: 'visible', timeout: 8000 });
  if (useTouch) await button.tap({ timeout: 8000 });
  else if (loop % 2 === 0) { await button.focus(); await page.keyboard.press('Enter'); }
  else await button.click({ timeout: 8000 });
  await page.waitForFunction(prior => __storyVault.cycle === prior + 1 && !__storyVault.resetting && scrollY <= 2, prior, { timeout: 15000 });
  await sleep(120);
  const returned = await cueState(page, `returned-${loop}`);
  await page.screenshot({ path: path.join(out, `${name}-return-${loop}.png`) });
  if (expectFixed) {
    assert.equal(returned.active.id, 'brand-title', JSON.stringify(returned));
    assert.equal(returned.brand.focused, true, JSON.stringify(returned));
    assert.equal(returned.brand.tabindex, '-1', JSON.stringify(returned));
    assert.equal(returned.cue.focused, false, JSON.stringify(returned));
    assert.equal(returned.cue.focusVisible, false, JSON.stringify(returned));
    // WebKit on macOS uses Option-Tab to include links in sequential focus.
    const forwardKey = name.startsWith('webkit-') ? 'Alt+Tab' : 'Tab';
    await page.keyboard.press(forwardKey);
    const tabbed = await cueState(page, `tabbed-to-cue-${loop}`);
    assert.equal(tabbed.cue.focused, true, JSON.stringify(tabbed));
    assert.equal(tabbed.cue.focusVisible, true, JSON.stringify(tabbed));
    await page.screenshot({ path: path.join(out, `${name}-tabbed-cue-${loop}.png`) });
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => document.activeElement?.id === 'portrait-title' && scrollY > 2, null, { timeout: 5000 });
    const entered = await cueState(page, `cue-entered-${loop}`);
    assert.equal(entered.active.id, 'portrait-title', JSON.stringify(entered));
    return { priorCycle: prior, returned, forwardKey, tabbed, entered };
  }
  assert.equal(returned.cue.focused, true, JSON.stringify(returned));
  assert.equal(returned.cue.focusVisible, true, JSON.stringify(returned));
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => document.activeElement?.id === 'portrait-title' && scrollY > 2, null, { timeout: 5000 });
  return { priorCycle: prior, returned, entered: await cueState(page, `cue-entered-${loop}`) };
}

async function runCase({ engine, width, height, name, loops, touch, reduced = false }) {
  const browserType = engine === 'webkit' ? webkit : chromium;
  const browser = await browserType.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width, height }, hasTouch: touch, isMobile: touch, deviceScaleFactor: touch ? 2 : 1, reducedMotion: reduced ? 'reduce' : 'no-preference' });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const session = touch ? await context.newCDPSession(page) : null;
  try {
    await page.goto(`${base}/experience/`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForFunction(() => window.__storyVault && document.querySelector('.story-cue'));
    await sleep(250);
    const first = await cueState(page, 'first-arrival');
    assert.equal(first.cue.focused, false, JSON.stringify(first));
    assert.equal(first.cue.focusVisible, false, JSON.stringify(first));
    await page.screenshot({ path: path.join(out, `${name}-first.png`) });
    const action = touch ? () => touchSwipe(page, session, width, height) : () => desktopWheel(page);
    const returns = [];
    for (let loop = 1; loop <= loops; loop++) {
      const gestures = await reachVault(page, action);
      returns.push({ gestures, ...(await surfaceReturn(page, touch, name, loop)) });
    }
    assert.deepEqual(errors, []);
    return { name, engine, viewport: [width, height], touch, reduced, first, returns, errors };
  } finally {
    await context.close();
    await browser.close();
  }
}

(async () => {
  const specs = baselineOnly
    ? [{ engine: 'webkit', width: 1280, height: 720, name: 'webkit-1280x720', loops: 1, touch: false }]
    : [
        { engine: 'webkit', width: 1280, height: 720, name: 'webkit-1280x720', loops: 4, touch: false },
        { engine: 'chromium', width: 390, height: 844, name: 'chromium-390x844', loops: 4, touch: true },
        { engine: 'chromium', width: 844, height: 390, name: 'chromium-844x390', loops: 4, touch: true },
        { engine: 'webkit', width: 320, height: 568, name: 'webkit-320x568-reduced', loops: 4, touch: false, reduced: true }
      ];
  const results = [];
  for (const spec of specs) results.push(await runCase(spec));
  const report = {
    base, checkedAt: new Date().toISOString(), expectFixed, baselineOnly,
    returnCount: results.reduce((count, result) => count + result.returns.length, 0),
    results,
    limits: 'Headless WebKit pointer/wheel and Chromium CDP touch emulation; no physical-device or assistive-technology claim.'
  };
  fs.writeFileSync(path.join(out, 'results.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ out, expectFixed, returnCount: report.returnCount, cases: results.map(result => result.name) }));
})().catch(error => { console.error(error); process.exitCode = 1; });

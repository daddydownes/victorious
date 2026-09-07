const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium, webkit, firefox } = require('playwright');
const base = process.env.DEMO_URL || 'http://127.0.0.1:59408';
const evidenceDir = process.argv[2] && path.resolve(process.argv[2]);
const results = [];
const configurations = [
  ['chromium', 1440, 900], ['chromium', 1280, 720],
  ['chromium', 320, 568], ['chromium', 360, 800],
  ['chromium', 390, 844], ['chromium', 412, 915], ['chromium', 430, 932],
  ['webkit', 390, 844], ['webkit', 844, 390], ['webkit', 1440, 900],
  ['firefox', 1280, 900]
];
async function localOnly(context) {
  await context.route('**/*', route => {
    const url = new URL(route.request().url());
    return url.origin === new URL(base).origin ? route.continue() : route.abort();
  });
}
async function titleAt(page, id, fraction) {
  await page.evaluate(({ id, fraction }) => {
    const el = document.getElementById(id);
    scrollTo(0, scrollY + el.getBoundingClientRect().top - innerHeight * fraction);
  }, { id, fraction });
}
async function imageReady(page, id) {
  await page.waitForFunction(id => {
    const img = document.querySelector('#' + id + ' img');
    return img.complete && img.naturalWidth > 0;
  }, id);
}
async function capture(page, name) {
  if (evidenceDir) await page.screenshot({ path: path.join(evidenceDir, name + '.png') });
}
(async () => {
  if (evidenceDir) fs.mkdirSync(evidenceDir, { recursive: true });
  for (const [engine, width, height] of configurations) {
    const browser = await ({ chromium, webkit, firefox })[engine].launch({ headless: true });
    const context = await browser.newContext({ viewport: { width, height }, hasTouch: width < 500 });
    await localOnly(context);
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    try {
      await page.goto(base + '/experience/?release-check=' + engine + width);
      await titleAt(page, 'vault-title', .67);
      await imageReady(page, 'vault-title');
      await page.waitForTimeout(650);
      const partial = await page.locator('#vault-title').getAttribute('data-paint-progress');
      await capture(page, engine + '-' + width + '-paint');
      await titleAt(page, 'vault-title', .24);
      await page.waitForFunction(() => document.getElementById('vault-title').dataset.paintProgress === '1.000');
      await capture(page, engine + '-' + width + '-vault');
      const structure = await page.evaluate(() => ({
        next: document.getElementById('play').nextElementSibling.id,
        removed: /A few moments from the vault|The night doesn't end here|Some things stay with you|Keep exploring/.test(document.querySelector('main').innerText),
        photos: document.querySelectorAll('.end-photo').length,
        overflow: document.documentElement.scrollWidth > innerWidth,
        canvas: document.querySelectorAll('#vault-title canvas').length
      }));
      assert.equal(structure.next, 'vault-invite'); assert.equal(structure.removed, false);
      assert.equal(structure.photos, 6); assert.equal(structure.overflow, false); assert.equal(structure.canvas, 0);
      // Real keyboard entry and exit; focus returns to the same native opener.
      await page.locator('#journey-play').focus();
      await page.keyboard.press('Enter');
      await page.waitForFunction(() => document.getElementById('flapOverlay').classList.contains('on'));
      await page.keyboard.press('Escape');
      await page.waitForFunction(() => !document.getElementById('flapOverlay').classList.contains('on'));
      assert.equal(await page.evaluate(() => document.activeElement.id), 'journey-play');
      const controlStates = [];
      for (const selector of ['.vault-return', '#restart-page']) {
        const control = page.locator(selector);
        await control.scrollIntoViewIfNeeded();
        await control.focus();
        const before = await control.boundingBox();
        assert(before.height >= 44, selector + ' target is below 44px');
        await page.mouse.move(before.x + before.width / 2, before.y + before.height / 2);
        await page.mouse.down();
        const pressed = await control.evaluate(el => {
          const css = getComputedStyle(el), rect = el.getBoundingClientRect();
          return { opacity: css.opacity, visibility: css.visibility, width: rect.width, height: rect.height };
        });
        // Release away from the link so this state test does not navigate.
        await page.mouse.move(0, 0); await page.mouse.up();
        assert.equal(pressed.visibility, 'visible'); assert(Number(pressed.opacity) > .95);
        assert(pressed.width > before.width * .95); assert(pressed.height > before.height * .95);
        controlStates.push({ selector, targetHeight: before.height, pressed });
      }
      await capture(page, engine + '-' + width + '-ending');
      // Native scrolling moves exactly the requested distance, without a custom multiplier.
      await page.evaluate(() => scrollTo(0, 100));
      await page.mouse.wheel(0, 300); await page.waitForTimeout(180);
      const wheelDistance = await page.evaluate(() => scrollY - 100);
      assert(Math.abs(wheelDistance - 300) <= 2);
      // Dynamic preference change must pause the film, even after leaving and returning.
      await titleAt(page, 'portrait-title', .7);
      await page.evaluate(() => document.getElementById('portrait').scrollIntoView());
      await page.waitForFunction(() => !document.getElementById('story-film').paused);
      await page.locator('#vault-title').scrollIntoViewIfNeeded();
      await page.evaluate(() => document.getElementById('portrait').scrollIntoView());
      await page.waitForFunction(() => !document.getElementById('story-film').paused);
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.waitForFunction(() => document.getElementById('story-film').paused);
      assert.deepEqual(errors, []);
      results.push({ engine, width, height, partial, structure, controlStates, wheelDistance, dynamicReducedFilmPaused: true, errors });
    } finally { await browser.close(); }
  }
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    await localOnly(context);
    await context.route(/(?:play-the-game-vstyle-v1\.svg|back-to-the-vault-vstyle-v1\.svg|play-arrow-spray-v1\.png)/, route => route.abort());
    const page = await context.newPage();
    await page.goto(base + '/experience/?image-failure-check');
    for (const id of ['play-title', 'vault-title']) {
      await page.locator('#' + id).scrollIntoViewIfNeeded();
      await page.waitForFunction(id => document.getElementById(id).classList.contains('paint-failed'), id);
      const fallback = await page.locator('#' + id + ' .paint-title-text').evaluate(el => ({
        text: el.textContent, position: getComputedStyle(el).position, width: el.getBoundingClientRect().width
      }));
      assert.equal(fallback.position, 'static'); assert(fallback.width > 100);
    }
    const arrowFallback = await page.locator('#journey-play').evaluate(el => ({
      visible: getComputedStyle(el.querySelector('.sr-only')).position === 'static', text: el.querySelector('.sr-only').textContent
    }));
    assert(arrowFallback.visible); assert.equal(arrowFallback.text, 'Play the game');
    await capture(page, 'chromium-390-image-fallback');
    results.push({ imageFailureFallback: 'both titles and Play control readable' });
  } finally { await browser.close(); }
  const report = { checkedAt: new Date().toISOString(), results,
    limits: 'Headless browser engines and viewport/touch emulation, not physical Apple/Samsung/Pixel devices. Nonlocal network blocked. No signup submissions.' };
  if (evidenceDir) fs.writeFileSync(path.join(evidenceDir, 'results.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
})().catch(error => { console.error(error); process.exitCode = 1; });

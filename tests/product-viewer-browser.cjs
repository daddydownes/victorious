const assert = require('node:assert/strict');
const { chromium, webkit, firefox } = require('playwright');
const base = process.env.BASE_URL || 'http://127.0.0.1:8924/';

(async () => {
  for (const [engine, width, height] of [
    ['chromium', 1440, 900], ['chromium', 390, 844],
    ['webkit', 390, 844], ['firefox', 320, 568],
  ]) {
    const browser = await { chromium, webkit, firefox }[engine].launch();
    try {
      const page = await browser.newPage({ viewport: { width, height }, reducedMotion: 'reduce' });
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.route('**/formsubmit.co/**', route => route.fulfill({ json: { success: true } }));
      await page.goto(base, { waitUntil: 'domcontentloaded' });
      await page.waitForFunction(() => !nextDrop.inert);
      for (const name of ['zip-hoodie', 'spray-tee', 'canberra-tee', 'black-tee']) {
        const button = page.locator(`[data-view-product="${name}"]`);
        await button.click();
        await page.waitForFunction(() => productViewer.open);
        await page.waitForFunction(() => productViewerImage.currentSrc.includes('/full/') && productViewerImage.complete && productViewerImage.naturalWidth > 0);
        const state = await page.evaluate(() => {
          const photo = productViewerImage.getBoundingClientRect();
          return { source: productViewerImage.currentSrc, width: productViewerImage.naturalWidth, alt: productViewerImage.alt,
            modal: productViewer.matches(':modal'), backdrop: getComputedStyle(productViewer).backgroundColor,
            locked: getComputedStyle(nextDrop).overflowY === 'hidden', focused: document.activeElement.id,
            fits: photo.left >= -1 && photo.right <= innerWidth + 1 && photo.top >= -1 && photo.bottom <= innerHeight + 1 };
        });
        assert(state.source.endsWith(`/assets/products/full/${name}.jpg`));
        assert(state.width >= (name === 'zip-hoodie' || name === 'spray-tee' ? 1080 : 1440));
        assert(state.alt && state.modal && state.backdrop === 'rgb(0, 0, 0)' && state.locked && state.fits);
        assert.equal(state.focused, 'productViewerClose');
        await page.keyboard.press('Escape');
        await page.waitForFunction(() => !productViewer.open);
        await page.waitForFunction(name => document.activeElement === document.querySelector(`[data-view-product="${name}"]`), name);
      }
      assert.deepEqual(errors, []);
      console.log(`PASS product viewer ${engine} ${width}x${height}`);
    } finally { await browser.close(); }
  }
})().catch(error => { console.error(error); process.exitCode = 1; });

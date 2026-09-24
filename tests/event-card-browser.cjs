const assert=require('node:assert/strict');
const pw=require('playwright');

const base=process.env.BASE_URL||'http://127.0.0.1:8924/';
(async()=>{
 for(const [engine,width,height] of [['chromium',1440,900],['webkit',390,844],['firefox',320,568]]){
  const browser=await pw[engine].launch();
  try{
   const page=await browser.newPage({viewport:{width,height}});
   await page.goto(base,{waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>!nextDrop.inert);
   await page.locator('#collectionScrollCue').click();
   const card=page.locator('.popup-countdown');
   await card.waitFor({state:'visible'});
   assert.match(await card.getAttribute('href'),/moshtix\.com\.au\/v2\/event\/pass-the-mic-canberra/);
   assert.equal(await card.getAttribute('target'),'_blank');
   await page.evaluate(()=>{window.__eventClicks=0;document.querySelector('.popup-countdown').addEventListener('click',e=>{e.preventDefault();window.__eventClicks++})});
   await page.locator('.popup-name').click();
   await page.locator('.popup-date').click();
   const timer=page.locator('#popupClock');
   await (await timer.isVisible()?timer:page.locator('#popupStarted')).click();
   await card.focus();
   assert.equal(await page.evaluate(()=>document.activeElement?.classList.contains('popup-countdown')),true);
   await page.keyboard.press('Enter');
   assert.equal(await page.evaluate(()=>window.__eventClicks),4);
   console.log('PASS event card title, venue, timer and keyboard',engine,width,height);
  }finally{await browser.close()}
 }
})().catch(e=>{console.error(e);process.exitCode=1});

// Execute the current viewport-overlap controller, including sections taller than a phone.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const js=fs.readFileSync(path.join(__dirname,'../tools/guided/journey.js'),'utf8');
const source=js.match(/function syncChapter\(\)\{[\s\S]*?\n\}/)[0];let checks=0;
for(const viewport of [320,375,390,568,844,900])for(const height of [500,680,876.25,1400,4000]){
 const c={world:{scrollTop:0},flowHeight:viewport,flowDistance:1000,gameHeight:height,gameVisible:false,state:'story',paintGameArrow(){},syncFilm(){},syncPreview(){}};
 vm.createContext(c);vm.runInContext(source,c);c.syncChapter();assert.equal(c.state,'story');
 c.world.scrollTop=1000;c.syncChapter();assert.equal(c.state,'preview');assert.equal(c.gameVisible,true);
 c.world.scrollTop=0;c.syncChapter();assert.equal(c.state,'story');assert.equal(c.gameVisible,false);
 c.state='game';c.world.scrollTop=1000;c.syncChapter();assert.equal(c.state,'game');checks+=4;
}
console.log('guided native scroll: '+checks+' viewport, oversized-section, reverse and game-isolation checks passed');

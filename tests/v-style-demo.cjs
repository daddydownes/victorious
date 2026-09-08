'use strict';
// Static guardrails for the local V-style concept. The new artwork may change;
// the canonical V, course rules, collision geometry and saved media may not.
const assert=require('node:assert/strict'),cp=require('node:child_process'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),baseline='81ab867';
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const saved=file=>cp.execFileSync('git',['show',baseline+':'+file],{cwd:root,encoding:'utf8',maxBuffer:32*1024*1024});
function block(source,name){
 const marker='    function '+name+'(',start=source.indexOf(marker);assert(start>=0,'missing '+name);
 const next=source.indexOf('\n    function ',start+marker.length);return source.slice(start,next<0?source.length:next);
}
function withoutPaint(source){
 const marker='/* FLAPPY METAL BODY */';
 const stripped=source.replace(/\/\* FLAPPY METAL BEGIN \*\/[\s\S]*?\/\* FLAPPY METAL END \*\//,marker);
 assert.notEqual(stripped,source,'missing marked Flappy paint renderer');
 return stripped;
}
const protectedFunctions=['flapTraceLogo','flapLogoContours','flapPolePolygon','flapCollision','flapLevel','flapCourseProgress','flapPace','flapInterval','flapSpawn','flapAperture','flapHazardPolygons','flapTraversal','flapGateUpdate','flapStep','flapDrawV'];
for(const file of ['index.html','experience/index.html','experience/game-preview.html']){
 const current=withoutPaint(read(file)),before=withoutPaint(saved(file));
 for(const name of protectedFunctions)assert.equal(block(current,name),block(before,name),file+' changed protected '+name);
}
const canonical=saved('index.html').match(/class="vmark"[^>]*>[\s\S]*?<path d="([^"]+)"/)[1];
for(const file of ['index.html','experience/index.html'])assert.equal(read(file).match(/class="vmark"[^>]*>[\s\S]*?<path d="([^"]+)"/)[1],canonical,file+' changed the canonical V/star path');
const titleAssets=['experience/assets/play-the-game-vstyle-v1.svg','experience/assets/back-to-the-vault-vstyle-v1.svg'];
for(const file of titleAssets){
 assert(fs.existsSync(path.join(root,file)),'missing versioned title asset '+file);
 const svg=read(file),head=svg.match(/<svg\b[^>]*>/)?.[0]||'';
 assert(/\bwidth="1536"/.test(head)&&/\bheight="1024"/.test(head)&&/\bviewBox="0 0 1536 1024"/.test(head),file+' must retain the native 3:2 title canvas');
 assert(!/<(?:filter|image|linearGradient|radialGradient|script|text)\b/i.test(svg),file+' must stay self-contained flat vector art');
 const colours=[...svg.matchAll(/#[0-9a-f]{6}/gi)].map(m=>m[0].toLowerCase());assert(colours.length&&colours.every(value=>value==='#f0d492'),file+' uses a colour other than canonical #f0d492');
 assert(/<(?:g|path|circle|ellipse)\b[^>]*(?:fill|stroke)="#f0d492"/i.test(svg),file+' has no canonical-gold artwork');
 assert(!/\bstyle\s*=|\bon\w+\s*=|\bhref\s*=/i.test(svg),file+' contains embedded styling, behavior or references');
}
const arrowAsset='experience/assets/play-arrow-vstyle-v1.svg',arrow=read(arrowAsset),arrowHead=arrow.match(/<svg\b[^>]*>/)?.[0]||'';
assert(/\bwidth="1280"/.test(arrowHead)&&/\bheight="1280"/.test(arrowHead)&&/\bviewBox="0 0 1280 1280"/.test(arrowHead),'play arrow must retain its native square canvas');
assert(!/<(?:filter|image|linearGradient|radialGradient|script|text)\b/i.test(arrow),'play arrow must stay self-contained flat vector art');
const arrowColours=[...arrow.matchAll(/#[0-9a-f]{6}/gi)].map(m=>m[0].toLowerCase());
assert(arrowColours.length&&arrowColours.every(value=>value==='#f0d492'),'play arrow uses a colour other than canonical #f0d492');
assert(!/\bstyle\s*=|\bon\w+\s*=|\bhref\s*=/i.test(arrow),'play arrow contains embedded styling, behavior or references');
const story=read('experience/index.html');
assert(story.includes('src="assets/play-the-game-vstyle-v1.svg"'),'play title is not wired into the story');
assert(story.includes(arrowAsset.replace('experience/','')),'play arrow is not wired into the story');
assert(story.includes('<span class="paint-title-text">Play the game.</span>'),'readable play-title fallback changed');
assert(story.includes('id="play-title" class="paint-pending"'),'pending play-title layout contract changed');
assert(!/<section\b[^>]*\bid="vault-invite"/.test(story)&&!story.includes('id="vault-title"')&&!story.includes('class="action vault-return"'),'retired Back to the Vault invitation remains in the story');
assert(story.includes('class="story-return-link" href="../#vault"')&&story.includes('id="story-return-end"'),'story return does not retain its accessible Vault route');
for(const retired of ['id="ending"','class="ending-grid"','id="restart-page"','class="signup-footer"','id="signup-form"','class="closing-footer"','id="sharedVault"','id="sharedLightbox"'])assert(!story.includes(retired),retired+' remains after the playable story');
const paint=read('tools/flappy-clean-paint.js'),graffiti=require(path.join(root,'tools/flappy-graffiti-art.js')),atlas=paint.slice(paint.indexOf('  function graffitiAtlas('),paint.indexOf('\n  function textureSprite('));
assert(paint.includes("var PAINT = '#f0d492';"),'canvas paint token must exactly match the canonical V');
assert.equal(graffiti.gold,'#f0d492','graffiti module must declare canonical gold');assert.equal(graffiti.motifs.length,5);assert(graffiti.motifs.every(motif=>motif.paths.length&&motif.paths.every(layer=>layer.fill==='#f0d492')),'graffiti motif uses a noncanonical fill');
assert(atlas.includes('ctx.fillStyle = PAINT; ctx.fill(graffitiPath(motif, p));'),'graffiti atlas does not render from the canonical paint token');assert(!paint.includes('function drawFacePaint('),'retired line swash remains in the renderer');
assert(paint.includes('pathPolygon(ctx, polygon, 0, 0);\n    ctx.clip();'),'all face decoration must remain inside the collision polygon');
for(const file of ['index.html','experience/index.html']){const generated=read(file);assert(generated.includes("side,g.serial*16+(g.phase||0),g.serial%5===4);"),file+' does not gate both obstacle halves from the immutable gate serial');assert(!generated.includes("side,g.serial*16+(g.phase||0));"),file+' still decorates every obstacle pair');assert(!generated.includes("side,(FG.bgT||0)*.08+g.serial*.13);"),file+' still animates the graffiti seed')}
{const preview=read('experience/game-preview.html');assert(preview.includes("side,g.serial*16+(g.phase||0),true);"),'preview no longer decorates every obstacle pair');assert(!preview.includes("side,g.serial*16+(g.phase||0),g.serial%5===4);"),'preview incorrectly uses sparse playable-game graffiti')}
assert(read('index.html').includes('function flapLevel(score){return Math.min(3,Math.floor(Math.max(0,score)/25));}'));
assert(read('experience/game-preview.html').includes('function flapLevel(score){return Math.floor(Math.max(0,score)/10)%4;}'));
console.log(JSON.stringify({pass:true,baseline,protectedFunctions:protectedFunctions.length,routes:3,titleAssets,arrowAsset,canonicalGold:'#f0d492',checks:['canonical V path','physics and collision source identity','actual 25 / preview 10 progression','flat self-contained title and arrow SVGs','readable pending fallbacks']}));

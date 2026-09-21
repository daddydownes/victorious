// Exercise the shipped countdown at start/end and lifecycle boundaries.
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const html=fs.readFileSync('index.html','utf8'),js=fs.readFileSync('tools/guided/journey.js','utf8').split('// Use the listed Canberra event start, with an explicit timezone offset.')[1];
assert(html.includes(js));
const start=html.match(/data-start="([^"]+)"/)[1],end=html.match(/data-end="([^"]+)"/)[1];
let now=Date.parse(start)-86400000,tick,active=false,changed;const fields={},clock={dataset:{start,end},querySelector:s=>fields[s]??={textContent:''}},started={},panel={inert:false},document={hidden:false,getElementById:id=>({popupClock:clock,popupStarted:started,nextDrop:panel}[id]),addEventListener:(name,f)=>changed=f};
vm.runInNewContext(js,{document,Date:{parse:Date.parse,now:()=>now},MutationObserver:class{observe(){}},setInterval:f=>(tick=f,active=true,1),clearInterval(){active=false}});
assert.equal(fields['[data-time="days"]'].textContent,'01');assert(active);document.hidden=true;changed();assert(!active);document.hidden=false;changed();assert(active);
now=Date.parse(start);tick();assert(clock.hidden&&!started.hidden);assert.equal(started.textContent,'On now · Until 10 PM');assert(active);
now=Date.parse(end);tick();assert.equal(started.textContent,'This pop-up has finished.');assert(!active);assert(Object.values(fields).every(f=>f.textContent==='00'));
console.log('PASS countdown timezone, one-day boundary, visibility pause, live window, end and nonnegative values');

'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

let gradients = 0;
function spyContext(actions) {
  const gradient = { addColorStop() {} };
  return {
    save() { actions?.push('save'); }, restore() { actions?.push('restore'); },
    beginPath() { actions?.push('begin'); }, closePath() {},
    moveTo() {}, lineTo() {}, clip() { actions?.push('clip'); }, stroke() { actions?.push('paint'); },
    fillRect() { actions?.push('paint'); }, drawImage() { actions?.push('paint'); },
    scale() {}, createLinearGradient() { gradients++; return gradient; },
    set fillStyle(v) {}, set strokeStyle(v) {}, set lineWidth(v) {},
    set lineJoin(v) {}, set lineCap(v) {}
  };
}
const document = { createElement() {
  return { width: 0, height: 0, getContext() { return spyContext(); } };
} };
const sandbox = { document };
vm.createContext(sandbox);
const html = fs.readFileSync(require('node:path').join(__dirname, '..', 'index.html'), 'utf8');
const begin = html.indexOf('/* FLAPPY METAL BEGIN */');
const end = html.indexOf('/* FLAPPY METAL END */');
assert.ok(begin >= 0 && end > begin, 'embedded Flappy metal renderer markers missing');
vm.runInContext(html.slice(begin + '/* FLAPPY METAL BEGIN */'.length, end), sandbox);
const draw = sandbox.flapDrawMetal;
const top = [[10, 0], [70, 0], [70, 80], [61, 92], [19, 92], [10, 80]];

const actions = [];
draw(spyContext(actions), top, { d: 2 }, 'pillar', 0, .1);
assert.equal(actions[0], 'save');
assert.ok(actions.indexOf('clip') >= 0);
assert.ok(actions.slice(0, actions.indexOf('clip')).every(x => x !== 'paint'));
assert.equal(actions.at(-1), 'restore');
const firstGradients = gradients;

// Translation, height and phase changes reuse the same width/type material tile.
draw(spyContext([]), top.map(([x, y]) => [x + 100, y + 23]), { d: 2 }, 'pillar', 0, .8);
draw(spyContext([]), [[10, 0], [70, 0], [70, 150], [61, 162], [19, 162], [10, 150]], { d: 2 }, 'pillar', 0, .3);
assert.equal(gradients, firstGradients);

// Angled passage edges are selected for rails on both halves.
assert.ok(draw.passageSegmentCount(top, 0) >= 2);
const bottom = [[19, 100], [61, 100], [70, 112], [70, 220], [10, 220], [10, 112]];
assert.ok(draw.passageSegmentCount(bottom, 1) >= 2);

// Degenerate input does not touch canvas state.
const untouched = [];
draw(spyContext(untouched), [[0, 0], [1, 1]], { d: 1 }, 'pillar', 0, 0);
assert.deepEqual(untouched, []);

// Many widths/types remain strictly bounded.
for (let i = 0; i < 90; i++) {
  const w = 20 + i * 3;
  draw(spyContext([]), [[0, 0], [w, 0], [w, 90], [0, 90]], { d: 1 }, i % 2 ? 'arch' : 'slant', 0, 0);
}
assert.equal(draw.cacheSize(), 64);
assert.ok(draw.cacheBytes() <= 16 * 1024 * 1024);
draw.clearCache();
assert.equal(draw.cacheSize(), 0);
assert.equal(draw.cacheBytes(), 0);
console.log('flappy material: clip discipline, angled rails and 64-entry cache passed');

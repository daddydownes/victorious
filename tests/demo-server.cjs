const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { spawn } = require('node:child_process');
const { createDemoServer } = require('../tools/serve-demo.cjs');
const root = path.resolve(__dirname, '..');
const { server, rootId } = createDemoServer();
async function run() {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  const base = `http://127.0.0.1:${port}`;
  try {
    const home = await fetch(base + '/');
    assert.equal(home.status, 200);
    assert.equal(await home.text(), fs.readFileSync(path.join(root, 'index.html'), 'utf8'));
    const redirect = await fetch(base + '/experience?demo=1', { redirect: 'manual' });
    assert.equal(redirect.status, 302);
    assert.equal(redirect.headers.get('location'), '/experience/?demo=1');
    const film = fs.readFileSync(path.join(root, 'experience/assets/story-film.mp4'));
    for (const [range, start, end] of [['bytes=0-127', 0, 127], ['bytes=-64', film.length - 64, film.length - 1], [`bytes=${film.length - 32}-`, film.length - 32, film.length - 1]]) {
      const response = await fetch(base + '/experience/assets/story-film.mp4', { headers: { Range: range } });
      assert.equal(response.status, 206);
      assert.equal(response.headers.get('content-type'), 'video/mp4');
      assert.deepEqual(Buffer.from(await response.arrayBuffer()), film.subarray(start, end + 1));
    }
    assert.equal((await fetch(base + '/experience/assets/story-film.mp4', { headers: { Range: 'bytes=999999999-' } })).status, 416);
    const head = await fetch(base + '/experience/assets/story-film.mp4', { method: 'HEAD' });
    assert.equal(head.headers.get('content-length'), String(film.length));
    assert.equal((await head.arrayBuffer()).byteLength, 0);
    assert.equal((await fetch(base + '/missing-file')).status, 404);
    assert.equal((await fetch(base + '/.git')).status, 403);
    assert.equal((await fetch(base + '/', { method: 'POST' })).status, 405);
    assert.equal((await (await fetch(base + '/__vctrs_demo')).json()).rootId, rootId);
    const repeat = await new Promise((resolve, reject) => {
      const child = spawn(process.execPath, ['tools/serve-demo.cjs', '--port', String(port)], { cwd: root });
      let output = '';
      child.stdout.on('data', chunk => output += chunk);
      child.stderr.on('data', chunk => output += chunk);
      child.on('error', reject);
      child.on('exit', code => resolve({ code, output }));
    });
    assert.equal(repeat.code, 0);
    assert.match(repeat.output, /already running/);
    console.log('PASS: real root, directory redirect, three video ranges, range rejection, HEAD, missing paths, dotfile blocking, method restriction, same-folder repeat launch. No signup submitted.');
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
}
run().catch(error => { console.error(error); process.exitCode = 1; server.close(); });

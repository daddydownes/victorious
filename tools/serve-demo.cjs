const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFile } = require('node:child_process');

const siteRoot = path.resolve(__dirname, '..');
const defaultPort = 59408;
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.mp4': 'video/mp4', '.ico': 'image/x-icon' };

function createDemoServer(directory = siteRoot) {
  const root = fs.realpathSync(directory);
  const rootId = crypto.createHash('sha256').update(root).digest('hex');
  const inside = file => file === root || file.startsWith(root + path.sep);
  const server = http.createServer((req, res) => {
    if (!['GET', 'HEAD'].includes(req.method)) {
      res.writeHead(405, { Allow: 'GET, HEAD' }).end();
      return;
    }
    let url, pathname;
    try {
      url = new URL(req.url, 'http://127.0.0.1');
      pathname = decodeURIComponent(url.pathname);
    } catch {
      res.writeHead(400).end('Invalid address');
      return;
    }
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    if (pathname === '/__vctrs_demo') {
      const body = JSON.stringify({ app: 'vctrs-complete-demo', rootId });
      res.writeHead(200, { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) });
      res.end(req.method === 'HEAD' ? undefined : body);
      return;
    }
    try {
      let file = path.resolve(root, '.' + pathname);
      if (!inside(file) || pathname.split(/[\\/]/).some(part => part.startsWith('.'))) {
        res.writeHead(403).end('Unavailable path');
        return;
      }
      file = fs.realpathSync(file);
      if (!inside(file)) {
        res.writeHead(403).end('Unavailable path');
        return;
      }
      if (fs.statSync(file).isDirectory()) {
        if (!url.pathname.endsWith('/')) {
          res.writeHead(302, { Location: url.pathname + '/' + url.search }).end();
          return;
        }
        file = fs.realpathSync(path.join(file, 'index.html'));
        if (!inside(file)) { res.writeHead(403).end(); return; }
      }
      const stat = fs.statSync(file);
      if (!stat.isFile()) { res.writeHead(404).end('Not found'); return; }
      res.setHeader('Content-Type', types[path.extname(file).toLowerCase()] || 'application/octet-stream');
      res.setHeader('Accept-Ranges', 'bytes');
      let start = 0, end = stat.size - 1;
      if (req.headers.range) {
        const match = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
        const invalid = () => res.writeHead(416, { 'Content-Range': 'bytes */' + stat.size }).end();
        if (!match || (!match[1] && !match[2])) { invalid(); return; }
        if (!match[1]) {
          const suffix = Number(match[2]);
          if (!Number.isSafeInteger(suffix) || suffix <= 0) { invalid(); return; }
          start = Math.max(0, stat.size - suffix);
        } else {
          start = Number(match[1]);
          end = match[2] ? Number(match[2]) : end;
        }
        if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 0 || start >= stat.size || end < start) { invalid(); return; }
        end = Math.min(end, stat.size - 1);
        res.statusCode = 206;
        res.setHeader('Content-Range', `bytes ${start}-${end}/${stat.size}`);
      }
      res.setHeader('Content-Length', Math.max(0, end - start + 1));
      if (req.method === 'HEAD' || stat.size === 0) { res.end(); return; }
      fs.createReadStream(file, { start, end }).on('error', () => res.destroy()).pipe(res);
    } catch {
      res.writeHead(404).end('Not found');
    }
  });
  return { server, rootId };
}

function openBrowser(url) {
  const command = process.platform === 'win32' ? 'rundll32.exe' : process.platform === 'darwin' ? 'open' : 'xdg-open';
  const args = process.platform === 'win32' ? ['url.dll,FileProtocolHandler', url] : [url];
  execFile(command, args, { windowsHide: true }, error => {
    if (error) console.log('Open this address in your browser: ' + url);
  });
}

async function main() {
  const args = process.argv.slice(2);
  const portIndex = args.indexOf('--port');
  const port = portIndex === -1 ? defaultPort : Number(args[portIndex + 1]);
  if (!Number.isInteger(port) || port < 0 || port > 65535) throw Error('Use --port with a number from 0 to 65535.');
  for (const relative of ['index.html', 'film.mp4', 'experience/index.html', 'experience/assets/story-film.mp4', 'experience/assets/fly-the-v-spray.png']) {
    if (!fs.existsSync(path.join(siteRoot, relative))) throw Error('Missing demo file: ' + relative + '. Keep the complete demo folder together.');
  }
  const { server, rootId } = createDemoServer();
  try {
    await new Promise((resolve, reject) => {
      server.once('error', reject);
      server.listen(port, '127.0.0.1', () => { server.removeListener('error', reject); resolve(); });
    });
  } catch (error) {
    if (error.code !== 'EADDRINUSE') throw error;
    const existing = await new Promise(resolve => {
      const req = http.get(`http://127.0.0.1:${port}/__vctrs_demo`, response => {
        let body = '';
        response.on('data', chunk => { body += chunk; if (body.length > 4096) req.destroy(); });
        response.on('end', () => { try { resolve(JSON.parse(body)); } catch { resolve(null); } });
        response.on('error', () => resolve(null));
      });
      req.setTimeout(1500, () => req.destroy());
      req.on('error', () => resolve(null));
    });
    if (existing?.app !== 'vctrs-complete-demo' || existing.rootId !== rootId) throw Error(`Port ${port} is used by another app. Run node tools/serve-demo.cjs --port 59409 --open to use another port.`);
    const url = `http://127.0.0.1:${port}/`;
    console.log('VCTRS demo is already running.\n' + url);
    if (args.includes('--open')) openBrowser(url);
    return;
  }
  const url = `http://127.0.0.1:${server.address().port}/`;
  console.log('VCTRS complete demo\n' + url + '\nKeep this window open while viewing. Press Ctrl+C to stop.');
  if (args.includes('--open')) openBrowser(url);
}

module.exports = { createDemoServer };
if (require.main === module) main().catch(error => { console.error(error.message); process.exitCode = 1; });

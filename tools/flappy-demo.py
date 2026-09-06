from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
DEMO='''<style>.flap-overlay{z-index:2000!important}#flightDemo{position:fixed;z-index:450;top:72px;left:14px;display:flex;gap:5px;flex-wrap:wrap}#flightDemo button{background:#16130e;color:#f0d492;border:1px solid #665335;padding:9px;font:11px monospace;cursor:pointer}#flightDemo button:focus-visible{outline:2px solid white}</style><nav id="flightDemo" aria-label="Demo difficulty"><button data-score="0">0 · WARM UP</button><button data-score="25">25 · PINS</button><button data-score="50">50 · + SWAY</button><button data-score="75">75 · FINAL LOCK</button></nav><script>
window.addEventListener('load',()=>{document.getElementById('flapOverlay').appendChild(document.getElementById('flightDemo'));window.__flap.open();});
document.getElementById('flightDemo').addEventListener('click',e=>{if(!e.target.hasAttribute('data-score'))return;window.__flap.close();window.__flap.open();window.__flap.tap();const g=window.__flap.dbg();g.score=Number(e.target.dataset.score);g.gateSerial=g.score;g.gates=[];g.spawnT=0;document.getElementById('flap').focus();});
</script>'''
class Handler(SimpleHTTPRequestHandler):
 def __init__(self,*a,**k): super().__init__(*a,directory=str(ROOT),**k)
 def do_GET(self):
  if self.path.split('?')[0]=='/demo':
   page=ROOT.joinpath('index.html').read_text().replace('flapv_best','flapv_demo_best').replace('flapv_won','flapv_demo_won')+DEMO
   b=page.encode();self.send_response(200);self.send_header('Content-Type','text/html; charset=utf-8');self.send_header('Content-Length',str(len(b)));self.end_headers();self.wfile.write(b)
  else:super().do_GET()
ThreadingHTTPServer(('127.0.0.1',8938),Handler).serve_forever()

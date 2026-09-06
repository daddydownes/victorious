"""Local Flappy V review page. Production HTML and saved rewards stay untouched.

Run from any checkout: python3 tools/flappy-demo.py
Then visit http://127.0.0.1:8938/demo (or / for the unmodified candidate).
"""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
# This helper exists only in the response served at /demo. It uses the same
# renderer/collision geometry, but is a static art study, not a flight test.
STUDY = """
    window.__flapWinStudy=function(){
      flapStart(); FG.score=100; FG.gates=[]; FG.y=.5; FG.rot=-.2;
      flapWin(flapSize()); flapResetFrames(); flapDraw(flapSize());
    };

    window.__flapStudy=function(stage){
      flapStart(); fPaused=false; FG.state='idle'; FG.score=stage; FG.gateSerial=stage; FG.gates=[];
      var size=flapSize(); flapSpawn(size); var pole=FG.gates[0];
      pole.x=size.w*.55; pole.target=360; pole.y=360;
      pole.locked=true; pole.reveal=1; pole.opening=pole.finalOpening;
      flapGateUpdate(pole,size,0);
      FG.y=.50; FG.rot=-.20; flapResetFrames(); flapDraw(size);
      fPanel.hidden=true;
    };
"""
DEMO = """
<style>
.flap-overlay{z-index:2000!important}
#flightDemo{position:absolute;z-index:4;top:66px;left:14px;right:14px;
  display:flex;gap:5px;flex-wrap:wrap;pointer-events:none}
#flightDemo button{background:#16130e;color:#f0d492;border:1px solid #665335;
  border-radius:3px;min-height:36px;padding:8px;font:10px Consolas,monospace;
  cursor:pointer;pointer-events:auto}
#flightDemo button:focus-visible{outline:2px solid white}
</style>
<nav id="flightDemo" aria-label="Demo controls, not part of the released game">
  <button data-score="0">0 · PILLARS</button>
  <button data-score="25">25 · ARCHES</button>
  <button data-score="50">50 · SLALOM</button>
  <button data-score="75">75 · JAWS</button>
  <button id="playStage">PLAY THIS STAGE</button>
  <button id="winStudy">PREVIEW WIN</button>
</nav>
<script>
window.addEventListener('load',()=>{
  document.getElementById('flapOverlay').appendChild(document.getElementById('flightDemo'));
  window.__flap.open();
});
let selectedStage=0;
document.getElementById('flightDemo').addEventListener('click',e=>{
  if(e.target.hasAttribute('data-score')) {
    selectedStage=Number(e.target.dataset.score);
    window.__flapStudy(selectedStage);
    return;
  }
  if(e.target.id==='winStudy'){window.__flapWinStudy();return;}
  if(e.target.id!=='playStage') return;
  window.__flap.close(); window.__flap.open(); window.__flap.tap();
  const game=window.__flap.dbg();
  game.score=selectedStage; game.gateSerial=selectedStage;
  game.gates=[]; game.spawnT=0;
  document.getElementById('flap').focus();
});
</script>
"""


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def do_GET(self):
        if self.path.split('?')[0] != '/demo':
            return super().do_GET()
        page = ROOT.joinpath('index.html').read_text()
        page = page.replace('flapv_best', 'flapv_demo_best')
        page = page.replace('flapv_won', 'flapv_demo_won')
        page = page.replace('    window.__flap={', STUDY + '\n    window.__flap={')
        payload = (page + DEMO).encode()
        self.send_response(200)
        self.send_header('Content-Type', 'text/html; charset=utf-8')
        self.send_header('Cache-Control', 'no-store')
        self.send_header('Content-Length', str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)


if __name__ == '__main__':
    print('Flappy V preview: http://127.0.0.1:8938/demo', flush=True)
    ThreadingHTTPServer(('127.0.0.1', 8938), Handler).serve_forever()

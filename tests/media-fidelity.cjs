// Asset fidelity gate for the saved Flappy candidate. Every committed raster,
// video and vector must remain byte exact through this small behavioral release.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const root=path.resolve(__dirname,'..'),baseline='a272869';
const git=args=>cp.execFileSync('git',args,{cwd:root,encoding:'utf8'}).trim();
try{
 const files=git(['ls-tree','-r','--name-only',baseline]).split('\n').filter(file=>/\.(?:avif|gif|jpe?g|mov|mp4|png|svg|webp)$/i.test(file));
 assert(files.length>20,'expected complete saved media inventory');
 for(const file of files){
  assert(fs.existsSync(path.join(root,file)),'missing saved media '+file);
  assert.equal(git(['hash-object',file]),git(['rev-parse',baseline+':'+file]),file+' changed bytes from the saved candidate');
 }
 console.log(JSON.stringify({passed:files.length,byteExact:files.length,baseline,limits:'Checks committed media files. Runtime CSS/canvas rendering is covered by browser regressions, not this byte gate.'}));
}catch(error){console.error(error);process.exitCode=1}

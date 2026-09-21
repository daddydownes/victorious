// Rebuild the reviewed delivery media without touching any original.
// Requires FFmpeg with libx264/libwebp on PATH. The losslessly converted font
// and the extracted matching poster are committed; see assets/delivery/README.md.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const root=path.resolve(__dirname,'..'),dest=path.join(root,'assets','delivery');
fs.mkdirSync(dest,{recursive:true});
function encode(source,name,args){const output=path.resolve(dest,name);if(!output.startsWith(dest+path.sep))throw Error('Delivery path outside output directory');cp.execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-nostdin','-y','-i',path.join(root,source),...args,output],{stdio:'inherit'});}
for(const [source,name,crf]of [['assets/hero-film-51129a88918e.mp4','opening-1080.mp4',20],['assets/story-party-cut.mp4','surface-720.mp4',22]])encode(source,name,['-map','0:v:0','-map','0:a?','-c:v','libx264','-preset','slow','-crf',String(crf),'-pix_fmt','yuv420p','-g','30','-c:a','copy','-movflags','+faststart','-threads','4']);
for(const name of fs.readdirSync(path.join(root,'photos')).filter(p=>/\.jpg$/.test(p)))for(const width of [640,1280])encode('photos/'+name,name.replace('.jpg','-'+width+'.webp'),['-vf',`scale=min(${width}\\,iw):-2:flags=lanczos`,'-frames:v','1','-c:v','libwebp','-quality','92','-compression_level','6']);
console.log('Delivery media regenerated. Inspect matched frames and benchmark before release.');

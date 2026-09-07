const {spawnSync}=require('node:child_process');
const path=require('node:path');
const fs=require('node:fs');
const input=process.argv[2];
if(!input||!fs.existsSync(input))throw Error('Pass the existing source clip as the first argument.');
const output=path.resolve(__dirname,'../experience/assets/story-film.mp4');
// User-selected continuous excerpt: four seconds through the original ending.
const filter='[0:v]trim=start=4,setpts=PTS-STARTPTS,fps=30,scale=1280:720:flags=lanczos,setsar=1[v]';
const result=spawnSync('ffmpeg',['-hide_banner','-loglevel','error','-i',input,'-filter_complex',filter,'-map','[v]','-an','-c:v','libx264','-crf','23','-preset','medium','-pix_fmt','yuv420p','-movflags','+faststart','-y',output],{stdio:'inherit'});
if(result.status!==0)process.exit(result.status||1);
console.log('Edited silent event background: '+fs.statSync(output).size+' bytes.');

// Original custom outlines: no system font or inherited glyph paths.
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const glyph={
P:'M12 5 Q43 0 69 6 Q98 12 98 44 Q98 77 67 85 L40 87 L40 128 Q40 138 29 139 L12 140 Q3 140 3 129 L3 18 Q3 7 12 5 Z M40 31 L40 60 L60 59 Q72 58 72 44 Q72 31 59 31 Z',
L:'M14 4 L31 3 Q41 3 41 14 L40 106 L83 103 Q96 102 97 113 L98 128 Q98 138 87 139 L14 140 Q3 140 3 128 L3 17 Q3 5 14 4 Z',
A:'M40 9 Q44 1 55 2 L66 3 Q77 4 80 15 L105 126 Q107 137 97 140 L82 141 Q73 141 70 132 L65 108 L36 109 L29 132 Q26 141 16 141 L4 140 Q-5 139 -2 128 Z M42 85 L64 84 L56 40 Z',
Y:'M4 5 L22 3 Q30 3 34 12 L55 51 L77 12 Q82 3 90 4 L104 5 Q113 6 109 16 L74 83 L73 129 Q73 140 62 141 L45 141 Q35 141 35 130 L36 82 L-3 18 Q-8 7 4 5 Z',
T:'M8 5 L95 3 Q107 3 107 15 L107 28 Q107 38 96 38 L69 39 L68 128 Q68 140 57 140 L40 141 Q29 141 29 129 L30 39 L7 40 Q-4 40 -4 29 L-4 17 Q-4 6 8 5 Z',
H:'M12 4 L28 3 Q39 3 39 15 L39 54 L72 53 L72 15 Q72 4 83 4 L98 5 Q108 5 108 16 L107 128 Q107 140 96 141 L81 141 Q71 141 71 130 L71 87 L38 88 L38 130 Q38 141 27 141 L11 140 Q1 140 1 129 L2 16 Q2 5 12 4 Z',
E:'M12 5 L89 3 Q100 3 100 14 L99 28 Q99 38 88 38 L39 39 L39 57 L78 55 Q88 55 89 65 L89 77 Q89 87 78 88 L38 89 L38 105 L90 103 Q102 103 102 114 L101 129 Q101 140 90 140 L11 141 Q1 141 1 129 L2 17 Q2 6 12 5 Z',
G:'M99 16 Q107 22 103 31 L96 45 Q92 54 82 48 Q70 39 57 39 Q34 39 33 72 Q32 108 56 108 Q68 108 76 101 L76 86 L61 87 Q51 87 51 77 L51 69 Q51 59 62 59 L97 59 Q107 59 107 70 L106 116 Q106 126 97 131 Q79 143 55 143 Q-4 143 -3 73 Q-2 3 56 2 Q83 1 99 16 Z',
M:'M9 6 L24 4 Q34 3 39 13 L59 55 L80 12 Q85 3 95 4 L109 5 Q119 6 119 18 L118 129 Q118 140 108 141 L96 141 Q85 141 85 130 L87 66 L71 101 Q67 110 59 110 Q51 110 47 101 L31 67 L32 129 Q32 140 22 141 L10 140 Q0 140 0 129 L0 19 Q0 7 9 6 Z'
};
const widths={P:100,L:99,A:108,Y:113,T:110,H:110,E:103,G:110,M:120};
let letters='';
function row(text,y,width,height){let total=0;for(const c of text)total+=c===' '?40:widths[c]+12;total-=12;const sx=width/total,sy=height/144;let x=(1536-width)/2;for(const c of text){if(c===' '){x+=40*sx;continue}letters+=`<g transform="translate(${x.toFixed(3)} ${y}) scale(${sx.toFixed(5)} ${sy.toFixed(5)})"><path data-letter="${c}" transform="matrix(1 0 -.105 1 15 0)" d="${glyph[c]}"/></g>`;x+=(widths[c]+12)*sx}}
row('PLAY',192,1000,310);row('THE GAME',548,1320,222);
const defs=`<g id="lettering" fill-rule="evenodd">${letters}</g><mask id="edge-light" maskUnits="userSpaceOnUse" x="0" y="0" width="1536" height="1024"><use href="#lettering" fill="white"/><use href="#lettering" transform="translate(0 3)" fill="black"/></mask>`;
const depth=Array.from({length:14},(_,i)=>{const y=14-i;return `<use href="#lettering" transform="translate(${y*.55} ${y})" fill="#a77730"/>`}).join('');
const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1536" height="1024" viewBox="0 0 1536 1024" role="img" aria-label="Play the game"><title>Play the game — custom comic lettering</title><defs>${defs}</defs>${depth}<use href="#lettering" fill="#f0d492"/><rect width="1536" height="1024" fill="#fff0c3" opacity=".25" mask="url(#edge-light)"/></svg>`;
fs.writeFileSync(path.join(root,'assets/play-the-game-custom-v1.svg'),svg);
console.log('Built custom comic lettering');

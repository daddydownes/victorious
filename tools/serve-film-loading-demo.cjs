// Local review only: make the real media loading state visible without changing product code.
const {createDemoServer}=require('./serve-demo.cjs');
const {server}=createDemoServer();
const handler=server.listeners('request')[0];
server.removeListener('request',handler);
server.on('request',(req,res)=>{
  if(req.url.split('?')[0]==='/experience/assets/story-film.mp4')setTimeout(()=>handler(req,res),2500);
  else handler(req,res);
});
server.listen(8923,'127.0.0.1',()=>console.log('Loading-circle demo: http://127.0.0.1:8923/experience/?demo=loading-circle#portrait'));

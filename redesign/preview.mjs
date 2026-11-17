import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve, relative, extname} from 'node:path';
const base=import.meta.dirname, project=resolve(base,'..');
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.jpg':'image/jpeg','.jpeg':'image/jpeg','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.ico':'image/x-icon','.otf':'font/otf','.ttf':'font/ttf','.woff2':'font/woff2'};
const server=createServer(async(req,res)=>{
  try{
    const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    const shared=path.startsWith('/assets/'), icon=path==='/favicon.ico';
    const root=shared||icon?project:base;
    const file=resolve(root,'.'+(path==='/'?'/index.html':path));
    const nested=relative(root,file).replaceAll('\\','/').includes('/');
    if(relative(root,file).startsWith('..')||!types[extname(file)]||(!shared&&!icon&&nested&&!path.startsWith('/images/'))){res.writeHead(404);return res.end('Not found');}
    const data=await readFile(file);
    res.writeHead(200,{'Content-Type':types[extname(file)],'Cache-Control':'no-store','X-Robots-Tag':'noindex, nofollow','X-Content-Type-Options':'nosniff'});
    res.end(data);
  }catch{res.writeHead(404);res.end('Not found');}
});
server.listen(Number(process.env.PREVIEW_PORT||8766),'127.0.0.1',()=>console.log('Local redesign: http://localhost:'+server.address().port+'/'));

import fs from 'node:fs';
import path from 'node:path';
const dir='dist/profile/browser', index=fs.readFileSync(dir+'/index.html');
const data=JSON.parse(fs.readFileSync('public/content/workspace.json'));
const routes=new Set(['home','notes','projects-and-nodex',...data.headerMenus.map(m=>m.slug),...data.topics.map(t=>'notes/topic/'+t.id),...data.notes.flatMap(n=>[n.id,...(n.aliases||[])].map(id=>'notes/'+id))]);
for(const route of routes){if(!/^[a-zA-Z0-9_/-]+$/.test(route))throw Error('Invalid route');const folder=path.join(dir,route);fs.mkdirSync(folder,{recursive:true});fs.writeFileSync(path.join(folder,'index.html'),index);}
fs.writeFileSync(dir+'/404.html',index);fs.writeFileSync(dir+'/.nojekyll','');
console.log('Generated',routes.size,'route entry files');

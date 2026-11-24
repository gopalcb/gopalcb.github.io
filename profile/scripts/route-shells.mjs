import fs from 'node:fs';
import path from 'node:path';
const dir='dist/profile/browser', index=fs.readFileSync(dir+'/index.html');
const data=JSON.parse(fs.readFileSync('public/content/workspace.json'));
const routes=new Set(['home','notes','projects-and-nodex',...data.headerMenus.map(m=>m.slug)]);
for(const topic of data.topics){
 const menu=data.headerMenus.find(m=>m.id===topic.id && m.slug!=='projects-and-notes');
 routes.add('notes/topic/'+topic.id);
 if(!menu) routes.add(topic.id);
 for(const project of data.projects.filter(p=>p.topic===topic.id)){
  if(menu) routes.add(menu.slug+'/'+project.id);
 }
 for(const note of data.notes.filter(n=>n.topic===topic.id)){
  const project=data.projects.find(p=>p.topic===topic.id && p.title===note.project);
  const prefix=menu && project ? menu.slug+'/'+project.id : topic.id;
  for(const name of new Set([note.id,note.routeName,...(note.routeAliases||[]),...(note.aliases||[])].filter(Boolean))){
   routes.add(prefix+'/'+name);
   routes.add('notes/'+name);
  }
 }
}
for(const route of [...routes]){
 if(route==='rag-memory-mesh-cli' || route.startsWith('rag-memory-mesh-cli/'))
  routes.add('rag-tool-mcp'+route.slice('rag-memory-mesh-cli'.length));
}
for(const route of routes){if(!route.split('/').every(part=>/^[a-zA-Z0-9_-]+$/.test(part)))throw Error('Invalid route');const folder=path.join(dir,route);fs.mkdirSync(folder,{recursive:true});const target=path.join(folder,'index.html');if(!fs.existsSync(target))fs.writeFileSync(target,index);}
fs.writeFileSync(dir+'/404.html',index);fs.writeFileSync(dir+'/.nojekyll','');
console.log('Generated',routes.size,'route entry files');

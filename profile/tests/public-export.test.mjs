import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const data=JSON.parse(fs.readFileSync('public/content/workspace.json'));
test('export contains only published content and no administration route',()=>{assert(data.notes.every(n=>n.published));assert(data.headerMenus.every(m=>m.published && m.slug!=='admin'));assert(!fs.readFileSync('src/app/app.routes.ts','utf8').includes('admin.component'));assert(!fs.readFileSync('src/app/components/app/app.component.ts','utf8').includes('account-trigger'));assert(!fs.existsSync('src/app/notes/admin.component.ts'));});
test('every registered image and document is bundled',()=>{for(const n of data.notes)for(const a of n.assets||[])assert(fs.existsSync('public/note-assets/'+n.id+'/assets/'+a.name),n.id+': '+a.name);});
test('published notes are available without backend and Home is excluded',()=>{assert(data.notes.some(n=>n.id==='building-a-local-first-cognitive-memory-architecture-for-openai-codex-cli'));assert(!data.headerMenus.some(m=>m.id==='home'));assert(data.headerMenus.some(m=>m.slug==='projects-and-notes'));const store=fs.readFileSync('src/app/notes/notes.store.ts','utf8');assert(!store.includes('/api/workspace'));assert(!store.includes('async commit'));});

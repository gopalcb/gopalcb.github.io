# GitHub Pages reader

Static Angular version of the local notes site. No Admin route, avatar, backend, upload or editing API. Only published snapshot content and its registered assets are exported.

Run npm ci, npm test and npm run build. Deploy dist/profile/browser. Clean route shells support direct note URLs and aliases.

Re-export from the parent workspace with node scripts/export-github-profile.mjs /path/to/a/fresh/workspace.json. Review the snapshot before publishing. The public site does not track local edits until exported and deployed again.

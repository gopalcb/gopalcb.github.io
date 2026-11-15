# Deployment

Public URL: https://gopalcb.github.io/
Source repository: https://github.com/gopalcb/gopalcb.github.io/tree/master/profile
Workflow: .github/workflows/publish-angular-portfolio.yml in that repository.

This folder is the standalone source version; `dist/profile/browser` is the deployable build. The public site uses a snapshot and does not connect to the local FastAPI server. Future note edits require a new export and deployment.

From the parent workspace, export a fresh API workspace snapshot with `node scripts/export-github-profile.mjs /path/to/workspace.json`. The exporter preserves the previous export in a dated sibling backup, preventing stale files from entering the new snapshot. Then run `npm ci`, `npm test` and `npm run build` in this folder. If package declarations changed, regenerate the lockfile with `npm install --package-lock-only` before `npm ci`.

Copy this folder's source to the repository's profile/ directory, excluding exact path segments node_modules, dist and .angular. Do not use substring matching: an article named distinguishing-catheters… must not be excluded as dist. Run export tests in the destination before committing. Pushes affecting profile/ trigger Pages deployment.

Prior profile commit: 450aa32b7c37a4d033e6b040e6d52617f6ed331e. Prior workflow built gopalcb/my-lab-portfolio with an explicit source SHA; its successful prior workflow run is preserved in GitHub Actions. Rollback requires restoring that workflow/source selection and redeploying; changing files alone does not replace a Pages artifact.

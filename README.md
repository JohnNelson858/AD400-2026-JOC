# AD400-2026-JOC

AD400 Project Management in Software Development - Job Offer Comparison

Red Team's CareerPath Solutions student prototype. Plain HTML, CSS, native JavaScript modules, and JSON; no framework, runtime dependencies, database, or API keys.

## What is implemented

- **JOC-44:** shared starter, documented module contracts, local server, checks, and deployment automation. Team agreement on interfaces and another teammate's successful local run still require human verification.
- **JOC-12 / JOC-13:** two labeled, keyboard-accessible offer forms, annual USD salary fields, mobile layout, and visible focus.
- **JOC-14:** separate in-memory records updated on input. No localStorage, sessionStorage, cookies, offer uploads, or server persistence. Refresh starts empty.
- **JOC-15:** Compare captures both latest records, validates, preserves invalid entries, and sends valid records to a basic preview and the `joc:offers-ready` event.

This is the first part of the application, not the whole MVP. Salary-difference calculations (JOC-20), complete salary presentation (JOC-16), extended validation/missing-value rules (JOC-36), benefits/bonus/equity, edit/reset interactions, and whole-sprint integration remain team work. The minimal validation and preview are integration starting points, not claims that those tickets are finished. Jira statuses have not been changed.

## Start locally on Windows

Prerequisites: Git and **Node.js 22 or later** (LTS recommended). Check `git --version` and `node --version` in PowerShell or VS Code Terminal. No `npm install` is needed because there are no external packages.

```powershell
git clone https://github.com/JohnNelson858/AD400-2026-JOC.git
cd AD400-2026-JOC
npm start
```

Open **http://localhost:8080**. Stop the server with **Ctrl+C**. Keep the terminal open while using the app. Do not double-click index.html: module loading and fetching JSON need an HTTP server. If PowerShell blocks `npm.ps1`, use `npm.cmd start` (and `npm.cmd test`) rather than changing machine execution policies. If port 8080 is busy: `$env:PORT=8081; npm.cmd start`.

### GitHub Desktop alternative

1. Accept John's collaborator invitation using your own GitHub account.
2. In GitHub Desktop choose **File → Clone repository → URL**.
3. Paste the repository URL above and select a local folder.
4. Select **Repository → Open in Visual Studio Code**.
5. Open **Terminal → New Terminal**, then run `npm.cmd start`.
6. Before starting work, use **Fetch origin / Pull origin** on main. Create a branch named for your Jira ticket, such as `JOC-20-salary-difference`.
7. Commit only your changes, publish/push the branch, and open a pull request to main for teammate review.

### Terminal collaboration workflow

```powershell
git switch main
git pull --ff-only
git switch -c JOC-20-salary-difference
# Make your changes, then check them:
npm.cmd run check
npm.cmd test
npm.cmd run build
git add assets/js/comparison.js
# Add any other files you intentionally changed by their exact paths.
git commit -m "JOC-20: calculate annual salary difference"
git push -u origin JOC-20-salary-difference
```

Open a pull request on GitHub. Avoid editing directly on main or overwriting a teammate's changes. Resolve conflicts together. Do not commit real offers, API tokens, or `.env` files.

## File map

| Path | Purpose |
| --- | --- |
| `index.html` | Accessible entry form and preview sections |
| `assets/css/styles.css` | Responsive styling and focus/error states |
| `assets/js/app.js` | Input events, Compare orchestration, demo loader |
| `assets/js/model.js` | Independent in-memory offers and fixture validation |
| `assets/js/validation.js` | Initial shared validation and normalization boundary |
| `assets/js/comparison.js` | Replaceable preview renderer for comparison teammates |
| `assets/images/` | Local SVG mark and future image assets |
| `data/example-offers.json` | Fictional public demonstration data only |
| `data/offer-pair.schema.json` | JSON Schema documenting the normalized pair |
| `scripts/serve.mjs` | Local development server |
| `scripts/update-sample.mjs` | Validate and write fictional example JSON |
| `scripts/check.mjs` | Syntax and data checks |
| `scripts/build.mjs` | Copy public files to `dist/` for Pages |
| `tests/` | Model, validation, JSON-update, and build contract tests |
| `docs/` | Architecture, ticket mapping, and human review checklist |
| `.github/workflows/ci.yml` | Check pull requests and main pushes |
| `.github/workflows/pages.yml` | Check, build, and deploy GitHub Pages |
| `.github/workflows/update-sample.yml` | Authenticated manual JSON update with automatic commit |

Git tracks files, so each directory contains a useful file rather than an empty placeholder.

## JSON: what is saved and what is not

**Visitor-entered offers are deliberately not saved or committed.** This follows JOC-14. They live in this tab's JavaScript memory and clear on refresh/close; future backend persistence would be a scope change. The browser's only application fetch retrieves public fictional examples when the user selects **Try fictional examples**. Offer contents are never sent in that request. Browser extensions or user-enabled autofill are outside the application's storage policy.

`data/example-offers.json` is a shared, versioned fixture. It is NOT a writable database. GitHub Pages serves static files and cannot write visitors' edits into the repository. Never place a GitHub token in frontend JavaScript.

### Automated commit for fictional JSON updates

The **Update fictional example JSON** Action lets collaborators update a fixture without cloning:

1. Open `data/example-offers.json` on GitHub and copy its complete contents. Use fictional information only.
2. Go to **Actions → Update fictional example JSON → Run workflow**.
3. Select **main**. Paste the full edited JSON document into **sample_json**.
4. Leave **deploy_pages** unchecked until Pages is configured; afterward check it to redeploy the change.
5. Click **Run workflow**. The action validates schema/rules, runs checks/tests, and automatically commits only the changed example file to main.
6. If data is unchanged, it makes no commit. Invalid JSON fails before commit. When deployment is requested, it explicitly dispatches the Pages workflow, because commits made with `GITHUB_TOKEN` do not trigger normal push workflows.

Only users with repository write permission can run this workflow. It uses GitHub's temporary `GITHUB_TOKEN`, not a personal token. Repository policy must allow the workflow's `contents: write` and `actions: write` permissions. If branch protection requires pull requests, a direct automated push will be rejected: edit the JSON on a branch, open a PR, and let the checks run instead. If another change lands while the workflow runs, its push may be rejected safely; rerun with the latest fixture after reviewing the newer changes.

**Manual JSON alternative:** clone as above, edit `data/example-offers.json`, run all three check commands, commit on a feature branch, push, and open a PR. Normal merged pushes redeploy automatically once Pages is enabled.

## Enable GitHub Pages (John's one-time setup)

1. On GitHub open **Settings → Pages**.
2. Under **Build and deployment → Source**, select **GitHub Actions**. Do not choose Deploy from a branch for this workflow.
3. Open **Actions → Deploy GitHub Pages → Run workflow**, choose main, and run it.
4. Wait for success, then use the URL in the `github-pages` deployment or Pages settings.

Expected project address: **https://johnnelson858.github.io/AD400-2026-JOC/**. It will not be live until Pages is enabled and deployment succeeds. The initial automatic Pages workflow may fail before this setting is enabled; run it again after setup. Do not add custom domain settings.

The deployment copies only `index.html`, `assets/`, and `data/` into `dist/`. All app URLs are relative so the project subpath works. Both ordinary main pushes and explicit deployments run checks before publishing.

## Checks and handoff

```powershell
npm.cmd run check
npm.cmd test
npm.cmd run build
```

See [architecture and interface contract](docs/architecture.md) and [acceptance review checklist](docs/acceptance-review.md). Use Jira to track completion; do not mark JOC-44 Done until a second teammate has run the starter and the team has agreed to the interfaces.

References: [GitHub Pages static hosting](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages), [custom Pages workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages), [GITHUB_TOKEN trigger behavior](https://docs.github.com/en/actions/concepts/security/github_token).

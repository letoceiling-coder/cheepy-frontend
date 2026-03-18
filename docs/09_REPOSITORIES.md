# Repositories And Git Topology

## Production Repositories (on server)

## Backend

- Path: `/var/www/online-parser.siteaacess.store`
- Remote:
  - `origin git@github.com:letoceiling-coder/cheepy-backend.git`
- Active branch:
  - `main` tracking `origin/main`

## Frontend

- Path: `/var/www/siteaacess.store`
- Remote:
  - `origin git@github.com:letoceiling-coder/cheepy-frontend.git`
- Active branch:
  - `main` tracking `origin/main`

## Local Workspace Repositories

## Backend local (`C:\OSPanel\domains\sadavod-laravel`)

- Primary remote: `origin https://github.com/letoceiling-coder/cheepy-backend.git`
- Additional branch observed: `backup/parser-stable-20260306`
- Current branch: `main`

## Frontend local (`C:\OSPanel\domains\cheepy`)

- Primary remote: `origin https://github.com/letoceiling-coder/cheepy-frontend.git`
- Additional remotes also configured: `frosty`, `keen`, `pixel`, `remix`, `sparkle`, `strict`
- Current branch: `main`

Operational note: multiple extra remotes in local frontend repo may cause accidental push confusion without strict workflow discipline.

## CI/CD Repositories Integration

- Backend workflow file: `.github/workflows/deploy-backend.yml`
- Frontend workflow file: `.github/workflows/deploy-frontend.yml`
- Both deploy from `main`
- Both use SSH to target production server

## Branching/Release Model (Observed)

- Production deployment branch: `main`
- No separate release branch currently observed in active deployment workflows
- Deploy is triggered by:
  - push to `main`
  - manual workflow dispatch
  - direct manual server script execution

## Repository Hygiene Observations

On production server, both repos currently contain untracked files/artifacts.

Examples:

- Backend: `.env.tmp`, ad-hoc patch/check scripts
- Frontend: backup dist folders, static artifacts, `_redirects`

Recommendation: maintain a strict "clean working tree" policy on production clones to reduce drift and incident complexity.

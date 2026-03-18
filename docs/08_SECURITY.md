# Security Audit Snapshot

Scope: observed production infrastructure + backend/frontend code and runtime configuration.

## Current Security Posture

## Positive Controls

- HTTPS enabled for main domains via Certbot:
  - `siteaacess.store`
  - `www.siteaacess.store`
  - `online-parser.siteaacess.store`
- Backend production env:
  - `APP_ENV=production`
  - `APP_DEBUG=false`
- MariaDB and Redis are localhost-bound (not internet-exposed)
- JWT auth protects admin API route groups
- Fail2Ban service is running
- Broadcast fallback prevents CLI crashes when Reverb credentials are absent

## Findings / Risks

## High

- Deploy scripts use `root` and `git reset --hard` in production.
  - Risk: accidental loss of uncommitted emergency changes.
  - Risk: broad privileges for deployment path.

## Medium

- `ufw` is inactive.
  - Current safety relies on service binds + external perimeter controls.
- Port `8080` is listening publicly while also used for internal websocket proxying.
  - Prefer binding reverb/listener to localhost where possible and exposing only through Nginx.
- Additional domains (`api.siteaacess.store`, `photos.siteaacess.store`) are HTTP-only in current active Nginx config.

## Low / Operational

- Production repos contain untracked files and backup artifacts.
  - Operational drift can complicate incident response and reproducibility.

## API/Auth Notes

- Admin auth uses JWT (HS256) and `admin_users`.
- Token is accepted via Bearer header and optional query parameter.
  - Query-token support is convenient but less secure in logs/referrers.

## Environment Hygiene

- `.env` files are not exposed via Nginx roots by default (Laravel public root is `public/`).
- Broadcast fallback is implemented in code (`log` fallback when Reverb credentials are missing).
- Parser proxy settings are configurable and currently default-enabled in parser config.

## Recommended Hardening (Priority Order)

1. Replace root deploy with least-privileged deploy user + controlled sudo rules.
2. Remove `git reset --hard` from default deploy path or protect with explicit safe mode.
3. Enable host firewall (`ufw`) with explicit allowlist (22/80/443 only unless needed).
4. Restrict reverb listener to localhost and keep public access through Nginx reverse proxy only.
5. Enforce HTTPS for all externally used domains/subdomains.
6. Remove query-token auth fallback for admin endpoints after verifying no dependency.
7. Add periodic security checks in CI/CD (env sanity, debug checks, open-port checks).

## Ongoing Monitoring Checklist

- Health endpoints monitored continuously
- Failed job and parser timeout thresholds alerted
- Certbot renewal validity checked
- Supervisor process state monitored
- Daily deploy log review (`/var/log/cheepy/deploy.log`)

# Server Infrastructure Audit

## Host And OS

- Hostname: `aoltwgicbj`
- Public IP: `85.117.235.93`
- OS: Ubuntu 24.04.4 LTS
- Kernel: `6.8.0-101-generic`

## Runtime Versions

- PHP: `8.2.30` (CLI + FPM)
- Node.js: `v20.20.0`
- npm: `10.8.2`
- Composer: `2.9.5`
- Nginx: `1.24.0`
- MariaDB: `10.11.14`
- Redis: `7.0.15`
- Supervisor: `4.2.5`

## Key Installed Packages (verified)

- `nginx`, `nginx-common`
- `php8.2-fpm`, `php8.2-cli`, `php8.2-curl`, `php8.2-mysql`, `php8.2-redis`, etc.
- `mariadb-server`, `mariadb-client`
- `redis-server`, `redis-tools`
- `supervisor`
- `certbot`, `python3-certbot-nginx`
- `nodejs`
- `postgresql` (installed and running but not used by audited project)

## Running Services (systemd)

Critical services observed as `active/running`:

- `nginx.service`
- `php8.2-fpm.service`
- `mariadb.service`
- `redis-server.service`
- `supervisor.service`
- `ssh.service`
- `cron.service`
- `fail2ban.service`

Also running on host: `postgresql@16-main.service`, `bella-*` services (separate project).

## Open Ports / Network Exposure

From `ss -tulnp`:

- Public: `22` (SSH), `80` (HTTP), `443` (HTTPS), `8000` (python/bella), `8080` (reverb/php process)
- Localhost-only: `3306` (MariaDB), `6379` (Redis), `5432` (PostgreSQL)

Implication: DB/Redis are not internet-exposed directly.

## Firewall

- `ufw status` -> `inactive`
- Host relies on service binding, cloud perimeter, and Fail2Ban.

## Cron / Scheduler

- Root crontab includes:
  - `* * * * * cd /var/www/online-parser.siteaacess.store && php artisan schedule:run >> /dev/null 2>&1`
- Laravel scheduler then executes parser watchdog and recovery commands (documented in backend architecture).

## SSL / Certificates

Certificates managed by Certbot:

- `online-parser.siteaacess.store` (valid)
- `siteaacess.store` + `www.siteaacess.store` (valid)

Note: `api.siteaacess.store` currently does not present a valid HTTPS certificate route in active Nginx config.

## Deployment Directories

Main directories under `/var/www`:

- `/var/www/online-parser.siteaacess.store` (Laravel backend)
- `/var/www/siteaacess.store` (React frontend repo); Nginx root для сайта: `/var/www/siteaacess.store/dist` (деплой: `npm run deploy:frontend` после локальной сборки)
- `/var/www/api.siteaacess.store` (placeholder)
- `/var/www/photos.siteaacess.store` (static files)
- `/var/www/deploy.sh` (shared deployment orchestrator script)

## Process Management

- System services: systemd
- Application long-running processes: Supervisor
  - parser workers
  - photo worker
  - default queue worker
  - reverb websocket process

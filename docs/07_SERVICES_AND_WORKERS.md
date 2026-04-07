# Services And Workers (Runtime Audit)

This is the runtime process map from real production host state.

## Core System Services (systemd)

Observed as running:

- `nginx.service`
- `php8.2-fpm.service`
- `mariadb.service`
- `redis-server.service`
- `supervisor.service`
- `cron.service`
- `ssh.service`
- `fail2ban.service`

Also running but not used by this project directly: PostgreSQL cluster, Bella services.

## Supervisor Programs (Active)

From `supervisorctl status`:

- `parser-worker:parser-worker_00` (RUNNING)
- `parser-worker:parser-worker_01` (RUNNING)
- `parser-worker-default:parser-worker-default_00` (RUNNING)
- `parser-worker-photos:parser-worker-photos_00` (RUNNING)
- `reverb` (RUNNING)

## Worker Configuration (Active Files)

Directory: `/etc/supervisor/conf.d`

### `parser-worker.conf`

- Command: `artisan queue:work redis --queue=parser` (handles **`RunParserJob`** + **`ParseCategoryJob`** — both use the `parser` queue)
- `numprocs=2`
- `tries=3`
- long stop-wait (`stopwaitsecs=3600`)

### `parser-worker-photos.conf`

- Command: `artisan queue:work redis --queue=photos,default` (if you still route jobs to `default`, include it; parser-only runs can use `--queue=parser` alone)
- `numprocs=1`
- `tries=5`

### `parser-worker-default.conf`

- Command: `artisan queue:work redis --queue=default`
- `numprocs=1`

### `reverb.conf`

- Command: `php artisan reverb:start`
- Managed as long-running supervisor process

## Laravel Scheduler (Cron + schedule:run)

System cron:

- `* * * * * cd /var/www/online-parser.siteaacess.store && php artisan schedule:run`

Current scheduled tasks:

- `parser:watchdog` every 5 minutes
- `parser:network-recover` every 5 minutes
- `parser:lock-heartbeat` every 30 seconds

## Queue Topology

- Queue backend: Redis
- Named queues:
  - `parser`
  - `photos`
  - `default`

Processing model:

- Parser orchestration and category jobs on `parser`
- Photo jobs mostly on `photos`
- Default queue handles general async tasks

## Web Runtime

- Nginx serves HTTPS and proxies PHP to php-fpm socket
- Backend vhost proxies `/app` to `127.0.0.1:8080` for websocket/reverb traffic
- Frontend is static `dist` served by Nginx

## Process Health Interfaces

- `/api/v1/up`
- `/api/v1/ws-status`
- `/api/v1/system/health`
- `/api/v1/parser/health`

These endpoints are intended for operational checks and external monitors.

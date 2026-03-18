# System Monitoring Fix Report

**Date:** 2026-03-05  
**Issue:** Dashboard shows Parser: stopped, Redis: —, WebSocket: —, CPU/Memory: —, Last parsing: —

---

## Root Cause

`GET /api/v1/system/status` was not implemented. Dashboard calls `systemApi.status()` which expects this endpoint. Without it, `systemStatus` is null → all widgets show "—".

---

## Parser Status Logic

- **Source:** `ParserJob::whereIn('status', ['running','pending'])->exists()`
- **Field:** `parser_running: boolean`
- **ParserController /parser/status** (existing): Returns `is_running`, `current_job`, `last_completed` — used when logged in.

---

## Queue Monitoring

- **queue_workers:** `ps aux | grep "queue:work" | grep -v grep | wc -l`
- **queue_size:** `Queue::connection('redis')->size('default')`
- **Endpoint:** Included in `GET /api/v1/system/status` (no separate `/queue/status`)

---

## Redis Check

- **Logic:** `Redis::ping()` → `redis_status: 'connected'` or `'disconnected'`
- **Response field:** `redis_status`

---

## WebSocket Monitoring

- **Logic:** `fsockopen('127.0.0.1', reverb_port)` or `ps aux | grep reverb`
- **Response field:** `websocket: 'running' | 'stopped'`
- **Existing:** `GET /api/v1/ws-status` (public) returns `reverb`, `queue_workers`, `redis`

---

## system/status Implementation

**Route:** `GET /api/v1/system/status` (JWT required)

**Response:**
```json
{
  "parser_running": false,
  "queue_workers": 6,
  "queue_size": 0,
  "products_total": 0,
  "products_today": 0,
  "errors_today": 0,
  "last_parser_run": "2026-03-05T12:00:00.000000Z",
  "redis_status": "connected",
  "websocket": "running",
  "cpu_load": "0.5 0.4 0.3",
  "memory_usage": "1024M / 2048M",
  "timestamp": "2026-03-05T19:00:00.000000Z"
}
```

**last_parsing_at:** `SELECT MAX(finished_at) FROM parser_jobs WHERE status = 'completed'` → `last_parser_run`

---

## Dashboard API Mapping

| Widget        | API            | Field(s)                          |
|---------------|----------------|-----------------------------------|
| Parser        | system/status  | parser_running                    |
| Queue         | system/status  | queue_size, queue_workers         |
| Redis         | system/status  | redis_status                      |
| WebSocket     | system/status  | websocket                         |
| CPU / Memory  | system/status  | cpu_load, memory_usage            |
| Last parsing  | system/status  | last_parser_run                   |
| Products      | system/status  | products_total, products_today, errors_today |

**Fallback:** If system/status fails, dashboard uses `parserApi.stats()` for `parser_running`, `queue_size`, `last_parser_run`, etc. Redis/WebSocket still need system/status.

---

## Events Stream (SSE)

- **Endpoint:** `GET /api/v1/parser/progress?job_id=X&token=JWT`
- **Type:** text/event-stream (SSE)
- **Fix:** Return type corrected (StreamedResponse) in earlier patch
- **Frontend:** ParserPage uses EventSource, reconnects on close/error

---

## Changes Made

1. **Backend:** Added `GET /api/v1/system/status` route in `routes/api.php` (JWT group)
2. **Frontend:** `refetchInterval` for system-status query set to 10000 ms

---

## Deploy Note

The system/status route was added on the server. It will be overwritten by `git reset --hard` on deploy. To keep it:

1. Add the route to `cheepy-backend` repo `routes/api.php`
2. Commit and push
3. Run deploy

# System Monitoring Implementation Report

**Date:** 2026-03-05  
**Goal:** Add system monitoring endpoints and admin dashboard widgets  

---

## 1. API Endpoints

### GET /api/v1/system/status

**Auth:** Public (no JWT required), same group as `/up`, `/ws-status`, `/health`

**Response:**
```json
{
  "parser_running": true,
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
  "timestamp": "2026-03-05T16:00:00.000000Z"
}
```

| Field | Description |
|-------|-------------|
| parser_running | Whether a parser job is running or pending |
| queue_workers | Number of `artisan queue:work` processes |
| queue_size | Redis `llen queues:default` |
| products_total | Total products in DB |
| products_today | Products parsed today |
| errors_today | Products with status=error updated today |
| last_parser_run | ISO8601 of last completed job |
| redis_status | `connected` or `failed` |
| websocket | `running` or `stopped` (Reverb) |
| cpu_load | 1/5/15 min load average |
| memory_usage | Used/Total memory from /proc/meminfo |
| timestamp | Response time |

---

## 2. Dashboard Widgets

**Location:** Admin Dashboard (`/admin`)

| Widget | Data Source | Description |
|--------|-------------|-------------|
| Parser status | parser_running | Badge: Работает / Остановлен |
| Queue | queue_size, queue_workers | Size and worker count |
| Redis | redis_status | Badge: connected / failed |
| WebSocket | websocket | Badge: running / stopped |
| CPU / Memory | cpu_load, memory_usage | Load avg and mem used/total |
| Last parse | last_parser_run | Timestamp of last run |

**Refresh:** Every 5 seconds (`refetchInterval: 5000`)

---

## 3. Metrics Collected

| Metric | Source |
|--------|--------|
| Queue size | `Redis::llen('queues:default')` |
| Queue workers | `ps aux \| grep "artisan queue:work"` |
| Products total | `Product::count()` |
| Products today | `Product::whereDate('parsed_at', today())` |
| Errors today | `Product::where('status','error')->whereDate('updated_at', today())` |
| Parser running | `ParserJob::whereIn('status', ['running','pending'])->exists()` |
| Redis | `Redis::ping()` |
| WebSocket | fsockopen to Reverb port |
| CPU load | `sys_getloadavg()` |
| Memory | `/proc/meminfo` (MemTotal, MemAvailable) |

---

## 4. System Health Summary

The dashboard provides a quick view of:
- **Parser:** Running/stopped
- **Queue:** Size and worker count
- **Infrastructure:** Redis, WebSocket (Reverb)
- **Resources:** CPU load, memory
- **Data:** Products total, today, errors

---

## Files Modified

- **Backend:** `routes/api.php` — added `GET system/status` closure
- **Frontend:** `src/lib/api.ts` — added `systemApi.status()` and `SystemStatus` type
- **Frontend:** `src/admin/pages/DashboardPage.tsx` — added system status query and widgets

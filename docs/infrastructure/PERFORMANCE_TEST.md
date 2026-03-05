# PERFORMANCE TEST

**Purpose**: Simulate 1000 products parsing, measure duration, memory, error rate.

---

## Prerequisites

- Parser API running with queue workers
- Redis + Supervisor configured

---

## Test Script (manual)

### 1. Start parser (full or category-limited)

```bash
# Via API
curl -X POST https://online-parser.siteaacess.store/api/v1/parser/start \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d '{"type":"full","products_per_category":50,"max_pages":2,"save_to_db":true}'
```

### 2. Monitor progress

```bash
# Get job_id from start response, then:
curl -N "https://online-parser.siteaacess.store/api/v1/parser/progress?job_id=JOB_ID" \
  -H "Authorization: Bearer YOUR_JWT"
```

### 3. Server-side metrics

```bash
# Memory during run
watch -n 5 'ps aux | grep "queue:work" | head -5'

# Redis queue size
redis-cli LLEN queues:default

# Laravel logs
tail -f /var/www/online-parser.siteaacess.store/storage/logs/laravel.log
```

---

## Metrics to Record

| Metric | Target | Actual |
|--------|--------|--------|
| Products parsed | 1000 | _ |
| Duration (minutes) | _ | _ |
| Memory peak (MB) | < 512 | _ |
| Error rate (%) | < 1% | _ |
| Queue lag (seconds) | < 60 | _ |

---

## Load Test (optional, with Apache Bench / k6)

```bash
# Simple endpoint load (not parser)
ab -n 100 -c 10 https://online-parser.siteaacess.store/api/v1/health
```

# LOAD TEST REPORT — Phase 8

**Date**: _Fill after test_

---

## Test Scenarios

| Scale | Products | Purpose |
|-------|----------|---------|
| Small | 1,000 | Baseline |
| Medium | 10,000 | Typical load |
| Large | 50,000 | High load |

---

## Metrics to Capture

| Metric | 1k | 10k | 50k |
|--------|-----|-----|-----|
| Duration (min) | _ | _ | _ |
| Memory peak (MB) | _ | _ | _ |
| Queue lag (sec) | _ | _ | _ |
| Error rate (%) | _ | _ | _ |
| Products saved | _ | _ | _ |

---

## Test Procedure

1. Start parser: `POST /parser/start` with limits (`products_per_category`, `max_pages`)
2. Monitor: `GET /parser/progress` (SSE)
3. Server: `top`, `redis-cli LLEN queues:default`, `supervisorctl status`
4. After completion: check `parser_jobs`, products count

---

## Memory Check

```bash
# During parse
watch -n 5 'ps aux | grep "queue:work" | awk "{print \$6}"'
```

---

## Queue Lag

```bash
# Jobs waiting
redis-cli LLEN queues:default
# If growing fast, workers may need scaling
```

---

## Scaling Recommendation

| Products/day | Workers (default) | Workers (photos) |
|--------------|-------------------|------------------|
| 100k | 2–4 | 1–2 |
| 300k | 4–8 | 2–4 |

---

## Verdict

- [ ] 1k products: no issues
- [ ] 10k products: acceptable
- [ ] 50k products: acceptable or bottlenecks identified

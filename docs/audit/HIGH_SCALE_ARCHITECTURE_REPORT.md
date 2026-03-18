# HIGH-SCALE ARCHITECTURE REPORT — Phase 10

**Target**: 100k–300k products/day  
**Date**: _Fill after evaluation_

---

## Current Capacity Estimate

| Factor | Current | Needed for 300k/day |
|--------|---------|---------------------|
| Workers (parse) | 2 | 4–8 |
| Workers (photos) | 1 | 2–4 |
| Categories in parallel | 1 (sequential) | Optional: N |
| Request delay | 400–800ms | May reduce if source allows |

---

## Architecture Options

### A. Scale Workers (Simplest)

- Increase `numprocs` in parser-worker.conf to 4–8
- Increase photos worker to 2
- Ensure Redis, MariaDB handle load

### B. Parallel Category Jobs

Create `ParallelCategoryParseJob`:
- Full parse dispatches one job per category (linked_to_parser)
- Each job parses one category
- Queue: `parse`
- Workers process multiple categories in parallel

### C. Queue Partitioning

| Queue | Purpose | Workers |
|-------|---------|---------|
| parse | RunParserJob, category jobs | 4–8 |
| photos | DownloadPhotosJob | 2–4 |
| maintenance | Cleanup, stats | 1 |

### D. Parser Parallelization

- Within one job: sequential (simpler, less blocking risk)
- Across jobs: parallel categories (scale horizontally)

---

## Recommendations

1. **Short-term**: Increase workers to 4 (parse) + 2 (photos)
2. **Medium-term**: Implement ParallelCategoryParseJob for full parse
3. **Monitor**: Queue lag, memory, error rate
4. **Throttling**: Keep request delay; add photo download throttling if needed

---

## Bottlenecks to Watch

- Source site rate limits
- MariaDB write throughput
- Redis memory
- Disk I/O (photos)
- PHP memory_limit

---

## Verdict

- [ ] Workers scaled for target
- [ ] Queue partitioning considered
- [ ] Parallel categories optional
- [ ] Monitoring in place

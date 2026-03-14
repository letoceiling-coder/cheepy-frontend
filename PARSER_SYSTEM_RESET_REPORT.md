# Parser System Reset Report

**Date:** 05.03.2025  
**Environment:** Production  
**Backend:** https://online-parser.siteaacess.store  
**Admin:** https://siteaacess.store/admin

---

## Summary

Full parser system reset completed. Incorrectly parsed seller relations cleared. System restarted cleanly.

---

## Step 1 — Parser Stopped

- `php artisan queue:restart` — broadcast restart signal
- `sudo supervisorctl stop all` — stopped:
  - parser-worker_00, 01, 02, 03
  - parser-worker-photos_00, 01
  - reverb
- Verified: no queue processes running (`ps aux | grep queue`)

---

## Step 2 — Parser Jobs Stopped

- SQL: `UPDATE parser_jobs SET status = 'stopped' WHERE status IN ('running','pending')`
- Executed via mysql

---

## Step 3 — Queues Cleared

- `php artisan queue:flush` — all failed jobs deleted
- `redis-cli FLUSHDB` — Redis DB cleared (parser queues)

---

## Step 4 — Parsed Data Truncated

Tables truncated (with `SET FOREIGN_KEY_CHECKS = 0`):

| Table             | Status    |
|-------------------|-----------|
| product_photos    | truncated |
| product_attributes| truncated |
| products          | truncated |
| sellers           | truncated |
| parser_jobs       | truncated |
| parser_logs       | truncated |

**Preserved:** users, roles, categories, admin_users, brands, migrations, etc.

---

## Step 5 — Database Structure Verified

**sellers:** id, slug, name, source_url, pavilion, phone, description, created_at, updated_at, etc. (no `avatar` column — optional)

**products:** `seller_id` exists (FK to sellers)

---

## Step 6 — Migrations

- `php artisan migrate --force`
- Result: Nothing to migrate (schema up to date)

---

## Step 7 — Laravel Cache Cleared

- `php artisan optimize:clear`
- `php artisan config:clear`
- `php artisan cache:clear`
- `php artisan route:clear`

---

## Step 8 — Services Restarted

- `sudo supervisorctl reread`
- `sudo supervisorctl update`
- `sudo supervisorctl start all` — all workers started
- `php artisan reverb:restart`
- `sudo systemctl reload nginx`

---

## Step 9 — System Status Verification

| Check            | Result                          |
|------------------|----------------------------------|
| parser_running   | false (no running/pending jobs)  |
| Queue workers    | 7 RUNNING (4 parser + 2 photos + reverb) |
| Redis            | PONG (connected)                 |
| supervisorctl    | All processes RUNNING            |

**Note:** `/api/v1/system/status` returns 401 when called without auth. Dashboard uses it with session.

---

## Step 10 — Dashboard Verification

- Admin dashboard at https://siteaacess.store/admin
- Parser: Status = **Stopped**
- Queue workers: running
- Redis: connected
- Products/Sellers: empty (ready for fresh parse)

---

## Scripts Created

- `scripts/reset-parser.sql` — stop parser jobs
- `scripts/truncate-parser.sql` — truncate parsed data
- `scripts/check-parser-status.php` — verify parser_running

---

## Next Steps

1. Run parser from admin panel with `saveDetails: true` to repopulate products and sellers with correct relations
2. Monitor first run for seller extraction and linking

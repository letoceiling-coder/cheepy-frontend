# DATABASE PERFORMANCE REPORT — Phase 7

**Database**: savadod_parser (MariaDB)  
**Date**: _Fill after audit_

---

## Tables to Verify

| Table | Purpose |
|-------|---------|
| products | Product catalog |
| categories | Category tree |
| sellers | Sellers |
| parser_jobs | Parser job tracking |
| parser_logs | Parser logs |
| product_photos | Product images |
| product_attributes | EAV attributes |

---

## Index Check (run on server)

```sql
SHOW INDEX FROM products;
SHOW INDEX FROM categories;
SHOW INDEX FROM sellers;
SHOW INDEX FROM parser_jobs;
SHOW INDEX FROM product_photos;
```

---

## Required Indexes

| Table | Column(s) | Type |
|-------|-----------|------|
| products | external_id | UNIQUE |
| products | category_id | INDEX |
| products | seller_id | INDEX |
| products | status | INDEX |
| categories | parent_id | INDEX |
| categories | slug | UNIQUE/INDEX |
| product_photos | product_id | INDEX |
| parser_jobs | status | INDEX |
| parser_jobs | created_at | INDEX |

---

## Duplicate Check

```sql
SELECT external_id, COUNT(*) AS cnt
FROM products
GROUP BY external_id
HAVING cnt > 1;
-- Expected: 0 rows
```

---

## Query Performance

```sql
EXPLAIN SELECT * FROM products WHERE external_id = 'xxx';
EXPLAIN SELECT * FROM products WHERE category_id = 1 LIMIT 100;
EXPLAIN SELECT * FROM products WHERE status = 'active' ORDER BY parsed_at DESC LIMIT 20;
```

---

## Table Sizes

```sql
SELECT
  table_name,
  ROUND(((data_length + index_length) / 1024 / 1024), 2) AS size_mb
FROM information_schema.tables
WHERE table_schema = 'sadavod_parser'
ORDER BY (data_length + index_length) DESC;
```

---

## Verdict

- [ ] Required indexes exist
- [ ] No duplicate external_id
- [ ] Queries use indexes
- [ ] Table sizes acceptable

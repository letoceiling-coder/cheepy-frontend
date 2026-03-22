-- Run on server: mysql ... < this file
SELECT donor_category_id, COUNT(1) AS cnt
FROM category_mapping
GROUP BY donor_category_id
HAVING COUNT(1) > 1;

SELECT id, donor_category_id, catalog_category_id, confidence, is_manual, updated_at
FROM category_mapping
ORDER BY updated_at DESC
LIMIT 10;

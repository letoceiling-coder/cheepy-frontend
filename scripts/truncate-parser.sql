-- Step 4: Truncate parsed data (order respects FK)
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE product_photos;
TRUNCATE product_attributes;
TRUNCATE products;
TRUNCATE sellers;
TRUNCATE parser_jobs;
TRUNCATE parser_logs;
SET FOREIGN_KEY_CHECKS = 1;

-- Step 2: Stop parser jobs
UPDATE parser_jobs SET status = 'stopped' WHERE status IN ('running','pending');

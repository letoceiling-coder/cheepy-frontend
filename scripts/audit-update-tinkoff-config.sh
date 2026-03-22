#!/bin/bash
mysql -u sadavod -pSadavodParser2025 sadavod_parser -e "
UPDATE payment_providers 
SET config = '{\"terminal_key\":\"Test\",\"password\":\"test_password\",\"currency\":\"rub\"}' 
WHERE name = 'tinkoff';
SELECT config FROM payment_providers WHERE name = 'tinkoff';
"

#!/bin/bash
# Run on server: add cron, verify
(crontab -l 2>/dev/null | grep -v "schedule:run"; echo '* * * * * cd /var/www/online-parser.siteaacess.store && php artisan schedule:run >> /dev/null 2>&1') | crontab -
crontab -l

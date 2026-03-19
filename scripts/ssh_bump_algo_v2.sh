#!/usr/bin/env bash
sed -i "s/public const ALGORITHM_VERSION = 'v1'/public const ALGORITHM_VERSION = 'v2'/" /var/www/online-parser.siteaacess.store/app/Services/Catalog/AutoMappingService.php
cd /var/www/online-parser.siteaacess.store && php artisan catalog:auto-map-categories --sync 2>&1
sed -i "s/public const ALGORITHM_VERSION = 'v2'/public const ALGORITHM_VERSION = 'v1'/" /var/www/online-parser.siteaacess.store/app/Services/Catalog/AutoMappingService.php
grep ALGORITHM_VERSION /var/www/online-parser.siteaacess.store/app/Services/Catalog/AutoMappingService.php | head -1

#!/usr/bin/env bash
set -eu
cd /var/www/online-parser.siteaacess.store
php artisan tinker --execute='dump(class_exists("Tymon\\JWTAuth\\Facades\\JWTAuth"));'

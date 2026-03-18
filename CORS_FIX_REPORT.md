# CORS Fix Report

**Date:** 2026-03-05  
**Server:** root@85.117.235.93  
**Backend:** /var/www/online-parser.siteaacess.store  

---

## Issue

`Access-Control-Allow-Origin` returned `http://cheepy.loc` while the frontend runs on `https://siteaacess.store`.

**Root cause:** `CorsMiddleware` uses `env('FRONTEND_URL', 'http://cheepy.loc')` and `.env` had no `FRONTEND_URL` set.

---

## Fixes Applied

### 1. config/cors.php

```php
'allowed_origins' => ['https://siteaacess.store', 'http://cheepy.loc'],
```

### 2. .env

```
FRONTEND_URL=https://siteaacess.store,http://cheepy.loc
SANCTUM_STATEFUL_DOMAINS=siteaacess.store
```

### 3. Laravel Cache

```
php artisan config:clear
php artisan cache:clear
php artisan route:clear
php artisan optimize:clear
```

### 4. Workers & Nginx

```
supervisorctl restart all
systemctl reload nginx
```

---

## Verification

**OPTIONS preflight** (Origin: https://siteaacess.store):

```
Access-Control-Allow-Origin: https://siteaacess.store
Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
Access-Control-Allow-Headers: Authorization, Content-Type, X-Requested-With, Accept
Access-Control-Allow-Credentials: true
Access-Control-Max-Age: 86400
```

**GET /api/v1/up** (Origin: https://siteaacess.store):

```
Access-Control-Allow-Origin: https://siteaacess.store
Access-Control-Allow-Credentials: true
```

---

## Result

CORS is fixed. Requests from `https://siteaacess.store` receive `Access-Control-Allow-Origin: https://siteaacess.store`.

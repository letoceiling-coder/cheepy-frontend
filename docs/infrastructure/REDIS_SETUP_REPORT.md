# REDIS SETUP REPORT

**Date**: _Fill after setup_  
**Server**: Ubuntu 24.04 VPS

---

## 1. Installation

```bash
sudo apt-get update
sudo apt-get install -y redis-server
sudo systemctl enable redis-server
sudo systemctl start redis-server
```

---

## 2. Verification

```bash
redis-cli ping
# Expected: PONG

redis-cli info server
```

| Check | Result |
|-------|--------|
| redis-cli ping | PONG |
| redis-server running | systemctl status redis-server |

---

## 3. Laravel .env Updates

Add or update in `/var/www/online-parser.siteaacess.store/.env`:

```env
QUEUE_CONNECTION=redis
CACHE_DRIVER=redis
SESSION_DRIVER=redis

REDIS_HOST=127.0.0.1
REDIS_PASSWORD=null
REDIS_PORT=6379
```

---

## 4. PHP Redis Extension

```bash
# Check if php-redis is installed
php -m | grep redis

# If not:
sudo apt-get install php8.2-redis
sudo systemctl restart php8.2-fpm
```

---

## 5. Laravel Redis Test

```bash
cd /var/www/online-parser.siteaacess.store
php artisan tinker

# In tinker:
>>> Cache::store('redis')->put('test', 'ok', 10);
>>> Cache::store('redis')->get('test');
=> "ok"
>>> Queue::connection('redis')->size('default');
=> 0
```

---

## 6. Config Verify

```bash
php artisan config:cache
php artisan config:clear
```

---

## Completion Checklist

- [ ] Redis server installed and running
- [ ] redis-cli ping returns PONG
- [ ] php-redis extension installed
- [ ] .env updated (QUEUE_CONNECTION, CACHE_DRIVER, SESSION_DRIVER)
- [ ] Laravel connects to Redis (tinker test)

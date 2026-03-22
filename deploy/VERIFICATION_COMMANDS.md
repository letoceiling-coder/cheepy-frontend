# Final Deploy Verification (Real Server)

## Prerequisites

1. **Push to remote** (if not done):
   ```bash
   git push origin main
   ```

2. **Symlink script** (first time, один источник):
   ```bash
   ssh root@85.117.235.93 "ln -sf /var/www/siteaacess.store/deploy/deploy-cheepy.sh /var/www/deploy-cheepy.sh && chmod +x /var/www/deploy-cheepy.sh"
   ```

---

## STEP 1 & 2 — Script exists & permissions

```bash
ssh root@85.117.235.93 "ls -la /var/www/deploy-cheepy.sh"
```

**Expected:** `-rwxr-xr-x` (executable)

---

## STEP 3 — Run full deploy

```bash
ssh root@85.117.235.93 "bash /var/www/deploy-cheepy.sh"
```

**Expected:** Full output with git pull, migrate, build, HTTP 200

---

## STEP 4 — Build files

```bash
ssh root@85.117.235.93 "ls -la /var/www/siteaacess.store/dist/assets | tail -n 5"
```

---

## STEP 5 — API health

```bash
curl -i https://online-parser.siteaacess.store/api/v1/health
```

**Expected:** `HTTP/2 200`

---

## STEP 6 — Frontend

```bash
curl -i https://siteaacess.store
```

**Expected:** `HTTP/2 200`

---

## STEP 7 — Queue workers

```bash
ssh root@85.117.235.93 "ps aux | grep queue | grep -v grep"
```

---

## CRM API — payment-providers

```bash
# С валидным JWT (после логина в /admin/login):
curl -i https://online-parser.siteaacess.store/api/v1/crm/payment-providers \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Ожидаемо:** `200 OK`, JSON-массив: `[{"name":"tinkoff","title":"Т-Банк",...},{"name":"sber",...},{"name":"atol",...}]`

Без токена или с неверным: `401 Unauthorized` (маршрут существует, middleware работает).

---

## All-in-one (run from server)

```bash
ssh root@85.117.235.93 "cd /var/www/siteaacess.store && git pull origin main && bash /var/www/deploy-cheepy.sh"
```

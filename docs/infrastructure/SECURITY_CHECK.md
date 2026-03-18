# SECURITY CHECK

---

## 1. JWT Authentication

- [ ] All admin endpoints require `Authorization: Bearer {token}`
- [ ] Login returns JWT with expiry
- [ ] 401 on invalid/expired token
- [ ] CORS allows `https://siteaacess.store`

---

## 2. CORS Configuration

```php
// config/cors.php or middleware
'allowed_origins' => [env('FRONTEND_URL', 'https://siteaacess.store')],
'allowed_methods' => ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
'allowed_headers' => ['Authorization', 'Content-Type'],
```

---

## 3. Rate Limiting

Add ThrottleRequests middleware to API routes:

```php
// routes/api.php or api/v1.php
Route::middleware(['throttle:60,1'])->group(function () {
    // API routes
});
```

- 60 requests per minute per IP (adjust as needed)
- Login endpoint: `throttle:5,1` (5 attempts per minute)

---

## 4. Health Endpoint

- `/health` can be public for monitoring (no sensitive data)
- `/system/status` — protect with auth (exposes queue/memory info)

---

## 5. Environment

- [ ] .env not in web root
- [ ] APP_DEBUG=false in production
- [ ] APP_KEY set
- [ ] DB credentials secure

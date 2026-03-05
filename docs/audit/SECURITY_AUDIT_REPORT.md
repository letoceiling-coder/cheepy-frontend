# SECURITY AUDIT REPORT — Phase 11

**Date**: _Fill after audit_

---

## 1. JWT Authentication

| Check | Result |
|-------|--------|
| Login returns JWT | _ |
| Token in Authorization header | _ |
| 401 on invalid token | _ |
| 401 on expired token | _ |
| Token refresh endpoint | _ |

---

## 2. CORS

| Check | Result |
|-------|--------|
| FRONTEND_URL in .env | _ |
| Allowed origin: siteaacess.store | _ |
| Allowed methods | GET, POST, PUT, PATCH, DELETE |
| Allowed headers | Authorization, Content-Type |

---

## 3. Rate Limiting

| Endpoint | Limit | Status |
|----------|-------|--------|
| /auth/login | 5/min | _ |
| API (general) | 60/min | _ |

---

## 4. Brute-Force Protection

```bash
# Test: 6 rapid login attempts with wrong password
for i in {1..6}; do
  curl -s -X POST https://online-parser.siteaacess.store/api/v1/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@test.com","password":"wrong"}' | jq .message
done
# Expected: 429 after 5 attempts
```

---

## 5. .env Protection

| Check | Result |
|-------|--------|
| .env not in web root | OK |
| .env not served by nginx | OK |
| APP_DEBUG=false (prod) | _ |
| APP_KEY set | _ |

---

## Verdict

- [ ] JWT auth working
- [ ] CORS configured
- [ ] Rate limiting active
- [ ] Brute-force protection on login

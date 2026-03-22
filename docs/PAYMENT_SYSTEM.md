# Payment System

## 1. Providers

| Provider | Описание | Статус |
|----------|----------|--------|
| **Tinkoff** | Т-Банк (ex Tinkoff) | Production |
| **Sber** | СберБанк Эквайринг | Integration ready (no credentials) |
| **ATOL** | Фискализация чеков | Integration ready (no credentials) |
| **Stripe** | Международные платежи | API готов, UI в разработке |

### Tinkoff
- Terminal Key + Password
- Webhook: `POST /api/v1/webhook/tinkoff`
- Token SHA256, amount check, idempotency по `provider_event_id`

### Sber
- userName + password
- Webhook: `POST /api/v1/webhook/sber`
- Callback → `getOrderStatus.do` (единственно правильная реализация)
- Mapping статусов 0–4 → succeeded/failed

### ATOL
- login, password, group_code
- Асинхронно через queue (`atol`)
- `afterCommit` → `SendAtolReceiptJob::dispatch()`
- Retry 3x, backoff 60s

---

## 2. Flow

```
1. create payment     → INSERT payments (status=pending)
2. checkout           → Tinkoff Init / Sber register → redirect URL
3. user pays          → банк
4. webhook            → POST /api/v1/webhook/{provider}
5. validate           → token, amount, status mapping
6. balance update     → saas_api_keys.balance += amount
7. payment update     → status=succeeded, provider_event_id
8. fiscalization      → dispatch SendAtolReceiptJob (after commit)
9. atol done          → atol_uuid, atol_status=done
```

### Idempotency
- `provider_event_id` = уникальный ключ (PaymentId_Status для Tinkoff)
- Дубликат webhook → НЕ увеличивает баланс
- Unique index на (provider, provider_event_id) где применимо

---

## 3. Security

| Механизм | Описание |
|----------|----------|
| **return_token** | UUID в URL success/fail, обязателен для `GET /payments/{id}` |
| **No public access** | Status endpoint только с token |
| **Webhook OK** | Webhook всегда возвращает 200 OK (предотвращение probing) |
| **Token validation** | Tinkoff SHA256, Sber signature |
| **Amount check** | Строгое сравнение incoming vs expected |
| **JWT для CRM** | `/crm/*` требует Bearer token |

---

## 4. Deploy

```bash
bash /var/www/deploy-cheepy.sh
```

Скрипт: Backend (git pull, composer, migrate, queue restart) + Frontend (npm build) + nginx reload + health check.

Установка (один раз):
```bash
cp /var/www/siteaacess.store/deploy/deploy-cheepy.sh /var/www/deploy-cheepy.sh
chmod +x /var/www/deploy-cheepy.sh
```

---

## 5. Проверки

### Tinkoff webhook (fake data)
```bash
curl -X POST https://online-parser.siteaacess.store/api/v1/webhook/tinkoff -d 'FAKE DATA'
# → OK (ничего не меняется)
```

### CRM API
```bash
curl -s https://online-parser.siteaacess.store/api/v1/crm/payment-providers \
  -H "Authorization: Bearer REAL_TOKEN"
# → 200 OK, [tinkoff, sber, atol, stripe]
```

### Webhook logs
```sql
SELECT id, provider, provider_event_id, status, error, created_at
FROM payment_webhook_logs ORDER BY id DESC LIMIT 5;
```

### ATOL
```sql
SELECT id, atol_status, atol_uuid FROM payments
WHERE status='succeeded' ORDER BY id DESC LIMIT 5;
```
(atol_uuid NOT NULL = чек пробит)

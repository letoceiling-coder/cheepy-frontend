# DevOps Guide — Cheepy Production

Руководство по deploy, rollback, мониторингу и логам.

---

## 1. ДЕПЛОЙ

### 1.1 Локально (рекомендуемый способ)

```bash
# 1. Закоммитить и запушить изменения
git add .
git commit -m "..."
git push origin main

# 2. Запустить deploy на сервере (git pull + build на сервере)
node scripts/deploy-remote.cjs
```

**Требования:**
- SSH-доступ к серверу (root@85.117.235.93)
- В `.env.deploy`: `DEPLOY_SSH=root@85.117.235.93`

### 1.2 Прямо на сервере

```bash
ssh root@85.117.235.93

# Обновить скрипты из репозитория (один раз после изменений)
cd /var/www/siteaacess.store && git pull
cp scripts/deploy.sh scripts/rollback.sh /var/www/
chmod +x /var/www/deploy.sh /var/www/rollback.sh

# Deploy
bash /var/www/deploy.sh           # backend + frontend
bash /var/www/deploy.sh frontend  # только frontend
bash /var/www/deploy.sh backend   # только backend
```

### 1.3 CI/CD (GitHub Actions)

При push в `main`:
- **cheepy-frontend** → workflow `deploy-frontend` (деплой frontend)
- **cheepy-backend** → workflow `deploy-backend` (деплой backend)

**Секреты в GitHub:**
- `SERVER_HOST` — 85.117.235.93
- `SSH_PRIVATE_KEY` — приватный SSH-ключ

### 1.4 Устаревший SCP deploy

```bash
npm run deploy:scp   # Локальный build + SCP dist на сервер
```

Использовать только в крайних случаях. Основной способ — git + build на сервере.

---

## 2. ROLLBACK

### 2.1 Frontend

```bash
ssh root@85.117.235.93 "bash /var/www/rollback.sh frontend"
```

Восстанавливается последний backup `dist` (до 5 backup'ов).

### 2.2 Backend

```bash
ssh root@85.117.235.93 "bash /var/www/rollback.sh backend"
```

**Внимание:** Откат на предыдущий коммит + одна миграция. Проверить совместимость миграций.

---

## 3. ЛОГИ

| Что | Где |
|-----|-----|
| Deploy | `/var/log/cheepy/deploy.log` |
| Rollback | `/var/log/cheepy/rollback.log` |
| Health check | `/var/log/cheepy/health.log` |
| Nginx | `/var/log/nginx/access.log`, `error.log` |
| Laravel | `storage/logs/laravel.log` |
| Queue workers | `storage/logs/worker.log` (в backend) |
| Supervisor | `/var/log/supervisor/` |

### Просмотр логов deploy

```bash
ssh root@85.117.235.93 "tail -100 /var/log/cheepy/deploy.log"
```

---

## 4. МОНИТОРИНГ

### 4.1 Ручная проверка

```bash
bash scripts/health-check.sh
# Exit 0 = OK, 1 = FAIL
```

### 4.2 Автоматический мониторинг (cron)

На сервере:

```bash
# Добавить в crontab -e
*/5 * * * * /var/www/siteaacess.store/scripts/monitor.sh
```

### 4.3 Endpoints

| URL | Назначение |
|-----|------------|
| https://siteaacess.store | Frontend |
| https://online-parser.siteaacess.store/api/v1/up | API health |
| https://online-parser.siteaacess.store/api/v1/ws-status | Redis, WebSocket |

---

## 5. СТАТУС СИСТЕМЫ

```bash
# Supervisor (queue workers, reverb)
supervisorctl status

# Nginx
systemctl status nginx

# Логи
tail -f /var/log/cheepy/deploy.log
tail -f /var/www/online-parser.siteaacess.store/storage/logs/laravel.log
```

---

## 6. SECURITY CHECKLIST

- [ ] SSH: key-based auth
- [ ] `.env` не в git
- [ ] `JWT_SECRET` >= 32 символов
- [ ] Redis: bind 127.0.0.1
- [ ] CORS: только siteaacess.store
- [ ] GitHub Secrets: не логировать

---

## 7. УСТРАНЕНИЕ ПРОБЛЕМ

### Deploy завершился с ошибкой

1. Проверить `/var/log/cheepy/deploy.log`
2. `bash /var/www/rollback.sh frontend` (если упал frontend)
3. Проверить `supervisorctl status`, `systemctl status nginx`

### Site недоступен

1. `curl -I https://siteaacess.store`
2. `curl -I https://online-parser.siteaacess.store/api/v1/up`
3. Проверить nginx: `nginx -t`
4. Проверить disk: `df -h`

### Build frontend failed

1. На сервере: `cd /var/www/siteaacess.store && npm run build`
2. Проверить `node -v` (нужна 18+), `npm -v`
3. Rollback: `bash /var/www/rollback.sh frontend`

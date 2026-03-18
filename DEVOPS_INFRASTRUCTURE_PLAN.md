# DevOps Infrastructure Plan

**Версия:** 1.0  
**Дата:** 14.03.2026  
**Статус:** План (реализация по этапам)

---

## ЭТАП 1 — РЕЗУЛЬТАТЫ АНАЛИЗА

### 1.1 Git статус

| Репозиторий | Ветка | Коммитов впереди | Не закоммичено | Состояние |
|-------------|-------|------------------|----------------|-----------|
| Frontend (cheepy) | main | 0 | ~314 файлов | Много локальных изменений |
| Backend (sadavod-laravel) | main | 1 | ~59 файлов | Есть unpushed commit |

**Вывод:** Перед production-deploy необходимо закоммитить и запушить изменения. Backend имеет 1 локальный коммит не в origin.

### 1.2 Deploy скрипты

**scripts/deploy.cjs (SCP):**
- Собирает `dist/` локально
- Копирует на сервер через `scp -r dist/* $DEPLOY_TARGET/dist/`
- Не использует git на сервере
- Риск: dist на сервере может не совпадать с git; при следующем deploy.sh будет пересобран из git

**deploy.sh (на сервере /var/www/deploy.sh):**
- Backend: `git fetch && reset --hard origin/main` → composer → migrate → cache → queue:restart
- Frontend: `git fetch && reset --hard origin/main` → npm install → npm run build
- Услуги: `supervisorctl restart all`, `systemctl reload nginx`
- Не создаёт backup
- Не проверяет health до/после

### 1.3 Nginx

| Сайт | Root | SSL |
|------|------|-----|
| siteaacess.store | /var/www/siteaacess.store/dist | Let's Encrypt |
| online-parser.siteaacess.store | /var/www/online-parser.siteaacess.store/public | Let's Encrypt |

**Важно:** frontend nginx root = `.../dist` — build должен попадать в dist.

### 1.4 Supervisor

- `parser-worker` (2 процесса)
- `parser-worker-default`
- `parser-worker-photos` (6 процессов)
- `reverb`

Логи: `storage/logs/worker.log` (Laravel), `/var/log/supervisor/`

### 1.5 Systemd

- nginx, php8.2-fpm, redis-server, supervisor — активны

### 1.6 Директории на сервере

```
/var/www/siteaacess.store/          # Frontend repo + dist/
/var/www/siteaacess.store/dist/     # SPA build (nginx root)
/var/www/online-parser.siteaacess.store/  # Backend
/var/log/nginx/                     # Nginx
/var/log/supervisor/                # Supervisor
storage/logs/ (Laravel)             # Laravel logs
```

### 1.7 Безопасность изменений

| Действие | Безопасность |
|----------|--------------|
| Добавить backup перед deploy | ✅ Безопасно |
| Добавить health-check после deploy | ✅ Безопасно |
| Добавить rollback команду | ✅ Безопасно |
| Удалить SCP deploy, оставить deploy.sh | ⚠️ Требует синхронизации git; локальные незакоммиченные сборки перестанут деплоиться |
| Менять nginx конфиги | ⚠️ Тестировать `nginx -t` перед reload |
| Менять supervisor конфиги | ⚠️ Тестировать перед update |
| Создавать /var/log/cheepy | ✅ Безопасно |
| Добавить GitHub Actions | ✅ Безопасно (CI не трогает прод без merge) |

### 1.8 Опасные действия

- `git reset --hard` без backup — потеря локальных изменений на сервере
- `migrate --force` без проверки — риск сломать БД
- `supervisorctl restart all` без проверки конфигов — риск остановить воркеры
- Перезапись .env на сервере — потеря секретов

---

## 2. АРХИТЕКТУРА DEPLOY

### 2.1 Целевой поток (единый)

```
Developer                    GitHub                    Server
    |                          |                          |
    |  git push main           |                          |
    |------------------------->|                          |
    |                          |  webhook / manual        |
    |                          |  trigger deploy          |
    |                          |------------------------->|
    |                          |                          | git pull
    |                          |                          | backup current
    |                          |                          | build / install
    |                          |                          | health-check
    |                          |                          | rollback on fail
```

### 2.2 Frontend deploy (стандартизированный)

1. `cd /var/www/siteaacess.store`
2. Backup: `cp -r dist dist.backup.$(date +%Y%m%d_%H%M%S)`
3. `git fetch origin && git reset --hard origin/main`
4. `npm ci` (детерминированная установка)
5. `npm run build`
6. Health-check: curl https://siteaacess.store
7. При ошибке: restore из backup

### 2.3 Backend deploy

1. `cd /var/www/online-parser.siteaacess.store`
2. Backup: `cp -r . ../online-parser.siteaacess.store.backup.$(date +%Y%m%d_%H%M%S)` (или только storage + .env)
3. `git fetch origin && git reset --hard origin/main`
4. `composer install --no-dev --optimize-autoloader`
5. `php artisan migrate --force` (с проверкой: `migrate:status`)
6. Cache clear, config:cache
7. `php artisan queue:restart`
8. Health-check: curl https://online-parser.siteaacess.store/api/v1/up
9. При ошибке: restore, supervisorctl restart

---

## 3. CI/CD PIPELINE

### 3.1 GitHub Actions — Frontend

```yaml
# .github/workflows/deploy-frontend.yml
on:
  push:
    branches: [main]
    paths:  # Только при изменениях в frontend-репо
      - 'src/**'
      - 'public/**'
      - 'package.json'
      - 'vite.config.ts'
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run build
      - name: Deploy via SSH
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: root
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /var/www/siteaacess.store
            ./scripts/deploy-frontend.sh
```

### 3.2 GitHub Actions — Backend

```yaml
# .github/workflows/deploy-backend.yml (в репо cheepy-backend)
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy via SSH
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: root
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: bash /var/www/deploy.sh backend
```

### 3.3 Секреты (GitHub Secrets)

- `SERVER_HOST`: 85.117.235.93
- `SSH_PRIVATE_KEY`: приватный ключ для root (или deploy-пользователя)

---

## 4. ROLLBACK МЕХАНИЗМ

### 4.1 Backup структура

```
/var/www/siteaacess.store/dist.backup.YYYYMMDD_HHMMSS/
/var/www/online-parser.siteaacess.store.backup.YYYYMMDD_HHMMSS/  (опционально, или только dist/backend)
```

Хранить: последние 5 backup'ов (остальные удалять).

### 4.2 Rollback команда

```bash
# deploy rollback [frontend|backend]
deploy-rollback.sh frontend   # восстанавливает dist из последнего backup
deploy-rollback.sh backend    # git checkout предыдущий коммит + composer + migrate:rollback (осторожно)
```

Для frontend rollback — копирование `dist.backup.LATEST` → `dist`.  
Для backend — откат на предыдущий git commit + повтор install/migrate (с миграциями нужно быть осторожнее).

---

## 5. MONITORING

### 5.1 Health endpoints

| Endpoint | Проверка |
|----------|----------|
| https://siteaacess.store | Frontend доступен (HTTP 200) |
| https://online-parser.siteaacess.store/api/v1/up | API доступен |
| https://online-parser.siteaacess.store/api/v1/ws-status | Redis, WebSocket, очередь |

### 5.2 Простой monitoring script

```bash
#!/bin/bash
# scripts/health-check.sh
FRONTEND=$(curl -s -o /dev/null -w "%{http_code}" https://siteaacess.store)
API=$(curl -s -o /dev/null -w "%{http_code}" https://online-parser.siteaacess.store/api/v1/up)
echo "Frontend: $FRONTEND, API: $API"
[ "$FRONTEND" = "200" ] && [ "$API" = "200" ] || exit 1
```

### 5.3 Расширенный (опционально)

- UptimeRobot / BetterUptime — внешний мониторинг
- Laravel Telescope (dev/staging) — отладка
- Prometheus + Grafana — при росте нагрузки

---

## 6. LOGGING

### 6.1 Централизованная папка

```
/var/log/cheepy/
  frontend-deploy.log
  backend-deploy.log
  health-check.log
```

### 6.2 Существующие логи

| Компонент | Путь |
|-----------|------|
| Nginx | /var/log/nginx/access.log, error.log |
| Laravel | storage/logs/laravel.log |
| Supervisor | /var/log/supervisor/ |
| Queue workers | storage/logs/worker.log |

### 6.3 Cron для monitoring

```bash
# Добавить на сервере: crontab -e
*/5 * * * * /var/www/siteaacess.store/scripts/monitor.sh
```

### 6.4 Рекомендация

- Добавить ротацию (logrotate) для /var/log/cheepy/
- Писать в deploy-скрипты: `tee -a /var/log/cheepy/frontend-deploy.log`

---

## 7. SAFE DEPLOY ПРОВЕРКИ

Перед deploy:

1. **Git:** на сервере `git status` — нет критичных local changes (или их учёт)
2. **Build:** `npm run build` / `composer install` — exit 0
3. **Env:** `.env` существует, JWT_SECRET >= 32 символов
4. **Server:** SSH доступен, диск не заполнен
5. **Pre-deploy health:** API и frontend отвечают 200

После deploy:

1. **Post-deploy health:** те же проверки
2. При fail — автоматический rollback

---

## 8. SECURITY CHECKLIST

- [ ] SSH: key-based auth, отключить пароль
- [ ] .env не в git
- [ ] JWT_SECRET уникальный, >= 32 символов
- [ ] Redis: bind 127.0.0.1 (не наружу)
- [ ] MySQL: ограничить доступ по IP
- [ ] CORS: только нужные origins
- [ ] Nginx: скрыть версии, limit rate при необходимости

---

## 9. ПОРЯДОК РЕАЛИЗАЦИИ

| # | Этап | Риск | Описание |
|---|------|------|----------|
| 1 | Backup в deploy.sh | Низкий | Добавить backup dist перед frontend build |
| 2 | Rollback script | Низкий | deploy-rollback.sh для frontend |
| 3 | Health-check в deploy | Низкий | curl после deploy, exit 1 при fail |
| 4 | Логи deploy | Низкий | /var/log/cheepy/, tee в скрипты |
| 5 | Разделить deploy.sh | Средний | backend и frontend — отдельные скрипты или флаги |
| 6 | Убрать SCP, оставить git deploy | Средний | После синхронизации git |
| 7 | GitHub Actions | Средний | Secrets, тестовый прогон на отдельной ветке |
| 8 | Monitoring cron | Низкий | Периодический health-check + alert |

---

## 10. ФАЙЛЫ ДЛЯ СОЗДАНИЯ/ИЗМЕНЕНИЯ

- `scripts/deploy-server.sh` — улучшенный deploy (backend + frontend) с backup, health-check
- `scripts/deploy-frontend.sh` — только frontend (для CI/CD)
- `scripts/deploy-backend.sh` — только backend (или вызов из deploy.sh с флагом)
- `scripts/rollback.sh` — rollback frontend/backend
- `scripts/health-check.sh` — проверка endpoints
- `.github/workflows/deploy-frontend.yml` — CI frontend
- `.github/workflows/deploy-backend.yml` — CI backend (в репо backend)
- `DEVOPS_GUIDE.md` — инструкция для команды

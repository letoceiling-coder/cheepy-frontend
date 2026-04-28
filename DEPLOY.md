# Деплой: Frontend + Backend

## Окружение

| Параметр | Значение |
|---|---|
| Сервер | `85.117.235.93` |
| SSH | `ssh root@85.117.235.93` |
| PHP | 8.2 |
| Node | 20.x |
| npm | 10.x |
| Composer | 2.x |

---

## Репозитории

| Роль | Локальный путь | GitHub | Ветка |
|---|---|---|---|
| **Frontend** | `C:\OSPanel\domains\cheepy` | `letoceiling-coder/cheepy-frontend` | `main` |
| **Backend** | `C:\OSPanel\domains\sadavod-laravel` | `letoceiling-coder/cheepy-backend` | `main` |

---

## Директории на сервере

| Роль | Путь на сервере | Домен |
|---|---|---|
| **Frontend** | `/var/www/siteaacess.store` | `https://siteaacess.store` |
| **Backend** | `/var/www/online-parser.siteaacess.store` | `https://online-parser.siteaacess.store` |
| **AI-агент** | `/var/www/agent-api` (PM2: `agent-api`) | `https://agent.siteaacess.store` |
| **Медиа** | `/var/www/photos.siteaacess.store` | `https://photos.siteaacess.store` |

---

## Быстрый деплой (оба проекта сразу)

```bash
# Подключиться к серверу
ssh root@85.117.235.93

# Запустить деплой фронта + бека
bash /var/www/deploy-cheepy.sh
```

Скрипт последовательно:
1. Делает `git pull` в обоих репозиториях
2. Собирает фронт (`npm install` + `npm run build`)
3. Обновляет бэкенд (`composer install`, миграции, кэш)
4. Перезагружает nginx
5. Проверяет доступность обоих сайтов (health check)

---

## Деплой по частям

### Только frontend

```bash
ssh root@85.117.235.93 "bash /var/www/deploy.sh frontend"
```

Что происходит:
1. `git fetch && git reset --hard origin/main` — синхронизация с GitHub
2. `npm ci && npm run build` — сборка React-приложения
3. Проверка `dist/index.html` — если нет, откат из резервной копии
4. `systemctl reload nginx`

### Только backend

```bash
ssh root@85.117.235.93 "bash /var/www/deploy.sh backend"
```

Что происходит:
1. `git fetch && git reset --hard origin/main`
2. `composer install --no-dev --optimize-autoloader`
3. `php artisan migrate --force`
4. `php artisan optimize:clear` + `config:cache` + `queue:restart`
5. `chown www-data` на `storage/` и `bootstrap/cache/`
6. `supervisorctl restart all` (воркеры очередей)

---

## Рабочий процесс (workflow)

```
Локально (Windows)                    Сервер
─────────────────────                 ──────────────────
1. Правки в коде
2. git add . && git commit -m "..."
3. git push origin main          →    GitHub
                                       ↓
4. ssh root@85.117.235.93
5. bash /var/www/deploy-cheepy.sh  ←  git pull + build
```

---

## Переменные окружения

### Frontend — `/var/www/siteaacess.store/.env`

```env
VITE_API_URL=https://online-parser.siteaacess.store/api/v1
VITE_REVERB_HOST=online-parser.siteaacess.store
VITE_REVERB_PORT=443
VITE_REVERB_SCHEME=https
VITE_REVERB_APP_KEY=parser-key
```

> Файл `.env` на сервере не перезаписывается при деплое (`git reset --hard` игнорирует untracked).

### Backend — `/var/www/online-parser.siteaacess.store/.env`

Ключевые переменные (значения — на сервере):

```env
APP_URL=https://online-parser.siteaacess.store
DB_CONNECTION=mysql
DB_HOST=...
DB_DATABASE=...
DB_USERNAME=...
DB_PASSWORD=...
QUEUE_CONNECTION=redis
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
JWT_SECRET=...
SITE_AL_BASE_URL=http://127.0.0.1:4001
SITE_AL_API_KEY=...
SITE_AL_AGENT_ID=...
BROADCAST_CONNECTION=reverb
```

> Никогда не коммитить `.env` в Git.

---

## Сервисы на сервере

### Supervisor (очереди Laravel)

```bash
# Статус
supervisorctl status

# Перезапуск всех воркеров
supervisorctl restart all
```

Запущенные процессы:
- `parser-worker` (×4) — основные очереди
- `parser-worker-default` — очередь по умолчанию
- `parser-worker-photos` (×2) — обработка фото
- `reverb` — Laravel WebSocket-сервер

### PM2 (Node.js)

```bash
# Статус
pm2 list

# Перезапуск AI-агента
pm2 restart agent-api

# Логи
pm2 logs agent-api --lines 50
```

Процессы:
- `agent-api` (id=5) — AI-агент на порту 4001

### Nginx

```bash
# Проверка конфига
nginx -t

# Перезагрузка (без даунтайма)
systemctl reload nginx

# Активные vhosts
ls /etc/nginx/sites-enabled/
```

Активные vhosts:
- `siteaacess.store` — frontend + `api.siteaacess.store` + `photos.siteaacess.store`
- `online-parser.siteaacess.store` — backend Laravel
- `agent.siteaccess.store` — AI-агент (proxy → 4001)
- `cdn.siteaacess.ru` — CDN статика

---

## Откат (Rollback)

### Откат frontend (последний успешный dist)

```bash
ssh root@85.117.235.93 "bash /var/www/rollback.sh frontend"
```

### Откат backend (предыдущий git-коммит)

```bash
ssh root@85.117.235.93 "bash /var/www/rollback.sh backend"
```

Логи откатов: `/var/log/cheepy/rollback.log`

---

## Health check (ручная проверка)

```bash
# Frontend
curl -sS -o /dev/null -w "%{http_code}" https://siteaacess.store

# Backend API
curl -sS -o /dev/null -w "%{http_code}" https://online-parser.siteaacess.store/api/v1/health

# AI-агент (прямой)
curl -sS -o /dev/null -w "%{http_code}" http://127.0.0.1:4001/

# Логи деплоя
tail -f /var/log/cheepy/deploy.log
```

---

## Диагностика

### Логи

```bash
# Laravel (ошибки приложения)
tail -n 100 /var/www/online-parser.siteaacess.store/storage/logs/laravel.log

# Nginx (ошибки проксирования)
tail -n 50 /var/log/nginx/error.log

# PM2 (AI-агент)
pm2 logs agent-api --lines 100

# Supervisor (воркеры)
tail -n 50 /var/log/supervisor/supervisord.log
```

### Частые проблемы

| Симптом | Причина | Решение |
|---|---|---|
| Frontend не обновился | `dist/` не пересобран | `cd /var/www/siteaacess.store && npm run build` |
| 500 на API | Нет прав на `storage/` | `chown -R www-data:www-data storage bootstrap/cache` |
| Очереди не работают | Воркеры упали | `supervisorctl restart all` |
| AI-генерация не работает | `agent-api` упал | `pm2 restart agent-api` |
| 504 на AI-запросах | Ollama медленно отвечает | Нормально для CPU, таймаут 180s в nginx |
| Конфиг не применился | Laravel кэш | `php artisan config:clear && php artisan cache:clear` |

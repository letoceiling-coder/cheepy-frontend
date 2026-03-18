# PROJECT INFRASTRUCTURE AUDIT

**Дата аудита:** 11.03.2026  
**Тип:** Только анализ (без изменений кода, без деплоя, без удаления)

---

## 1. АРХИТЕКТУРА ПРОЕКТА

### Общая схема

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           КЛИЕНТ (браузер)                                   │
└─────────────────────────────────────────────────────────────────────────────┘
                    │                                    │
                    │ HTTPS                              │ HTTPS + WSS
                    ▼                                    ▼
┌───────────────────────────────┐      ┌───────────────────────────────────────┐
│  siteaacess.store             │      │  online-parser.siteaacess.store       │
│  (Frontend SPA)               │      │  (Backend API + Reverb WebSocket)     │
│  Nginx → /var/www/.../dist    │      │  Nginx → Laravel public + /app proxy  │
└───────────────────────────────┘      └───────────────────────────────────────┘
                    │                                    │
                    │ VITE_API_URL                       │ PHP 8.2, MySQL, Redis
                    │ /api/v1/*                          │ Queue workers, Reverb
                    └────────────────────────────────────┘
```

- **Frontend:** React SPA (Vite + TypeScript), деплоится в `dist/`
- **Backend:** Laravel 12, API под `/api/v1/`, парсер, админка, WebSocket (Reverb)
- **Связь:** Frontend вызывает `https://online-parser.siteaacess.store/api/v1` (JWT для админки)

---

## 2. СТРУКТУРА ДИРЕКТОРИЙ

### Локально

| Путь | Назначение | Репозиторий |
|------|------------|-------------|
| `C:\OSPanel\domains\cheepy` | Frontend | cheepy-frontend |
| `C:\OSPanel\domains\sadavod-laravel` | Backend | cheepy-backend |

### На сервере (85.117.235.93)

| Путь | Назначение |
|------|------------|
| `/var/www/siteaacess.store/` | Репозиторий frontend (git) |
| `/var/www/siteaacess.store/dist/` | Собранный SPA (nginx root) |
| `/var/www/online-parser.siteaacess.store/` | Backend Laravel |
| `/var/www/online-parser.siteaacess.store/public/` | Document root Laravel |
| `/var/www/api.siteaacess.store/` | Заглушка (placeholder) |
| `/var/www/photos.siteaacess.store/` | Поддомен для фото |
| `/var/www/bella/` | Отдельный проект |
| `/var/www/deploy.sh` | Общий deploy-скрипт |

---

## 3. GIT СТАТУС

### Frontend (cheepy-frontend)

| Параметр | Значение |
|----------|----------|
| Origin | https://github.com/letoceiling-coder/cheepy-frontend.git |
| Текущая ветка | main |
| Локальный HEAD | 1900d3b (Add continuous parser daemon buttons) |
| origin/main | 1900d3b |
| Uncommitted | Есть (много staged + unstaged + untracked) |
| Unpushed commits | 0 |

**Детали:**
- Много файлов в staged (новые assets, компоненты, отчёты)
- Много unstaged изменений (документация, скрипты, src)
- Untracked: отчёты, backend-drafts, constructor, pages/info, pages/person

### Backend (cheepy-backend)

| Параметр | Значение |
|----------|----------|
| Origin | https://github.com/letoceiling-coder/cheepy-backend.git |
| Текущая ветка | main |
| Локальный HEAD | 3338641 |
| origin/main | 3338641 |
| Uncommitted | Да (modified + untracked) |
| Unpushed commits | 0 |

**Детали:**
- Modified: routes, controllers, jobs, events, config
- Untracked: новые команды (ParserDiagnostics, ParserKillStuck и др.), docs

### Сервер

| Репозиторий | HEAD на сервере | Соответствие origin |
|-------------|-----------------|---------------------|
| siteaacess.store | eac7e9b | Отстаёт от origin/main (1900d3b) |
| online-parser | 3338641 | Совпадает с origin/main |

**Примечание:** Frontend на сервере обновляется через SCP (копирование `dist/`), а не через `git pull`. Поэтому разница в git не критична — содержимое `dist/` формируется локально и выгружается скриптом deploy.

---

## 4. СЕРВЕРНАЯ ИНФРАСТРУКТУРА

### Доступ

- **SSH:** root@85.117.235.93
- **ОС:** Linux (Ubuntu/Debian)

### Установленное ПО

| Компонент | Версия |
|-----------|--------|
| Node.js | v20.20.0 |
| npm | 10.8.2 |
| PHP | 8.2.30 |
| Composer | 2.9.5 |
| Redis | Работает (PONG) |
| MySQL | Работает |

### Supervisor

| Процесс | Статус |
|---------|--------|
| parser-worker_00, 01 | RUNNING |
| parser-worker-default_00 | RUNNING |
| parser-worker-photos_00–05 | RUNNING |
| reverb | RUNNING (uptime ~1 день) |

### Cron

```bash
* * * * * cd /var/www/online-parser.siteaacess.store && php artisan schedule:run >> /dev/null 2>&1
```

### SSL

- siteaacess.store — Let's Encrypt
- online-parser.siteaacess.store — Let's Encrypt

---

## 5. NGINX КОНФИГУРАЦИЯ

### siteaacess.store (frontend)

- **Домены:** siteaacess.store, www.siteaacess.store
- **Root:** `/var/www/siteaacess.store/dist`
- **SSL:** 443 (Let's Encrypt)
- **Правило:** `try_files $uri $uri/ /index.html` для SPA
- **Кэш:** 1 год для js, css, изображений

### online-parser.siteaacess.store (backend)

- **Домен:** online-parser.siteaacess.store
- **Root:** `/var/www/online-parser.siteaacess.store/public`
- **PHP:** php8.2-fpm (unix socket)
- **WebSocket:** `/app` → proxy_pass http://127.0.0.1:8080 (Reverb)
- **SSL:** 443 (Let's Encrypt)

### Другие виртуальные хосты

- **api.siteaacess.store:** заглушка (return 200 JSON)
- **photos.siteaacess.store:** статика для фото

---

## 6. ENV КОНФИГУРАЦИИ

### Frontend (локально)

**Файлы:** `.env`, `.env.local`, `.env.production`, `.env.deploy` (gitignore)

**Пример (env.example, env.production.example):**
```
VITE_API_URL=https://online-parser.siteaacess.store/api/v1
VITE_REVERB_APP_ID=parser
VITE_REVERB_APP_KEY=parser-key
VITE_REVERB_HOST=online-parser.siteaacess.store
VITE_REVERB_PORT=443
VITE_REVERB_SCHEME=https
```

**Deploy (.env.deploy):**
- `DEPLOY_TARGET=root@85.117.235.93:/var/www/siteaacess.store/dist`

### Backend (deploy/env-online-parser.txt)

```
APP_URL=https://online-parser.siteaacess.store
DB_CONNECTION=mysql
DB_HOST=127.0.0.1, DB_DATABASE=sadavod_parser
QUEUE_CONNECTION=database
REDIS_* — настроен
BROADCAST_CONNECTION=log (в примере)
```

### Сервер (.env backend)

Присутствуют: APP_URL, DB_*, REVERB_*, VITE_APP_NAME (значения замаскированы при аудите).

---

## 7. ДЕПЛОЙ

### Frontend

**Способ 1 — SCP (основной в текущем workflow):**
1. `npm run build` локально
2. `node scripts/deploy.cjs` → копирует `dist/*` на сервер в `/var/www/siteaacess.store/dist/`
3. Конфигурация: `.env.deploy` → `DEPLOY_TARGET`

**Способ 2 — Git + build на сервере (deploy.sh):**
1. `cd /var/www/siteaacess.store`
2. `git fetch origin && git reset --hard origin/main`
3. `npm install && npm run build`

**Итог:** В текущем процессе используется SCP. Локальный build заливается в `dist/`, изменения из git на сервере не применяются.

### Backend

**Процесс (deploy.sh):**
1. `cd /var/www/online-parser.siteaacess.store`
2. `git fetch origin && git reset --hard origin/main`
3. Проверка/создание `JWT_SECRET` в `.env`
4. `composer install --no-dev --optimize-autoloader`
5. `php artisan migrate --force`
6. Очистка кэша, `config:cache`
7. `php artisan queue:restart`
8. `chown` storage/bootstrap/cache

**Дополнительно:** `scripts/deploy-and-fix.sh` — очистка кэша Laravel, проверка ws-status, restart Supervisor.

### CI/CD

- GitHub Actions или другие CI/CD не обнаружены
- Всё выполняется вручную: локальный build + SCP для frontend, `deploy.sh` на сервере для backend

### Инструменты

- rsync — не используется
- Docker — не используется
- Build выполняется: локально (frontend), на сервере (backend через deploy.sh)

---

## 8. СВЯЗЬ FRONTEND → BACKEND

### Base API URL

- **Production:** `https://online-parser.siteaacess.store/api/v1`
- Задаётся через `VITE_API_URL` (env) или дефолт в `src/lib/api.ts`

### CORS (backend config/cors.php)

```php
'allowed_origins' => ['https://siteaacess.store', 'http://cheepy.loc']
```

### Auth

- JWT (Bearer) для админ-панели
- Токен в `localStorage` (`admin_token`)
- Endpoints: `/auth/login`, `/auth/me`, `/auth/refresh`

### WebSocket (Reverb)

- Host: `online-parser.siteaacess.store`
- Path: `/app` (proxy на порт 8080)
- Используется для обновлений статуса парсера в реальном времени

---

## 9. ДОМЕНЫ

| Домен | Назначение | SSL |
|-------|------------|-----|
| siteaacess.store | Frontend (SPA) | Да |
| www.siteaacess.store | Редирект на siteaacess.store | Да |
| online-parser.siteaacess.store | Backend API + Reverb | Да |
| api.siteaacess.store | Заглушка | Нет |
| photos.siteaacess.store | Фото (статика) | Нет |

---

## 10. ВОЗМОЖНЫЕ ПРОБЛЕМЫ

1. **Два способа деплоя frontend**  
   SCP и git+build дают разный результат. При git pull на сервере без пересборки dist/ сайт не обновится. Нужно чётко зафиксировать основной процесс (сейчас — SCP).

2. **api.siteaacess.store — заглушка**  
   Реальный API — `online-parser.siteaacess.store`. Если frontend когда-либо переключится на api.siteaacess.store, потребуется настройка proxy или перенос API.

3. **Много некоммиченных изменений**  
   Риск потери правок и рассинхронизации окружений. Рекомендуется регулярный коммит и push.

4. **CORS**  
   Разрешены только `https://siteaacess.store` и `http://cheepy.loc`. Другие домены (например, localhost при разработке) нужно добавить при необходимости.

5. **VITE_REVERB_* в production build**  
   Значения зашиваются в сборку. Нужно обеспечить правильный `.env.production` (или эквивалент) при build.

---

## 11. РЕКОМЕНДАЦИИ

1. **Стандартизировать деплой frontend:** либо только SCP, либо только git+build на сервере. Документировать выбранный вариант.
2. **Закоммитить изменения:** разнести важные правки по коммитам и сделать push в cheepy-frontend и cheepy-backend.
3. **CI/CD:** рассмотреть GitHub Actions для автоматического build и deploy при push в main.
4. **Один источник правды для .env:** держать `.env.example` актуальным для backend, frontend — env.example / env.production.example.
5. **Проверка деплоя:** после каждого deploy проверять `https://siteaacess.store` и `https://siteaacess.store/admin`, а также `https://online-parser.siteaacess.store/api/v1/up`.

---

*Отчёт создан автоматически. Без внесения изменений в код и инфраструктуру.*

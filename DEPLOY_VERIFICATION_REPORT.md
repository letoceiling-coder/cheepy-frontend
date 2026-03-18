# Deploy Verification Report

**Дата:** 14.03.2026  
**Статус:** Успешно

---

## 1. Git синхронизация

| Репозиторий | GitHub (origin/main) | Сервер (HEAD) | Соответствие |
|-------------|----------------------|---------------|--------------|
| Frontend | 1900d3b | 1900d3b | OK |
| Backend  | 4baade9 | 4baade9 | OK |

**Коммиты:**
- Frontend: `1900d3b` — Add continuous parser daemon buttons to admin
- Backend: `4baade9` — Fix daemon listener: use parser queue so workers process ScheduleNextParserDaemon

---

## 2. Backup

- Frontend: `/var/www/siteaacess.store/dist.backup.1773489421`
- Backend: `/var/www/online-parser.siteaacess.store.backup.1773489421`

---

## 3. Health check

| Endpoint | Результат |
|----------|-----------|
| https://siteaacess.store | HTTP 200 |
| https://online-parser.siteaacess.store/api/v1/up | `{"status":"ok"}` |
| https://online-parser.siteaacess.store/api/v1/ws-status | `{"reverb":"running","queue_workers":9,"redis":"connected"}` |

---

## 4. Статус сервисов

| Сервис | Статус |
|--------|--------|
| nginx | active |
| redis-server | active |
| php8.2-fpm | active |
| supervisor (parser-worker x2) | RUNNING |
| supervisor (parser-worker-default) | RUNNING |
| supervisor (parser-worker-photos x6) | RUNNING |
| supervisor (reverb) | RUNNING |

---

## 5. Deploy шаги

1. Backend: `git push origin main` (4baade9)
2. Backup frontend dist и backend
3. Frontend: `git fetch`, `reset --hard origin/main`, `npm ci`, `npm run build`
4. Backend: `git fetch`, `reset --hard origin/main`, `composer install`, `migrate`, `config:cache`, `route:cache`, `queue:restart`
5. Переименован конфликтный файл: `config/ParserMetricsService.php` → `.bak` (дубликат класса)
6. Перезапуск: `systemctl reload nginx`, `supervisorctl restart all`

---

## 6. Заметки

- В nginx error.log есть записи от ботов (wp-includes, phpinfo и т.п.) — к работе приложения не относятся
- Сервер полностью соответствует GitHub

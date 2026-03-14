# Parser Admin Upgrade Report

**Date:** 2025-03-05  
**Scope:** Админ-панель управления парсером, новые API и UI

---

## 1. Изменения Backend (cheepy-backend)

### Новые/используемые API endpoints

| Метод | Endpoint | Описание |
|-------|----------|----------|
| GET | `/api/v1/parser/diagnostics` | Полная диагностика: очереди, failed jobs, lock |
| POST | `/api/v1/parser/queue-flush` | Сброс очередей (`php artisan queue:clear`) |
| POST | `/api/v1/parser/queue-restart` | Перезапуск воркеров (`php artisan queue:restart`) |
| POST | `/api/v1/parser/clear-failed` | Очистка failed jobs (`php artisan queue:prune-failed`) |
| GET | `/api/v1/parser/failed-jobs` | Список последних failed jobs |
| POST | `/api/v1/parser/retry-job/{id}` | Retry одного job (`php artisan queue:retry {id}`) |
| POST | `/api/v1/parser/start-daemon` | Запуск daemon (Resume) |
| POST | `/api/v1/parser/stop-daemon` | Остановка daemon (Stop) |
| POST | `/api/v1/parser/release-lock` | Снятие блокировки парсера |

### Реализация (ParserController)

- `clearFailedJobs()` — очистка таблицы `failed_jobs`
- `failedJobs()` — последние 20 записей из `failed_jobs`
- `retryJob($id)` — возврат job в очередь
- `diagnostics()` — размеры очередей, failed count, lock status

---

## 2. Изменения Frontend (cheepy-frontend)

### UI элементы на странице /admin/parser

1. **Parser Diagnostics** — карточка с метриками:
   - Очередь парсера (`parser_queue_size`)
   - Очередь фото (`photos_queue_size`)
   - Failed jobs count
   - Статус блокировки (held / free)

2. **Управление системой** — кнопки:
   - Reset Queue (queue-flush)
   - Clear Failed Jobs (clear-failed)
   - Restart Workers (queue-restart)
   - Resume Daemon (start-daemon)
   - Stop Daemon (stop-daemon)
   - Освободить блокировку (release-lock)
   - Очистка логов

3. **Parser Errors** — таблица failed jobs:
   - Колонки: Time, Queue, Job, Error, Retry
   - Последние 20 записей
   - Кнопка Retry для каждого job

### API (src/lib/api.ts)

- `parserApi.diagnostics()`
- `parserApi.clearFailedJobs()`
- `parserApi.failedJobs()`
- `parserApi.retryJob(id)`

---

## 3. Результаты Deploy

| Компонент | Статус |
|-----------|--------|
| Backend deploy | OK (547d4df) |
| Frontend deploy | OK (b9d8450) |
| nginx reload | OK |
| Site availability | https://siteaacess.store |

---

## 4. Исправление после deploy

Добавлены отсутствующие `useQuery` хуки в `ParserPage.tsx`:

- `parser-diagnostics` — загрузка и автообновление каждые 15 сек
- `parser-failed-jobs` — загрузка списка failed jobs и автообновление каждые 30 сек

Без них блоки Parser Diagnostics и Parser Errors не отображались корректно.

---

## 5. Проверка

После deploy проверить:

1. https://siteaacess.store/admin — вход в админку
2. Меню: Парсер
3. Должны отображаться:
   - Parser Diagnostics
   - Управление системой (Reset Queue, Clear Failed Jobs, Restart Workers, …)
   - Parser Errors (таблица)

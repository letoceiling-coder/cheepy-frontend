# Parser State Fix Report

**Date:** 2025-03-06  
**Задача:** Убрать автоматический запуск парсера при обновлении страницы. Парсер должен запускаться только вручную.

---

## 1. Анализ

### Frontend (ParserPage.tsx)

- **useEffect:** только для загрузки логов и EventSource progress — **нет auto-start**
- **Нет вызовов** `parserApi.start()` или `parserApi.startDaemon()` при mount/load
- Frontend **не вызывает** автоматически никакие POST-эндпоинты при загрузке страницы

### Backend — источник auto-start

Автозапуск был возможен из‑за:

1. **parser_daemon_enabled** в БД — остаётся `true` после предыдущего запуска
2. **ParserWatchdog** (cron каждые 5 мин) — при `daemon_enabled` и idle+пустая очередь мог диспатчить `ParserDaemonJob`
3. **ScheduleNextParserDaemon** — после завершения full run диспатчит следующий daemon job, если `daemon_enabled`

Решение: добавить **parser_state** как источник истины. Daemon и watchdog выполняют действия **только при status=RUNNING**.

---

## 2. Изменения Backend

### Таблица `parser_state`

Миграция: `2026_03_06_100002_create_parser_state_table.php`

| Колонка   | Тип         | Описание                        |
|-----------|--------------|---------------------------------|
| id        | bigint       | PK                              |
| status    | varchar(32)  | running / stopped / paused      |
| locked    | boolean      | Блокировка                      |
| last_start| timestamp    | Время последнего старта         |
| last_stop | timestamp    | Время последней остановки       |
| updated_at| timestamps   |                                 |

По умолчанию создаётся строка со `status = stopped`.

### Модель `ParserState`

- `ParserState::current()` — синглтон (id=1)
- Константы: `STATUS_RUNNING`, `STATUS_STOPPED`, `STATUS_PAUSED`

### API

| Метод | Endpoint           | Описание                                      |
|-------|--------------------|-----------------------------------------------|
| GET   | /parser/state      | Текущий статус (status, last_start, last_stop)|
| POST  | /parser/pause      | Установить status=PAUSED                      |

### Логика контроллера

- **POST /parser/start-daemon** — устанавливает `status=RUNNING`, `last_start`, вызывает `ParserDaemonJob`
- **POST /parser/stop** — устанавливает `status=STOPPED`, `last_stop`, сбрасывает `parser_daemon_enabled`
- **POST /parser/stop-daemon** — то же, что stop
- **POST /parser/pause** — устанавливает `status=PAUSED`

### Daemon

- **ParserDaemonJob:** в начале проверяет `ParserState::current()->status === RUNNING`; иначе — выход без диспатча следующего
- **ScheduleNextParserDaemon:** диспатчит следующий daemon только при `status === RUNNING`
- **ParserWatchdog:** диспатчит daemon только при `status === RUNNING` и `daemon_enabled`

### ParserReset (parser:reset)

- Сбрасывает `parser_state.status` в `STOPPED`

---

## 3. Изменения Frontend

### API (src/lib/api.ts)

- `parserApi.state()` — GET /parser/state
- `parserApi.pause()` — POST /parser/pause
- Тип `ParserStateResponse`: status, locked, last_start, last_stop, updated_at

### ParserPage UI

**Блок Parser Control**

- Start Parser — запуск daemon
- Stop Parser — полная остановка
- Pause Parser — приостановка
- Один прогон — разовый запуск (не daemon)

**Блок System Tools**

- Reset Queue
- Clear Failed Jobs
- Restart Workers
- Освободить блокировку
- Очистка логов

Daemon кнопки (Resume Daemon, Stop Daemon) убраны из System Tools и заменены на Start/Stop/Pause в Parser Control.

### Вывод parser state

- В Parser Control отображаются: status, last_start, last_stop
- Запрос `parserApi.state()` с интервалом 15 сек

---

## 4. Устранение auto-start

1. Daemon работает только при `parser_state.status === RUNNING`
2. При деплое/миграции по умолчанию `status=stopped`
3. Watchdog и ScheduleNextParserDaemon проверяют `status`
4. На frontend нет вызовов start/startDaemon при load или refresh

---

## 5. Поведение после изменений

- **Start** → парсер запускается, `status=RUNNING`, daemon продолжает работу
- **Refresh страницы** → парсер продолжает работать (состояние в БД)
- **Stop** → парсер останавливается, `status=STOPPED`
- **Refresh страницы** → парсер остаётся остановленным

---

## 6. Deploy

### Backend

```bash
cd /var/www/online-parser.siteaacess.store
git fetch origin
git reset --hard origin/main
composer install --no-dev --optimize-autoloader
php artisan migrate --force
php artisan config:clear
php artisan config:cache
php artisan route:cache
php artisan queue:restart
```

### Frontend

```bash
cd /var/www/siteaacess.store
git fetch origin
git reset --hard origin/main
npm ci
npm run build
systemctl reload nginx
```

---

## 7. Файлы

### Backend (sadavod-laravel)

- `database/migrations/2026_03_06_100002_create_parser_state_table.php`
- `app/Models/ParserState.php`
- `app/Http/Controllers/Api/ParserController.php` — state(), pause(), правки start/stop/startDaemon/stopDaemon
- `routes/api.php` — GET parser/state, POST parser/pause
- `app/Jobs/ParserDaemonJob.php` — проверка ParserState
- `app/Listeners/ScheduleNextParserDaemon.php` — проверка ParserState
- `app/Console/Commands/ParserWatchdog.php` — проверка ParserState
- `app/Console/Commands/ParserReset.php` — установка parser_state=stopped

### Frontend (cheepy)

- `src/lib/api.ts` — state(), pause(), ParserStateResponse
- `src/admin/pages/ParserPage.tsx` — Parser Control, System Tools, parser state

# Скрипт `deploy.sh` (корень репозитория)

**Как ссылаться в Cursor:** `@docs/deploy.md` (или выбрать файл `docs/deploy.md` в контексте чата).

Этот документ описывает **только** файл `deploy.sh` в **корне** этого репозитория (`cheepy` / `cheepy-frontend`). Он **не** заменяет серверный `/var/www/deploy.sh`, GitHub Actions и внутренний деплой API — см. обзор в [`06_DEPLOYMENT.md`](./06_DEPLOYMENT.md).

---

## Назначение

Один сценарий с **локальной машины разработчика**:

1. Закоммитить и отправить в GitHub **`main`** сразу **два** репозитория: фронтенд и бэкенд.
2. По **SSH** от **`root@85.117.235.93`** обновить **оба** проекта на сервере, пересобрать фронт, выровнять кэш/очередь Laravel с типичным CI, выставить права на `storage` / `bootstrap/cache`, перезагрузить nginx и Supervisor, выполнить проверки HTTP.

Итог при **успешном** завершении: на сервере в каталогах деплоя **коммит `origin/main`**, у фронта — **новая сборка** в `dist/`, бэкенд — зависимости Composer, миграции, **`config:cache`**, **`queue:restart`**, владельцы каталогов под **`www-data`** где нужно.

---

## Пути к репозиториям на машине, где запускается `deploy.sh`

Скрипт лежит в **корне фронтенд-репозитория** (например `C:\OSPanel\domains\cheepy\deploy.sh`). Пути вычисляются так:

| Переменная | По умолчанию |
|------------|----------------|
| **Фронтенд** (`CHEEPY_FRONTEND_ROOT`) | Каталог, где находится `deploy.sh` (текущий репозиторий `cheepy`). |
| **Бэкенд** (`CHEEPY_BACKEND_ROOT`) | Соседний каталог **`../sadavod-laravel`** от каталога с `deploy.sh` (типично `C:\OSPanel\domains\sadavod-laravel`). В **Git Bash** это же выглядит как `/c/OSPanel/domains/cheepy` и `/c/OSPanel/domains/sadavod-laravel`. |

Если бэкенд клонирован в другое место:

```bash
export CHEEPY_BACKEND_ROOT=/path/to/cheepy-backend
./deploy.sh
```

При отсутствии валидного `.git` в одном из путей скрипт завершится с сообщением об ошибке.

**Требования:** bash (Git Bash / WSL / Linux / macOS), настроенный **`git push`** в `origin` и безинтерактивный **`ssh root@85.117.235.93`**.

---

## Поведение на сервере (важно)

### SSH и пользователь

Деплой на сервере выполняется **от root** — это **намеренно** (единый сценарий с установкой пакетов, правами и сервисами). После команд Artisan выполняется **`chown -R www-data:www-data storage bootstrap/cache`**, чтобы PHP-FPM и воркеры, работающие от **`www-data`**, имели согласованный доступ к кэшу и хранилищу.

### Git: `fetch` + `reset --hard origin/main` (не merge-pull)

Чтобы не зависеть от расхождений локальной `main` на сервере, используется:

```text
git fetch origin && git checkout main && git reset --hard origin/main
```

### `git clean` — только с исключениями

Голый **`git clean -fd`** удаляет **все** неотслеживаемые файлы, включая риск для **`.env`** (если он в `.gitignore`). В скрипте:

- **Бэкенд:** `git clean -fd` с исключениями **`.env`**, **`.env.*`**, **`storage`**, **`bootstrap/cache`** — не трогаем секреты и типичные runtime-каталоги Laravel.
- **Фронтенд:** исключения **`.env`**, **`.env.*`** — перед сборкой можно убрать лишний неотслеживаемый мусор, не снеся конфиг; **`node_modules`** и **`dist`** при необходимости удаляются как неотслеживаемые и затем восстанавливаются через **`npm ci`** / **`npm run build`**.

### Согласование с шагами из [`06_DEPLOYMENT.md`](./06_DEPLOYMENT.md) (GitHub Actions backend)

После `composer install` и `migrate`:

- `php artisan optimize:clear`
- `php artisan config:cache`
- `php artisan queue:restart`
- `chown -R www-data:www-data storage bootstrap/cache` (при ошибке не валим весь деплой: `|| true`)

Далее сборка фронта, затем **`systemctl reload nginx`**, **`supervisorctl restart all`**.

### Проверка health

Запрос к `https://online-parser.siteaacess.store/api/health`. Успех, если в теле ответа есть **`"status"`** и значение **`ok`** в формате JSON **с пробелами или без** (например `"status": "ok"` и `"status":"ok"`):

```bash
grep -qE '"status"[[:space:]]*:[[:space:]]*"ok"'
```

Затем **`curl -fS`** по главной странице фронта.

---

## Пошагово (кратко)

### Локально

1. `cd` в **`CHEEPY_FRONTEND_ROOT`**, `git add .`, коммит `deploy frontend` (или пропуск), **`git push origin main`**.
2. То же для **`CHEEPY_BACKEND_ROOT`**, сообщение `deploy backend`.

Коммитятся все подготовленные к коммиту изменения (не в `.gitignore`). Случайные файлы в индексе могут уехать в `main` — перед деплоем проверяйте **`git status`**.

### На сервере

См. разделы выше: бэкенд (git, composer, migrate, optimize, config:cache, queue:restart, chown), фронтенд (git, npm ci, build, проверка `dist`), сервисы, health.

---

## Ответы на типичные вопросы

### Деплоит ли скрипт оба проекта?

**Да** — два push’а локально, затем на сервере сначала бэкенд, затем фронт.

### После успешного завершения код и сборка актуальны?

**Да**, если скрипт дошёл до **`✅ DEPLOY DONE`**: ветка на сервере совпадает с **`origin/main`**, фронт пересобран, Laravel получил кэш конфигурации и сигнал на перезапуск очереди, права на `storage` и `bootstrap/cache` выровнены под **`www-data`**. Кэш браузера/CDN по-прежнему может маскировать обновление UI.

### Стабильность

- **`set -euo pipefail`** на локальной стороне и **`set -euo pipefail`** в блоке SSH — падение команды обрывает сценарий (кроме явных `|| true` там, где это задумано).
- Если **`git push`** не fast-forward или SSH недоступен — деплой остановится; сервер может остаться на предыдущем состоянии **до** успешного push’а.

---

## Связанные документы

- Обзор режимов деплоя: [`06_DEPLOYMENT.md`](./06_DEPLOYMENT.md)
- Правила репозитория: `.cursor/rules/repository-boundaries.mdc`

---

## Чеклист после деплоя

- [ ] В логе нет ошибок до **`✅ DEPLOY DONE`** / **`🎉 ALL DONE`**.
- [ ] На сервере **`git rev-parse HEAD`** в каталогах бэкенда и фронта совпадает с ожидаемым **`main`** на GitHub.
- [ ] При сомнении по статике — проверка в инкогнито или с обходом кэша.

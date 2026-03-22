# 🚀 Руководство по развертыванию

## ⚠️ SYSTEM RULE — PRODUCTION FIRST

Любое изменение (фронт или бэкенд) **сразу** выкатывается на прод. Запрещено: код без деплоя, отчёт без деплоя, только локальная проверка.

**Фронт:** `git push` → на сервере `siteaacess.store`: `git pull` / `reset --hard`, `rm -rf dist`, `npm install`, `npm run build`, `nginx reload`.

**Бэкенд (Laravel):** `git pull` в каталоге API → `php artisan migrate --force`, `route:clear`, `config:clear`, `cache:clear`, `optimize:clear`.

**Отчёт:** hash коммита, лог деплоя, подтверждение что прод работает (URL + Network).

---

## Требования

- Node.js 18+
- npm или yarn
- SSH доступ к серверу

## Локальная разработка

### 1. Установка зависимостей

```bash
npm install
```

### 2. Запуск dev-сервера

```bash
npm run dev
```

Приложение доступно на `http://localhost:5173`

### 3. Сборка для продакшена

```bash
npm run build
```

Собранные файлы будут в директории `dist/`

## Деплой на продакшн

### Правило: всегда деплой после изменений

После любых изменений кода или конфигурации обязательно выполнять деплой. Сервер должен всегда отражать актуальное состояние.

### Рекомендуемый способ (фронт): локальная сборка + загрузка dist

Гарантирует, что на сервере оказывается именно та сборка, которую вы собрали (нет кэша и старого JS):

```bash
npm run build
npm run deploy:frontend
```

Скрипт `scripts/deploy-frontend-upload.cjs` упаковывает `dist/`, заливает на сервер в `/var/www/siteaacess.store/dist`, перезагружает nginx.

### Альтернативы деплоя

- **Полный деплой (фронт + бекенд):** `npm run deploy` — копирует `deploy.sh` на сервер и запускает его (сборка выполняется на сервере: git pull → npm run build).
- **Деплой:** `bash /var/www/deploy-cheepy.sh` — единственная команда.

### Конфигурация деплоя

1. Создайте файл `.env.deploy` (не коммитится в git):

```bash
DEPLOY_SSH=root@85.117.235.93
```

2. Используйте `env.deploy.example.txt` как шаблон.

Скрипты деплоя читают `DEPLOY_SSH` из `.env.deploy` для SSH/SCP.

## Ручной деплой

### Через SCP

```bash
# Сборка
npm run build

# Деплой
scp -r dist/* user@host:path/to/public_html/
```

### Через FTP

1. Соберите проект: `npm run build`
2. Загрузите содержимое `dist/` в корень сайта через FTP-клиент

## Продакшн сервер (VPS siteaacess.store)

**Сервер**: 85.117.235.93  
**Домен**: https://siteaacess.store  
**SSH**: `ssh root@85.117.235.93`

### Структура на сервере

| Назначение | Домен | Путь на сервере | Nginx root (фронт) |
|------------|--------|------------------|---------------------|
| Фронтенд (SPA) | https://siteaacess.store | `/var/www/siteaacess.store` | `/var/www/siteaacess.store/dist` |
| API (бекенд) | https://api.siteaacess.store | `/var/www/api.siteaacess.store` | — |
| Фото | https://photos.siteaacess.store | `/var/www/photos.siteaacess.store` | — |

**Важно:** Фронтенд отдаётся из каталога **dist** (результат `npm run build`). Nginx root для siteaacess.store должен быть **`/var/www/siteaacess.store/dist`**. Маршруты фронта публичные; только `/admin/*` защищён авторизацией.

### Деплой фронтенда на VPS

**Рекомендуемый способ (локальная сборка + загрузка):**
```bash
npm run build
npm run deploy:frontend
```
Содержимое локального `dist/` заливается в `/var/www/siteaacess.store/dist`. Путь на сервере и Nginx root: **`/var/www/siteaacess.store/dist`**.

**Сборка на сервере:** `npm run deploy` копирует `deploy.sh` и запускает `bash /var/www/deploy.sh frontend` (git pull → npm run build в репо на сервере).

### SSL (Let's Encrypt)

- Для **siteaacess.store** и **www.siteaacess.store** сертификат уже выпущен, продление автоматическое (certbot.timer).
- Для поддоменов **api** и **photos** нужно сначала добавить DNS-записи:
  - `api.siteaacess.store` → A-запись на `85.117.235.93`
  - `photos.siteaacess.store` → A-запись на `85.117.235.93`
  После этого на сервере выполните:
  ```bash
  ssh root@85.117.235.93
  certbot --nginx -d api.siteaacess.store -d photos.siteaacess.store --non-interactive
  ```

### Переменные для продакшена (фронтенд)

В билде укажите API по поддомену. В `.env.production` или при сборке:
```
VITE_API_URL=https://api.siteaacess.store
```

### Laravel (Sadavod Parser) — online-parser.siteaacess.store

**URL**: https://online-parser.siteaacess.store  
**Путь на сервере**: `/var/www/online-parser.siteaacess.store`  
**Публичная папка**: `/var/www/online-parser.siteaacess.store/public`

**БД на сервере** (MariaDB):
- База: `sadavod_parser`
- Пользователь: `sadavod`
- Пароль: `SadavodParser2025` (при необходимости смените в `.env` на сервере)

**Повторный деплой Laravel** (из папки `sadavod-laravel`):
```bash
tar --exclude=node_modules --exclude=vendor --exclude=.git --exclude=.env -cf sadavod-laravel.tar .
scp sadavod-laravel.tar root@85.117.235.93:/var/www/online-parser.siteaacess.store/
# На сервере:
cd /var/www/online-parser.siteaacess.store && tar xf sadavod-laravel.tar && rm sadavod-laravel.tar
COMPOSER_ALLOW_SUPERUSER=1 composer install --no-dev --no-interaction
php artisan migrate --force
chown -R www-data:www-data storage bootstrap/cache
```

---

## Beget (альтернативный хостинг)

**URL**: https://cheepy.siteaccess.ru  
**Путь на сервере**: `cheepy.siteaccess.ru/public_html/`  
**SSH**: `ssh dsc23ytp@dragon.beget.ru`

## Проверка деплоя

После деплоя проверьте:

1. ✅ Главная страница загружается
2. ✅ Навигация работает корректно
3. ✅ Стили применяются
4. ✅ Изображения отображаются
5. ✅ Роутинг работает (React Router)

## Переменные окружения

### Разработка (.env)

```bash
VITE_API_URL=http://localhost:3000
```

### Продакшн

Переменные встраиваются в билд через Vite.

## CI/CD (будущее)

Планируется настройка GitHub Actions:

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm run build
      - name: Deploy to server
        run: npm run deploy
```

## Откат изменений

Если нужно откатиться:

```bash
# Локально
git log --oneline
git checkout <commit-hash>
npm run deploy

# Или через SSH на сервере
# Восстановить бэкап dist/
```

## Бэкапы

Рекомендуется делать бэкапы перед каждым деплоем:

```bash
# На сервере
tar -czf backup-$(date +%Y%m%d).tar.gz public_html/
```

## Мониторинг

- Логи сервера: `/var/log/`
- Ошибки приложения: Browser DevTools Console
- Метрики: планируется интеграция с Google Analytics

## Troubleshooting

### Проблема: 404 на всех страницах кроме главной

**Решение**: Настроить .htaccess для SPA:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

### Проблема: Белый экран после деплоя

**Решение**: Проверьте пути к ассетам в `vite.config.ts`:

```ts
export default defineConfig({
  base: './', // или '/'
})
```

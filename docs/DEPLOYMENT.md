# 🚀 Руководство по развертыванию

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

### Автоматический деплой (рекомендуется)

Проект настроен для автоматического деплоя на Beget:

```bash
npm run deploy
```

### Конфигурация деплоя

1. Создайте файл `.env.deploy` (не коммитится в git):

```bash
DEPLOY_TARGET=user@host:path/to/public_html
```

Пример:
```bash
DEPLOY_TARGET=dsc23ytp@dragon.beget.ru:cheepy.siteaccess.ru/public_html
```

2. Используйте `env.deploy.example.txt` как шаблон

### Скрипт деплоя

Файл `scripts/deploy.cjs`:
- Собирает проект (`npm run build`)
- Копирует `dist/*` на сервер через SCP
- Автоматически читает креденшелы из `.env.deploy`

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

| Назначение | Домен | Путь на сервере |
|------------|--------|------------------|
| Фронтенд (SPA) | https://siteaacess.store | `/var/www/siteaacess.store` |
| API (бекенд) | https://api.siteaacess.store | `/var/www/api.siteaacess.store` |
| Фото | https://photos.siteaacess.store | `/var/www/photos.siteaacess.store` |

### Деплой фронтенда на VPS

1. Создайте `.env.deploy` (или добавьте в него):
   ```
   DEPLOY_TARGET=root@85.117.235.93:/var/www/siteaacess.store
   ```
2. Соберите и залейте:
   ```bash
   npm run build
   npm run deploy
   ```
   Или вручную: `scp -r dist/* root@85.117.235.93:/var/www/siteaacess.store/`

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

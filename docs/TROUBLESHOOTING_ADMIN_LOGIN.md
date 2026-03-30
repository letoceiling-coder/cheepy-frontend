# Админ-вход: 401 «Неверные учётные данные»

## Что происходит

Форма на `https://siteaacess.store/admin/login` отправляет запрос на бекенд:

`POST https://online-parser.siteaacess.store/api/v1/auth/login`  
тело: `{ "email": "...", "password": "..." }`

Ответ **401** означает: **бекенд отклонил пароль** (пользователь не найден, неверный пароль, аккаунт отключён). Это не баг фронта и не «редирект» — это ответ API.

## Проверка с компьютера

```bash
curl -s -X POST "https://online-parser.siteaacess.store/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"ВАШ_EMAIL\",\"password\":\"ВАШ_ПАРОЛЬ\"}"
```

При успехе в JSON будет `token` и `user`. При ошибке — `401` и сообщение об ошибке.

## Восстановление пользователя на сервере

В репозитории есть скрипт `scripts/fix-admin-user.php` — он **создаёт пользователя, если его нет**, или **обновляет**, если уже есть:

| Поле | Значение |
|------|----------|
| Email | `dsc-23@yandex.ru` |
| Пароль | `123123123` (после входа лучше сменить) |
| Имя | Джон Уик |
| Роль | `admin` (администратор) |

На сервере (после копирования скрипта в каталог бекенда или с указанием полного пути к `bootstrap`):

```bash
ssh root@85.117.235.93
cd /var/www/online-parser.siteaacess.store
# скопируйте fix-admin-user.php из репо или выполните через tinker:
php artisan tinker
>>> $u = \App\Models\AdminUser::updateOrCreate(['email' => 'dsc-23@yandex.ru'], ['name' => 'Admin', 'password' => bcrypt('НОВЫЙ_ПАРОЛЬ'), 'role' => 'admin', 'is_active' => true]);
```

Либо положите `scripts/fix-admin-user.php` на сервер и выполните:

```bash
php /var/www/online-parser.siteaacess.store/../path/to/fix-admin-user.php
```

(путь к скрипту должен совпадать с `$base` внутри файла — по умолчанию `/var/www/online-parser.siteaacess.store`.)

## После смены JWT_SECRET в .env

Если при деплое перегенерировали `JWT_SECRET`, старые токены перестают работать — нужно **войти заново** с паролем. На сам вход по email/паролю `JWT_SECRET` не влияет, пока пароль в БД верный.

## Фронтенд

- Клиент API: `src/lib/api.ts`, `BASE_URL` по умолчанию `https://online-parser.siteaacess.store/api/v1`.
- При 401 на **успешном** защищённом запросе вызывается выход из админки; при **неудачном** `POST /auth/login` logout не вызывается (см. логику `isAuthFailure` в `request()`).

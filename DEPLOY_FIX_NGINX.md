# Почему /person редиректит на /auth и где собирается проект

## Где собирается проект

**Сборка выполняется на сервере**, не у тебя в компе:

- **Скрипт:** `scripts/deploy.sh` (запускается по SSH на сервере).
- **Каталог на сервере:** `cd /var/www/siteaacess.store`
- **Действия:** `git fetch origin` → `git reset --hard origin/main` → `npm run build`
- **Результат сборки:** `dist/index.html` и `dist/assets/index-XXXXX.js` лежат в **`/var/www/siteaacess.store/dist/`**

То есть билд всегда в **`/var/www/siteaacess.store/dist/`**.

---

## В чём баг

В репозитории в **`deploy/nginx-siteaacess.conf`** указано:

```nginx
root /var/www/siteaacess.store;
```

То есть nginx отдаёт файлы из **корня репозитория**, а не из папки **`dist/`**, куда пишет `npm run build`.

В корне репозитория лежит **исходный** `index.html` (со строкой `<script src="/src/main.tsx">`). Либо там когда‑то вручную скопировали старый билд — в любом случае nginx **не** отдаёт актуальную сборку из `dist/`. Поэтому на сайте может быть старый бандл с редиректом на `/auth`.

---

## Что сделать на сервере

Нужно, чтобы nginx отдавал именно **сборку** из `dist/`.

**1. На сервере отредактировать конфиг nginx** (путь может быть другим, смотри, где у тебя лежит конфиг для siteaacess.store):

```bash
sudo nano /etc/nginx/sites-available/siteaacess.store
# или
sudo nano /etc/nginx/conf.d/siteaacess.conf
```

**2. Заменить строку `root` для siteaacess.store с:**

```nginx
root /var/www/siteaacess.store;
```

**на:**

```nginx
root /var/www/siteaacess.store/dist;
```

**3. Перезагрузить nginx:**

```bash
sudo nginx -t && sudo systemctl reload nginx
```

**4. Задеплоить фронт заново** (чтобы в `dist/` был свежий билд без редиректов):

```bash
# На сервере
cd /var/www/siteaacess.store
git fetch origin && git reset --hard origin/main
npm ci 2>/dev/null || npm install
npm run build
```

После этого nginx будет отдавать **именно** то, что собирает `npm run build` в `dist/`. Все страницы (/person, /account, /cart) в коде уже публичные, редиректов в актуальном коде нет.

---

## Кратко

| Вопрос | Ответ |
|--------|--------|
| Где собирается проект? | **На сервере:** `/var/www/siteaacess.store` после `git pull` и `npm run build`. Результат — в `dist/`. |
| Почему редирект? | Nginx отдаёт не `dist/`, а корень репо — браузер получает старый или не тот билд. |
| Что сделать? | В nginx поставить **`root /var/www/siteaacess.store/dist;`** и перезагрузить nginx, затем задеплоить фронт. |

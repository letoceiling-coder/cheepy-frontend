# Cheepy Deploy

**ANY OTHER DEPLOY METHOD IS FORBIDDEN**

---

## Единственная разрешённая команда

```bash
bash /var/www/deploy-cheepy.sh
```

---

## Установка на сервере (один раз)

**Один источник — симлинк** (скрипт всегда в репо, без копирования):

```bash
ln -sf /var/www/siteaacess.store/deploy/deploy-cheepy.sh /var/www/deploy-cheepy.sh
chmod +x /var/www/deploy-cheepy.sh
```

После `git pull` во frontend-репо скрипт уже актуален — симлинк указывает на файл в репо.

---

## Что выполняется

| Backend | Frontend |
|---------|----------|
| [1/6] git pull | [1/3] git pull |
| [2/6] composer install | [2/3] npm install |
| [3/6] migrate | [3/3] npm run build |
| [4/6] db:seed (optional) | |
| [5/6] cache clear | |
| [6/6] queue restart | |

**System:** nginx reload → health check (API 200, Front 200)

# Cheepy Deploy

**ANY OTHER DEPLOY METHOD IS FORBIDDEN**

---

## Единственная разрешённая команда

```bash
bash /var/www/deploy-cheepy.sh
```

---

## Установка (один раз)

```bash
cp deploy/deploy-cheepy.sh /var/www/deploy-cheepy.sh
chmod +x /var/www/deploy-cheepy.sh
```

---

## Обновление скрипта

После `git pull` во frontend-репо:

```bash
cp /var/www/siteaacess.store/deploy/deploy-cheepy.sh /var/www/deploy-cheepy.sh
```

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

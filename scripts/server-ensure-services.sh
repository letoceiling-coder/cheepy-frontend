#!/usr/bin/env bash
# Запуск на PROD-сервере (root), после git pull фронта: лежит в /var/www/siteaacess.store/scripts/
# Поднимает nginx / redis / php-fpm / supervisor и перезапускает программы supervisor (очереди, Reverb).

set -euo pipefail

echo "=== server-ensure-services: systemd base ==="
for u in nginx redis-server supervisor; do
  if systemctl cat "${u}.service" &>/dev/null; then
    systemctl is-active --quiet "$u" || systemctl start "$u" || true
  fi
done

# БД (на хосте обычно либо mariadb, либо mysql)
for u in mariadb mysql; do
  if systemctl cat "${u}.service" &>/dev/null; then
    systemctl is-active --quiet "$u" || systemctl start "$u" || true
    break
  fi
done

# PHP-FPM (имя unit зависит от версии PHP)
for u in php8.3-fpm php8.2-fpm php8.1-fpm php-fpm8.3 php-fpm8.2; do
  if systemctl cat "${u}.service" &>/dev/null; then
    systemctl is-active --quiet "$u" || systemctl start "$u" || true
    echo "Started/verified: $u"
    break
  fi
done

systemctl reload nginx 2>/dev/null || true
systemctl is-active --quiet nginx || {
  echo "❌ nginx is not active"
  exit 1
}

echo "=== server-ensure-services: supervisor ==="
if ! systemctl is-active --quiet supervisor 2>/dev/null; then
  echo "❌ supervisor is not active"
  exit 1
fi

supervisorctl reread
supervisorctl update
# Один перезапуск (двойной start all + restart давал лишние ERROR/abnormal termination)
supervisorctl restart all
sleep 3

echo "=== supervisorctl status ==="
supervisorctl status

if supervisorctl status 2>/dev/null | grep -E '\<(FATAL|EXITED)\>'; then
  echo "❌ supervisor: есть FATAL/EXITED"
  exit 1
fi

if supervisorctl status 2>/dev/null | grep -E '\<(ERROR|STOPPED)\>'; then
  echo "⚠️ supervisor: есть ERROR или STOPPED — смотрите storage/logs и stderr логов программ"
fi

echo "=== server-ensure-services: done ==="

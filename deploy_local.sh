#!/usr/bin/env bash
# Локальный деплой: commit+push фронта и бэка (при изменениях) → POST /api/internal/deploy
# Запуск: Git Bash из репозитория или с указанием путей ниже.
set -euo pipefail

echo "🚀 START DEPLOY (local → GitHub → server API)"

# --- пути OSPanel (Git Bash: /c/OSPanel/...) ---
BACKEND_PATH="${BACKEND_PATH:-/c/OSPanel/domains/sadavod-laravel}"
FRONTEND_PATH="${FRONTEND_PATH:-/c/OSPanel/domains/cheepy}"
API_URL="${API_URL:-https://online-parser.siteaacess.store/api/internal/deploy}"
RESP_FILE="${TMPDIR:-/tmp}/cheepy_deploy_response.json"

unstage_junk() {
  git restore --staged -- '*.log' '*.tmp' '*.cache' 2>/dev/null || true
  git restore --staged -- 'storage/logs/*' 'storage/framework/cache/*' 2>/dev/null || true
}

commit_if_needed() {
  local dir="$1"
  local msg="$2"
  cd "$dir"
  if [[ -z $(git status --porcelain) ]]; then
    echo "ℹ️  $(basename "$dir"): нет изменений"
    return 0
  fi
  git add -A
  unstage_junk
  if [[ -z $(git diff --cached --stat) ]]; then
    echo "ℹ️  $(basename "$dir"): после фильтрации нечего коммитить"
    return 0
  fi
  git commit -m "$msg"
  git push origin main
  echo "✅  $(basename "$dir"): push выполнен"
}

# --- ключ из .env бэкенда (тот же DEPLOY_KEY, что на сервере в .env Laravel) ---
if [[ ! -f "$BACKEND_PATH/.env" ]]; then
  echo "❌ Нет файла $BACKEND_PATH/.env"
  exit 1
fi
set -a
# shellcheck source=/dev/null
source "$BACKEND_PATH/.env"
set +a
if [[ -z "${DEPLOY_KEY:-}" ]]; then
  echo "❌ В $BACKEND_PATH/.env не задан DEPLOY_KEY"
  exit 1
fi

echo "📦 BACKEND → $BACKEND_PATH"
commit_if_needed "$BACKEND_PATH" "deploy: auto"

echo "🎨 FRONTEND → $FRONTEND_PATH"
commit_if_needed "$FRONTEND_PATH" "deploy: auto"

echo "⚙️  DEPLOY API"
HTTP_CODE=$(curl -sS -o "$RESP_FILE" -w "%{http_code}" \
  -X POST "$API_URL" \
  -H "X-DEPLOY-KEY: $DEPLOY_KEY" \
  -H "Accept: application/json")

echo "📡 HTTP $HTTP_CODE"
cat "$RESP_FILE"
echo ""

if [[ "$HTTP_CODE" != "200" ]]; then
  echo "❌ Неверный HTTP-код"
  exit 1
fi

# Laravel обычно отдаёт 200 и JSON: status ok|fail
if command -v jq >/dev/null 2>&1; then
  STATUS=$(jq -r '.status // empty' "$RESP_FILE" 2>/dev/null || echo "")
  if [[ "$STATUS" == "fail" ]]; then
    echo "❌ Сервер вернул status=fail (см. JSON выше, exit_code/output)"
    exit 1
  fi
  if [[ "$STATUS" == "ok" ]]; then
    echo "✅ API: status=ok"
  fi
else
  if grep -q '"status":"fail"' "$RESP_FILE" 2>/dev/null; then
    echo "❌ Сервер вернул status=fail (поставьте jq для точной проверки или смотрите JSON)"
    exit 1
  fi
fi

echo "🔥 Готово: код в GitHub, на сервере запущен deploy_server.sh по API"

#!/bin/bash
set -e

echo "CHECK FRONTEND CHANGES"
cd ~/cheepy-frontend

if [[ -n $(git status --porcelain) ]]; then
  git add -A
  git restore --staged -- '*.log' '*.tmp' '*.cache' 2>/dev/null || true
  git commit -m "deploy frontend"
  git push origin main
else
  echo "NO FRONTEND CHANGES"
fi

echo "CHECK BACKEND CHANGES"
cd ~/cheepy-backend

if [[ -n $(git status --porcelain) ]]; then
  git add -A
  git restore --staged -- '*.log' '*.tmp' '*.cache' 2>/dev/null || true
  git commit -m "deploy backend"
  git push origin main
else
  echo "NO BACKEND CHANGES"
fi

echo "CALL DEPLOY API"

set -a
# shellcheck source=/dev/null
source ~/cheepy-backend/.env
set +a

curl -X POST https://online-parser.siteaacess.store/api/internal/deploy \
  -H "X-DEPLOY-KEY: $DEPLOY_KEY"

echo "DONE"

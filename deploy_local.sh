#!/bin/bash
set -e

echo "CHECK FRONTEND CHANGES"
cd ~/cheepy-frontend

if [[ -n $(git status --porcelain) ]]; then
  git add .
  git commit -m "deploy frontend"
  git push origin main
else
  echo "NO FRONTEND CHANGES"
fi

echo "CHECK BACKEND CHANGES"
cd ~/cheepy-backend

if [[ -n $(git status --porcelain) ]]; then
  git add .
  git commit -m "deploy backend"
  git push origin main
else
  echo "NO BACKEND CHANGES"
fi

echo "CALL DEPLOY API"

curl -X POST https://online-parser.siteaacess.store/api/internal/deploy \
  -H "X-DEPLOY-KEY: $(grep DEPLOY_KEY ~/cheepy-backend/.env | cut -d '=' -f2)"

echo "DONE"

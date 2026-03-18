#!/bin/bash
# Full system audit for production. Run on server via SSH.
# Usage: bash scripts/server-infrastructure-audit.sh
# Or: ssh root@server 'cd /var/www/siteaacess.store && bash -s' < scripts/server-infrastructure-audit.sh
#
# Does NOT modify application logic, database, or parser. Analysis only.

set -e
FRONTEND="/var/www/siteaacess.store"
BACKEND="/var/www/online-parser.siteaacess.store"

echo "=============================================="
echo "STEP 1 — REPOSITORIES"
echo "=============================================="

echo "--- Frontend: $FRONTEND ---"
cd "$FRONTEND"
echo "git status:"
git status -sb 2>/dev/null || echo "(not a git repo or error)"
echo "git branch:"
git branch 2>/dev/null || true
echo "git log -5:"
git log -5 --oneline 2>/dev/null || true
echo "git remote -v:"
git remote -v 2>/dev/null || true
echo ""

echo "--- Backend: $BACKEND ---"
cd "$BACKEND"
echo "git status:"
git status -sb 2>/dev/null || echo "(not a git repo or error)"
echo "git branch:"
git branch 2>/dev/null || true
echo "git log -5:"
git log -5 --oneline 2>/dev/null || true
echo "git remote -v:"
git remote -v 2>/dev/null || true
echo ""

echo "=============================================="
echo "STEP 2 — FRONTEND BUILD STRUCTURE"
echo "=============================================="
cd "$FRONTEND"
echo "ls -la:"
ls -la 2>/dev/null || true
echo ""
echo "ls -la dist:"
ls -la dist 2>/dev/null || echo "dist/ missing or error"
echo ""
echo "ls -la dist/assets:"
ls -la dist/assets 2>/dev/null || echo "dist/assets/ missing or error"
echo ""
echo "dist/index.html exists?"
[ -f dist/index.html ] && echo "YES" || echo "NO"
echo "dist/assets/index-*.js exists?"
ls dist/assets/index-*.js 2>/dev/null && echo "YES" || echo "NO"
echo ""
echo "Bundle name (grep dist/index.html):"
grep -oE 'index-[^.]+\.js' dist/index.html 2>/dev/null || echo "(could not extract)"
echo ""

echo "=============================================="
echo "STEP 3 — NGINX CONFIGURATION"
echo "=============================================="
echo "Active config for siteaacess.store:"
grep -l "siteaacess.store" /etc/nginx/sites-enabled/* 2>/dev/null || true
grep -l "siteaacess.store" /etc/nginx/conf.d/*.conf 2>/dev/null || true
echo ""
echo "server_name and root for siteaacess.store:"
(grep -A20 "server_name.*siteaacess.store" /etc/nginx/sites-enabled/* 2>/dev/null || grep -A20 "siteaacess.store" /etc/nginx/conf.d/*.conf 2>/dev/null) | grep -E "server_name|root " || true
echo ""
echo "Expected root: /var/www/siteaacess.store/dist"
echo "If root is /var/www/siteaacess.store (no /dist) → DEPLOYMENT MISCONFIGURATION"
echo ""

echo "=============================================="
echo "STEP 5 — SPA ROUTING (try_files)"
echo "=============================================="
(grep -A30 "server_name.*siteaacess.store" /etc/nginx/sites-enabled/* 2>/dev/null || true) | grep -A5 "location /" | head -20
echo ""

echo "=============================================="
echo "STEP 8 — BACKEND STABILITY"
echo "=============================================="
echo "supervisor status:"
supervisorctl status 2>/dev/null || echo "(supervisor not available)"
echo ""
echo "Redis (backend .env):"
grep -E "^REDIS" "$BACKEND/.env" 2>/dev/null | sed 's/=.*/=***/' || echo "(no .env or no REDIS)"
echo "DB (backend .env):"
grep -E "^DB_" "$BACKEND/.env" 2>/dev/null | sed 's/=.*/=***/' || echo "(no .env or no DB_)"
echo ""

echo "=============================================="
echo "AUDIT SCRIPT END — paste output into SERVER_INFRASTRUCTURE_AUDIT.md"
echo "=============================================="

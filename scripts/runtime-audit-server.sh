#!/bin/bash
# Run on server: bash /var/www/siteaacess.store/scripts/runtime-audit-server.sh
# Or: ssh root@server 'bash -s' < scripts/runtime-audit-server.sh
# Collects: bundle in dist, index.html content, nginx root, git state.
# No code modifications.

set -e
BASE="${1:-/var/www/siteaacess.store}"

echo "=== RUNTIME AUDIT (server) ==="
echo "BASE=$BASE"
echo ""

echo "--- 1) Bundle filename on server (from dist/index.html) ---"
if [ -f "$BASE/dist/index.html" ]; then
  grep -oE 'src="[^"]*index-[^"]+\.js"' "$BASE/dist/index.html" || true
  grep -oE 'index-[^.]+\.js' "$BASE/dist/index.html" || true
else
  echo "File missing: $BASE/dist/index.html"
fi
echo ""

echo "--- 2) List dist/assets/index-*.js ---"
ls -la "$BASE/dist/assets/index-"*.js 2>/dev/null || echo "No dist/assets/index-*.js"
echo ""

echo "--- 3) index.html in repo root (if nginx root has no /dist) ---"
if [ -f "$BASE/index.html" ]; then
  grep -oE 'index-[^.]+\.js' "$BASE/index.html" || true
else
  echo "No $BASE/index.html"
fi
ls -la "$BASE/assets/index-"*.js 2>/dev/null || echo "No $BASE/assets/index-*.js"
echo ""

echo "--- 4) Nginx root for siteaacess.store ---"
grep -l "siteaacess.store" /etc/nginx/sites-enabled/* 2>/dev/null | head -1 | xargs grep "root " 2>/dev/null || true
grep -l "siteaacess.store" /etc/nginx/conf.d/*.conf 2>/dev/null | head -1 | xargs grep "root " 2>/dev/null || true
echo ""

echo "--- 5) Git (latest commit, branch) ---"
cd "$BASE" && git log -1 --oneline 2>/dev/null && git status -sb 2>/dev/null || echo "Not a git repo or error"
echo ""

echo "--- 6) HTTP response for /person (redirect?) ---"
curl -sI "https://siteaacess.store/person" 2>/dev/null | head -5 || curl -sI "http://localhost/person" 2>/dev/null | head -5 || echo "curl failed"

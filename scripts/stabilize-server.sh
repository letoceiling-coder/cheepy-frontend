#!/bin/bash
# Run on production server to stabilize deployment infrastructure.
# Usage: sudo bash /var/www/siteaacess.store/scripts/stabilize-server.sh
#
# Does NOT change application logic, parser, or database.
# Only: nginx config, deploy script, git sync, frontend build, verification.

set -e
FRONTEND="/var/www/siteaacess.store"
BACKEND="/var/www/online-parser.siteaacess.store"

echo "===== STABILIZATION START ====="

# STEP 1 — detect and fix nginx root (frontend site only: root .../siteaacess.store)
echo "--- STEP 1: Nginx config ---"
NGINX_CONF=""
for f in /etc/nginx/sites-enabled/* /etc/nginx/conf.d/*.conf; do
  [ -f "$f" ] 2>/dev/null || continue
  grep -q "root /var/www/siteaacess.store" "$f" 2>/dev/null && { NGINX_CONF="$f"; break; }
done
if [ -z "$NGINX_CONF" ]; then
  echo "WARN: No nginx config found for siteaacess.store"
else
  echo "Config: $NGINX_CONF"
  if grep -q "root /var/www/siteaacess.store;" "$NGINX_CONF" && ! grep -q "root /var/www/siteaacess.store/dist;" "$NGINX_CONF"; then
    sed -i.bak 's|root /var/www/siteaacess.store;|root /var/www/siteaacess.store/dist;|' "$NGINX_CONF"
    echo "Fixed: root -> .../dist"
  else
    echo "Root already points to .../dist or not found"
  fi
  if ! grep -q 'location = /index.html' "$NGINX_CONF"; then
    printf '\n    location = /index.html {\n        add_header Cache-Control "no-cache, no-store, must-revalidate";\n    }\n' > /tmp/nginx-index-location.txt
    sed -i.bak '/index index.html;/r /tmp/nginx-index-location.txt' "$NGINX_CONF"
    rm -f /tmp/nginx-index-location.txt
    echo "Added location = /index.html with no-cache"
  else
    echo "location = /index.html (no-cache) already present"
  fi
  if ! grep -A2 "location /" "$NGINX_CONF" | grep -q "try_files"; then
    echo "WARN: Ensure 'location / { try_files \$uri \$uri/ /index.html; }' exists in server block for siteaacess.store"
  else
    echo "SPA try_files present"
  fi
  # Remove backup configs from sites-enabled to avoid "duplicate listen" (nginx loads all)
  rm -f /etc/nginx/sites-enabled/*.bak /etc/nginx/sites-enabled/*.bak2 2>/dev/null || true
  nginx -t && systemctl reload nginx && echo "Nginx reloaded"
fi

# STEP 2 — SPA fallback already checked above; repo config has it

# STEP 3 — deploy script (single source: deploy/deploy-cheepy.sh)
echo "--- STEP 3: Deploy script ---"
ln -sf "$FRONTEND/deploy/deploy-cheepy.sh" /var/www/deploy-cheepy.sh
chmod +x /var/www/deploy-cheepy.sh
echo "Symlink: /var/www/deploy-cheepy.sh -> $FRONTEND/deploy/deploy-cheepy.sh"

# STEP 4 — sync repositories
echo "--- STEP 4: Git sync ---"
cd "$FRONTEND" && git fetch origin && git reset --hard origin/main && echo "Frontend synced"
cd "$BACKEND"  && git fetch origin && git reset --hard origin/main && echo "Backend synced"

# STEP 5 — rebuild frontend (index.html must exist for Vite entry)
echo "--- STEP 5: Frontend build ---"
cd "$FRONTEND"
npm install
npm run build
ls -la dist
ls -la dist/assets/index-*.js || true
echo "Bundle name: $(grep -oE 'index-[^.]+\.js' dist/index.html 2>/dev/null || echo '?')"

# STEP 5b — after build: rename dev index.html in repo root so nginx never serves it if root were wrong
echo "--- STEP 5b: Repo root index.html ---"
if [ -f "$FRONTEND/index.html" ] && grep -q '/src/main.tsx' "$FRONTEND/index.html" 2>/dev/null; then
  mv "$FRONTEND/index.html" "$FRONTEND/index.html.source.dev"
  echo "Renamed index.html -> index.html.source.dev (dev entry, not for production)"
else
  echo "No dev index.html in repo root or already renamed"
fi

# STEP 6 — verify nginx serves dist (already set in step 1)
echo "--- STEP 6: Nginx serves dist ---"
grep -oE 'index-[^.]+\.js' "$FRONTEND/dist/index.html" 2>/dev/null || true

# STEP 7 — test routes
echo "--- STEP 7: Route tests ---"
for path in / /person /person/dashboard /cart /account; do
  code=$(curl -sI -o /dev/null -w "%{http_code}" "https://siteaacess.store$path" 2>/dev/null || echo "000")
  echo "  $path -> $code"
done

# STEP 8 — backend workers
echo "--- STEP 8: Supervisor ---"
supervisorctl status 2>/dev/null || echo "supervisorctl not available"

echo "===== STABILIZATION END ====="

#!/usr/bin/env bash
set -eu
echo "=== CRM page (expect 200) ==="
curl -sS -o /tmp/crm_map.html -w "HTTP %{http_code}\n" "https://siteaacess.store/crm/catalog/mapping"
echo "=== First script asset from index ==="
grep -oE 'src="/assets/[^"]+\.js"' /tmp/crm_map.html | head -3 || true
JS=$(grep -oE '/assets/[^"]+\.js' /tmp/crm_map.html | head -1)
if [ -n "$JS" ]; then
  echo "=== Asset HEAD https://siteaacess.store$JS ==="
  curl -sSI "https://siteaacess.store$JS" | head -5
fi
echo "=== Suggestions API without auth (expect 401) ==="
curl -sS -o /dev/null -w "HTTP %{http_code}\n" "https://online-parser.siteaacess.store/api/v1/admin/catalog/mapping/suggestions?limit=5"
echo "=== Category-mapping GET without auth (expect 401) ==="
curl -sS -o /dev/null -w "HTTP %{http_code}\n" "https://online-parser.siteaacess.store/api/v1/admin/catalog/category-mapping?per_page=5"
echo "=== API up ==="
curl -sS -o /dev/null -w "HTTP %{http_code}\n" "https://online-parser.siteaacess.store/api/v1/up" || true

#!/usr/bin/env bash
set -eu
cd /var/www/online-parser.siteaacess.store
TOKEN=$(php artisan tinker --execute='
$u = \App\Models\AdminUser::where("is_active", true)->orderBy("id")->first();
if (!$u) { echo ""; exit; }
$secret = config("jwt.secret") ?: ("fallback-" . config("app.key"));
$payload = ["sub" => $u->id, "email" => $u->email, "role" => $u->role, "iat" => time(), "exp" => time() + 3600];
echo \Firebase\JWT\JWT::encode($payload, $secret, "HS256");
')
if [ -z "$TOKEN" ]; then echo "NO_ADMIN_USER"; exit 1; fi
echo "=== GET suggestions (expect 200 JSON) ==="
curl -sS -o /tmp/sug.json -w "HTTP %{http_code}\n" -H "Authorization: Bearer $TOKEN" -H "Accept: application/json" \
  "https://online-parser.siteaacess.store/api/v1/admin/catalog/mapping/suggestions?limit=3"
head -c 400 /tmp/sug.json; echo
echo "=== GET category-mapping mapped (expect 200) ==="
curl -sS -o /tmp/map.json -w "HTTP %{http_code}\n" -H "Authorization: Bearer $TOKEN" -H "Accept: application/json" \
  "https://online-parser.siteaacess.store/api/v1/admin/catalog/category-mapping?per_page=5&status=mapped"
head -c 400 /tmp/map.json; echo
echo "=== POST remap test: pick first mapping row if any ==="
MID=$(php artisan tinker --execute='$m = \Illuminate\Support\Facades\DB::table("category_mapping")->orderBy("id")->first(); echo $m ? $m->id : "";')
if [ -z "$MID" ]; then echo "NO_MAPPING_ROW"; exit 0; fi
read -r DCID CCID <<< "$(php artisan tinker --execute='$m = \Illuminate\Support\Facades\DB::table("category_mapping")->orderBy("id")->first(); echo $m->donor_category_id." ".$m->catalog_category_id;')"
echo "donor=$DCID catalog=$CCID"
NEWCAT=$(php artisan tinker --execute='$c = \Illuminate\Support\Facades\DB::table("catalog_categories")->where("id", "!=", 0)->orderBy("id")->value("id"); echo $c ? $c : "";')
if [ -z "$NEWCAT" ] || [ "$NEWCAT" = "$CCID" ]; then NEWCAT=$CCID; fi
echo "POST same catalog (no-op remap) donor=$DCID cat=$CCID"
curl -sS -o /tmp/post.json -w "HTTP %{http_code}\n" -H "Authorization: Bearer $TOKEN" -H "Accept: application/json" -H "Content-Type: application/json" \
  -X POST "https://online-parser.siteaacess.store/api/v1/admin/catalog/category-mapping" \
  -d "{\"donor_category_id\":$DCID,\"catalog_category_id\":$CCID,\"confidence\":99,\"is_manual\":true}"
head -c 500 /tmp/post.json; echo

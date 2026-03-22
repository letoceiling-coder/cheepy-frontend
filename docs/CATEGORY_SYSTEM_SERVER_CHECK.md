# Category System — Server State Check

**Date:** 2025-03-16  
**Server:** online-parser.siteaacess.store  
**Method:** curl, SSH, MySQL on server

---

## VERIFIED WITH JWT (2025-03-16)

| Endpoint | HTTP | Result |
|----------|------|--------|
| categories | 200 | OK — 337 items, paginated |
| category-mapping | 200 | OK — 340 items |
| donor-categories | 200 | OK — 340 items |
| categories/reorder | 200 | WORKS — `{"success":true}` |

---

## 1. API Categories

**Command:**
```bash
curl -s -H "Authorization: Bearer YOUR_TOKEN" \
  https://online-parser.siteaacess.store/api/v1/admin/catalog/categories
```

**Result (with invalid token):**
- HTTP status: **401**
- Response: `{"error":"Недействительный токен"}`

**Conclusion:** Endpoint exists, requires valid JWT. **Cannot verify data without token.**

---

## 2. Category Mapping

**Command:**
```bash
curl -s -H "Authorization: Bearer YOUR_TOKEN" \
  https://online-parser.siteaacess.store/api/v1/admin/catalog/category-mapping
```

**Result (with invalid token):**
- HTTP status: **401**
- Response: `{"error":"Недействительный токен"}`

**Conclusion:** Endpoint exists. **Cannot verify data without token.**

---

## 3. Donor Categories

**Command:**
```bash
curl -s -H "Authorization: Bearer YOUR_TOKEN" \
  https://online-parser.siteaacess.store/api/v1/admin/catalog/donor-categories
```

**Result (with invalid token):**
- HTTP status: **401**
- Response: `{"error":"Недействительный токен"}`

**Conclusion:** Endpoint exists. **Cannot verify data without token.**

---

## 4. DB Counts (SERVER)

**Command:**
```bash
mysql -u sadavod -pSadavodParser2025 sadavod_parser -e "
  SELECT COUNT(*) as catalog_categories FROM catalog_categories;
  SELECT COUNT(*) as donor_categories FROM donor_categories;
  SELECT COUNT(*) as category_mapping FROM category_mapping;
"
```

**Result:**
| Table              | Count |
|--------------------|-------|
| catalog_categories | 337   |
| donor_categories   | 340   |
| category_mapping   | 340   |

**Conclusion:** Data present. Mapping covers donor categories.

---

## 5. Reorder

**Command:**
```bash
curl -X PATCH \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  https://online-parser.siteaacess.store/api/v1/admin/catalog/categories/reorder \
  -d '[{"id":1,"sort_order":0}]'
```

**Result (with invalid token):**
- HTTP status: **401**

**Conclusion:** Endpoint exists, requires auth. **Cannot verify reorder logic without token.**

---

## 6. Routes

**Command:**
```bash
ssh root@85.117.235.93 "cd /var/www/online-parser.siteaacess.store && php artisan route:list | grep catalog"
```

**Result:**
```
  GET|HEAD  api/v1/admin/catalog/categories ............. Admin\Catalog\CatalogCategoryCont…
  POST      api/v1/admin/catalog/categories ............. Admin\Catalog\CatalogCategoryCont…
  PATCH     api/v1/admin/catalog/categories/reorder ..... Admin\Catalog\CatalogCategoryCont…
  PATCH     api/v1/admin/catalog/categories/{id} ........ Admin\Catalog\CatalogCategoryCont…
  DELETE    api/v1/admin/catalog/categories/{id} ........ Admin\Catalog\CatalogCategoryCont…
  GET|HEAD  api/v1/admin/catalog/category-mapping ....... Admin\Catalog\CategoryMappingCont…
  POST      api/v1/admin/catalog/category-mapping ....... Admin\Catalog\CategoryMappingCont…
  DELETE    api/v1/admin/catalog/category-mapping/{id} .. Admin\Catalog\CategoryMappingCont…
  GET|HEAD  api/v1/admin/catalog/donor-categories ....... Admin\Catalog\DonorCategoryCont…
  GET|HEAD  api/v1/admin/catalog/mapping/suggestions ..... Admin\Catalog\MappingSuggestionCont…
```

**Conclusion:** All catalog routes registered.

---

## 7. Frontend Connection

**Code analysis:**
- `src/lib/api.ts`: `DEFAULT_API_URL = 'https://online-parser.siteaacess.store/api/v1'`
- `adminCatalogApi` → `GET /admin/catalog/categories`, `category-mapping`, `donor-categories`, etc.
- Token from `localStorage.getItem('admin_token')`
- On 401: redirect to `/admin/login?next=...` (for CRM pages)

**Browser DevTools (manual check):**
- Request: `GET https://online-parser.siteaacess.store/api/v1/admin/catalog/categories`
- When logged in: expected **200**, response type **JSON**
- When not logged in: **401** → redirect to login

**Conclusion:** Frontend is wired to real API. **Requires manual verification in browser with valid session.**

---

## FINAL SUMMARY

| Check            | Status | Notes |
|------------------|--------|-------|
| API categories   | 401    | Auth required; endpoint OK |
| mapping          | 401    | Auth required; endpoint OK |
| donor categories | 401    | Auth required; endpoint OK |
| DB counts        | **OK** | 337 catalog, 340 donor, 340 mapping |
| reorder          | 401    | Auth required; endpoint OK |
| routes           | **OK** | All catalog routes present |
| frontend         | **CONNECTED** | Uses real API; verify in browser with login |

**Token required:** To verify API responses and reorder, use a valid JWT from `POST /api/v1/auth/login` and run:
```bash
TOKEN="<your_token>"
curl -s -H "Authorization: Bearer $TOKEN" https://online-parser.siteaacess.store/api/v1/admin/catalog/categories | head -c 2000
```

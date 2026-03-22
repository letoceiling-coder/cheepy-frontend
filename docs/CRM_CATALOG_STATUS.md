# CRM & Catalog — Project Status

**Purpose:** Handoff document for the next session. Captures implemented behavior, known issues, and priorities.  
**Last updated:** 2026-03-18

---

## 1. Project overview

### CRM system

Browser-based CRM area under **`/crm`**, protected by the same Laravel JWT as the admin panel. Uses React Router, TanStack Query, and shared API client (`src/lib/api.ts`). Sidebar navigation includes catalog-related sections (e.g. mapping, categories).

### Catalog system

**Catalog categories** are managed in Laravel (`catalog_categories` table, admin API under `/admin/catalog/...`). The CRM **Categories** page consumes **`GET /admin/catalog/categories`** and supports editing active state and name via **`PATCH /admin/catalog/categories/{id}`**.

### Category management (CRM)

**Route:** `/crm/categories`  

Flat list from API is rendered as a **tree** (`parent_id`, `sort_order`). Users can **reorder siblings** via drag-and-drop (grip handle only); frontend calls **`PATCH /admin/catalog/categories/reorder`** with a JSON array `[{ id, sort_order }, ...]`. **Toggle** `is_active` and **edit name** (modal) are implemented.

### Mapping system

**Route:** `/crm/catalog/mapping`  

Connects donor categories to catalog categories using **mapping suggestions** and **category mapping** list APIs. Supports filters by confidence, **per-row apply** and **bulk apply** (high score), with payloads including `confidence` and `is_manual` where applicable.

---

## 2. What is implemented (facts only)

### AUTH

- Admin auth working (login, JWT).
- **CRM auth guard** working (`CrmAuthGuard`): checks token before rendering `/crm` routes.
- Token stored in **`localStorage`** key **`admin_token`** (same as admin).
- Unauthenticated access to **`/crm`** → redirect to **`/admin/login?next=...`** (return path preserved).

### API

- **`BASE_URL`:** resolves from `VITE_API_URL`; default production API is **`https://online-parser.siteaacess.store/api/v1`** (path includes **`/api/v1`**).
- **Bearer** token attached to protected requests via `Authorization` header.
- **401** handling: e.g. redirect to admin login when on `/crm`.

### MAPPING PAGE

- **Route:** **`/crm/catalog/mapping`**
- **Suggestions** API connected (`GET` mapping suggestions).
- **Category mapping** list connected (`GET` category-mapping).
- **Bulk apply** implemented (e.g. high-score batch).
- **Per-row apply** implemented with selected catalog from dropdown; payload includes **`confidence`** (score) and **`is_manual: true`** for manual apply.
- **Score badges** (green / yellow / red style by threshold).
- **Status:** Mapped vs not mapped (from mapping list vs suggestions).

### CATEGORIES PAGE

- **Route:** **`/crm/categories`**
- **Real API** only — CRM category mocks removed from this flow.
- **Tree** by `parent_id` and `sort_order`.
- **Drag & drop** within same level (grip handle); row/toggle/edit do not start drag.
- **Reorder** request implemented on **frontend** (`PATCH .../categories/reorder`).
- **`is_active`** toggle → **`PATCH .../categories/{id}`** with `{ is_active }`.
- **Edit name** → modal → **`PATCH .../categories/{id}`** with `{ name }`.
- Toasts: success **«Сохранено»**, errors **«Ошибка»** (and related messages); query invalidation after success.

### DEPLOY SYSTEM

- **Frontend (production):** repo on server under **`/var/www/siteaacess.store`** — **`git pull` / `git reset --hard origin/main`**, **`rm -rf dist`**, **`npm install`**, **`npm run build`**, **`systemctl reload nginx`**. Nginx serves **`dist/`**.
- **Backend:** Laravel app (e.g. **`/var/www/online-parser.siteaacess.store`**, remote may be **`cheepy-backend`**) — **`git pull`**, migrations, **`php artisan`** cache/route/config clears.
- **Strict rule:** any code or config change must be followed by **deploy**; reporting “done” without production update is invalid.

---

## 3. Current problems (real issues only)

### BACKEND

- **`PATCH /admin/catalog/categories/reorder`** may return **500** on production.
- **Likely causes:** fix not deployed on Laravel app, or historical **route conflict** (`categories/{id}` catching `reorder` before a dedicated route / missing **`whereNumber('id')`**).
- **Reference implementation** exists in this repo under **`docs/infrastructure/laravel/`** (controller `reorder`, routes order, validation, transaction) but must be **copied or merged into the live backend repository** and deployed — it is **not** applied by frontend-only deploy.

### MAPPING UX

- If **all** suggestion rows are **already mapped**, the table can feel **locked** (mapped rows show disabled dropdown / no apply).
- **Dropdown disabled** for mapped rows limits **remap** without removing mapping first elsewhere.
- **No explicit “remap”** or **“sync with donor”** control in UI.
- **No filter** toggle for **unmapped only** vs **mapped only** on the mapping page.

### MISSING FEATURES

- **No** documented live endpoint in app spec: **`POST /admin/catalog/mapping/sync`** (donor/catalog sync from CRM — not implemented in described UI).
- **No** first-class **remap** flow (change mapping from CRM without backend DELETE + recreate or dedicated API).
- **No** mapping list **filters** (unmapped / mapped) in UI.

---

## 4. What must be done next (priority)

### PRIORITY 1 — CRITICAL

1. **Deploy backend reorder fix** from **`docs/infrastructure/laravel/`** into **`cheepy-backend`** (or equivalent), register routes correctly, deploy to server.
2. **Verify** **`PATCH /api/v1/admin/catalog/categories/reorder`** returns **200** with valid JWT and body (e.g. curl or CRM drag).

### PRIORITY 2

- Improve **mapping UX:**
  - Allow **dropdown** (or action) for **mapped** rows if product should support **remap**.
  - Add **«Обновить»** / refresh for suggestions + mappings.
  - Define **remap** behavior (API: PATCH existing mapping vs DELETE + POST).

### PRIORITY 3

- Add **sync** control and backend **`POST /admin/catalog/mapping/sync`** (or align name with existing Laravel routes) once API contract is fixed.

### PRIORITY 4

- **Categories:** optional future work — drag **between** levels, polish UX.

---

## 5. Deploy rule (mandatory)

**ANY CHANGE MUST BE DEPLOYED.**

| Layer | Steps |
|--------|--------|
| **Frontend** | `git add` / `git commit` / **`git push`** → on server: **`git pull`** (or **`reset --hard origin/main`**), **`npm run build`**, **`systemctl reload nginx`**. |
| **Backend** | **`git push`** → on server: **`git pull`**, **`php artisan migrate --force`** (if migrations), **`php artisan optimize:clear`** (and route/config/cache clear as needed). |

**If not deployed → task is not done.**

Also documented in **`.cursorrules`** and **`docs/DEPLOYMENT.md`** (PRODUCTION FIRST).

---

## 6. Quick reference

| Item | Value |
|------|--------|
| CRM mapping route | `/crm/catalog/mapping` |
| CRM categories route | `/crm/categories` |
| Token key | `localStorage.admin_token` |
| Admin catalog categories | `GET/PATCH /admin/catalog/categories`, `PATCH .../reorder` |
| Admin mapping | `GET /admin/catalog/mapping/suggestions`; `GET/POST /admin/catalog/category-mapping` |
| Frontend prod path | `/var/www/siteaacess.store` |
| Backend prod path (typical) | `/var/www/online-parser.siteaacess.store` |

---

*End of handoff document.*

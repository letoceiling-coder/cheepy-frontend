# API Architecture

**Document type:** API layer design for the marketplace (no code)  
**Audience:** Backend leads, frontend leads  
**Context:** Aligns with PLATFORM_MASTER_ARCHITECTURE.md, IDENTITY_SYSTEM_ARCHITECTURE.md, ORDER_SYSTEM_ARCHITECTURE.md, CMS_CONTENT_ARCHITECTURE.md, CRM_OPERATION_ARCHITECTURE.md, and INFRASTRUCTURE_ARCHITECTURE.md. Defines API domains, authentication, URL structure, authorization, versioning, and rate limiting.

---

## STEP 1 — API DOMAINS

### 1.1 public_api

- **Responsibility:** Serves **unauthenticated** or **optionally identified** storefront traffic. Catalog browsing, search, product and category pages, menus, banners, CMS pages, delivery methods and rates (for a given address), and payment methods list. No cart mutation, no checkout, no order history, no PII. May accept a **session or guest token** only to personalize (e.g. “your recently viewed”) or to merge cart later; identity is not required. Used by the storefront (home, category, product, search) and by headless or mobile clients before login.
- **Data scope:** Only **approved and visible** products (moderation_status = approved, visibility active); catalog_categories; menus and banners; CMS published pages and blocks; shipping zones and delivery_rates for display; payment_methods (active). No orders, no seller balance, no admin or CRM data.

### 1.2 buyer_api

- **Responsibility:** Serves **logged-in buyers** (user_id from session or token). Cart (create, read, update, delete cart and cart_items); checkout (validate cart, create order, attach payment); order history (list orders, order detail, shipments, tracking); addresses (user_addresses CRUD); profile (user_profiles, optional user update); returns (create return request, list returns). May also expose “wishlist” or “favorites” if modeled. All resources are **scoped to the authenticated user**: cart by user_id (or session when guest); orders by buyer_user_id; addresses and profile by user_id.
- **Data scope:** User’s own cart, orders, addresses, profile, returns. No access to other buyers’ data, no seller or admin data.

### 1.3 seller_api

- **Responsibility:** Serves **sellers** (user with role seller, linked to one or more sellers via seller_accounts). Products (CRUD for products where product.seller_id in the user’s linked seller_ids); product variants, prices, stock, media; orders and order_items **filtered by seller_id** (only lines that belong to the seller); shipments (list and update status for the seller’s shipments); tracking (add tracking_code, view tracking_updates); balance (seller_balance, seller_transactions); payout (payout_requests, seller_wallets); verification (seller_documents upload, status). Every request that touches seller-scoped data must **restrict to seller_id(s)** from seller_accounts for that user. Used by the seller dashboard.
- **Data scope:** Products, orders, shipments, balance, payouts, and documents **only for the seller(s)** the user is linked to. No access to other sellers’ data or to platform-wide config (commission rules, delivery_methods) except where explicitly exposed read-only (e.g. “list delivery methods” for shipment creation).

### 1.4 admin_api

- **Responsibility:** Serves **platform administrators** (user with role admin). Full catalog (catalog_categories, donor_categories, category_mapping, products, brands, sellers); attribute engine (attributes, category_attribute_schema, product_attributes); parser (parser_jobs, parser_settings, parser_state, trigger run); orders and payments (all orders, overrides); financial (commission_rules, platform_commissions, seller_balance, payout_requests, payout_batches); delivery (delivery_methods, shipping_zones, delivery_rates); identity (users, user_roles, seller_accounts, seller_verification); CMS (pages, page_versions, page_blocks, menus, banners, publish workflow); system config. Access is gated by **admin role** (and optionally fine-grained permissions). Used by the admin panel.
- **Data scope:** Platform-wide; no per-seller or per-buyer scope except when viewing a specific entity. Admin can act on any order, any seller, any product, any user (within permissions).

### 1.5 crm_api

- **Responsibility:** Serves **CRM operators and support** (user with role crm_operator or support). Moderation queues (product_moderation_queue, seller_verification_queue — list, assign, approve/reject); crm_customers (list, view, notes, tasks); crm_notes (CRUD for notes on customer, order, return, seller, product); crm_tasks (CRUD, assign, complete); orders and returns (view, update status, create return or refund on behalf of buyer); reports (sales_reports, seller_reports, product_reports — read). Access is gated by **crm_operator or support role** and **permissions** (e.g. order.view, order.edit, return.approve, product.moderate). Support typically has a **subset** of permissions (e.g. view order, create return, view contact); CRM operator may have more (e.g. moderate product, verify seller). Used by the CRM panel and support tools.
- **Data scope:** Moderation queues, customers, notes, tasks, orders and returns (read and limited write), reports. No parser config, no commission rule edit, no user role assignment unless permission granted.

### 1.6 internal_api

- **Responsibility:** Used by **backend services** (workers, schedulers, event dispatcher) or **trusted internal clients**. Not exposed to the internet or to frontend. Examples: enqueue job, mark event_delivery completed, call search index update, call email send. Authenticated by **service token** or **machine credential** (shared secret or JWT with issuer “internal”). No user context; may carry correlation_id or job_id for tracing. Rate limiting is typically relaxed or by service.
- **Data scope:** Depends on the operation (e.g. index product, send email). No direct exposure of PII or financial data beyond what the operation needs.

### 1.7 webhooks

- **Responsibility:** **Inbound** calls from **external systems** (payment gateway, carrier, etc.) to notify the platform of an event (e.g. payment captured, refund completed, tracking update). The platform does not authenticate the caller with a user session; instead it **verifies the request** using a **signed secret** (e.g. HMAC of payload with webhook secret, or signature header from the provider). Each webhook endpoint is tied to a topic or provider (e.g. /api/webhooks/payment/yookassa, /api/webhooks/tracking/dhl). Used by gateways and carriers to push payment and delivery events.
- **Data scope:** Inbound only; payload is provider-specific. Handler updates orders, payments, shipments, or domain_events according to PLATFORM_EVENT_ARCHITECTURE and ORDER_SYSTEM_ARCHITECTURE.

---

## STEP 2 — AUTHENTICATION

| API domain    | Authentication method | Notes |
|---------------|------------------------|--------|
| **public_api** | **None** or **optional session/guest token** | No auth required for catalog, search, menus, CMS. Optional cookie or header (session_id, guest_token) for “recently viewed” or cart merge; server does not require identity. |
| **buyer_api**  | **User session or bearer token** | Session cookie (e.g. session_id from user_sessions) or Authorization: Bearer &lt;token&gt; (JWT or opaque token). Token resolves to user_id; must have role buyer (or default registered user). Guest cart uses session_id without user_id; buyer_api cart endpoints accept either (user_id when logged in, session_id when guest). |
| **seller_api** | **User token + seller scope** | Same as buyer (session or Bearer token). User must have role **seller** and at least one **seller_accounts** row. Request may include **X-Seller-Id** or default to primary seller; server checks seller_id in seller_accounts for that user. |
| **admin_api**  | **User token + admin role** | Session or Bearer token. User must have role **admin**. Optional: permission check per endpoint (e.g. payout.approve). |
| **crm_api**    | **User token + crm role** | Session or Bearer token. User must have role **crm_operator** or **support**. Authorization uses **permissions** (e.g. order.view, return.approve); support has fewer permissions than crm_operator. |
| **internal_api** | **Service token** | Fixed secret (e.g. API key in header X-Internal-Token) or JWT with issuer “internal” and audience “api”. No user context. |
| **webhooks**   | **Signed secret** | No user. Verifier checks signature (e.g. X-Signature: HMAC-SHA256(payload, webhook_secret)) or provider-specific header. Reject if signature invalid or timestamp too old (replay protection). |

---

## STEP 3 — API STRUCTURE

### 3.1 Base URL and version prefix

- All APIs (except possibly webhooks) use a **versioned prefix**: `/api/v1/`. Webhooks may be `/api/webhooks/` without version if provider contracts are stable. Base URL is the application root (e.g. `https://api.example.com`).

### 3.2 URL structure by domain

- **public_api:** `/api/v1/public/`  
  - **Typical endpoints (conceptual):**  
    - `GET /api/v1/public/categories` (tree or list)  
    - `GET /api/v1/public/categories/:slug`  
    - `GET /api/v1/public/products` (search, filters, category, sort, pagination)  
    - `GET /api/v1/public/products/:id` (or `:slug`)  
    - `GET /api/v1/public/search` (q, category, filters, sort)  
    - `GET /api/v1/public/menus/:menu_key`  
    - `GET /api/v1/public/banners` (query: placement, page_key)  
    - `GET /api/v1/public/pages/:page_key` (published page + blocks)  
    - `GET /api/v1/public/delivery/methods` (or by zone)  
    - `GET /api/v1/public/delivery/rates` (zone, method, weight/total)  
    - `GET /api/v1/public/payment-methods`  

- **buyer_api:** `/api/v1/buyer/`  
  - **Typical endpoints (conceptual):**  
    - `GET|POST|PATCH|DELETE /api/v1/buyer/cart` (and cart items)  
    - `POST /api/v1/buyer/checkout/validate`  
    - `POST /api/v1/buyer/checkout/place-order`  
    - `GET /api/v1/buyer/orders`, `GET /api/v1/buyer/orders/:id`  
    - `GET /api/v1/buyer/orders/:id/shipments`, `GET /api/v1/buyer/orders/:id/tracking`  
    - `POST /api/v1/buyer/returns`, `GET /api/v1/buyer/returns`  
    - `GET|PATCH /api/v1/buyer/profile`  
    - `GET|POST|PATCH|DELETE /api/v1/buyer/addresses`  
    - Auth: login, logout, register, refresh (may live under `/api/v1/auth` and be shared with buyer context)  

- **seller_api:** `/api/v1/seller/`  
  - **Typical endpoints (conceptual):**  
    - `GET|POST|PATCH|DELETE /api/v1/seller/products` (scoped to seller)  
    - `GET|PATCH /api/v1/seller/products/:id/variants`, prices, stock, media  
    - `GET /api/v1/seller/orders` (order_items where seller_id = current seller)  
    - `GET /api/v1/seller/shipments`, `PATCH /api/v1/seller/shipments/:id` (status, tracking_code)  
    - `GET /api/v1/seller/balance`, `GET /api/v1/seller/transactions`  
    - `POST /api/v1/seller/payout-requests`, `GET /api/v1/seller/payout-requests`  
    - `GET|PATCH /api/v1/seller/wallets`  
    - `POST /api/v1/seller/documents`, `GET /api/v1/seller/verification-status`  
    - Optional: `GET /api/v1/seller/reports` (seller_reports for this seller)  

- **admin_api:** `/api/v1/admin/`  
  - **Typical endpoints (conceptual):**  
    - Catalog: categories (donor, catalog, mapping), products, brands, sellers  
    - Parser: jobs, settings, state, trigger  
    - Orders: orders, payments, returns (full list, overrides)  
    - Financial: commission_rules, payouts (approve, batch), seller_balance  
    - Delivery: delivery_methods, shipping_zones, delivery_rates  
    - Identity: users, roles, seller_accounts, seller_verification, seller_documents  
    - CMS: pages, versions, blocks, menus, banners, publish  
    - Structure: resource-oriented under `/api/v1/admin/catalog/`, `/api/v1/admin/orders/`, `/api/v1/admin/parser/`, etc.  

- **crm_api:** `/api/v1/crm/`  
  - **Typical endpoints (conceptual):**  
    - `GET|PATCH /api/v1/crm/moderation/products` (queue, assign, approve/reject)  
    - `GET|PATCH /api/v1/crm/moderation/sellers` (verification queue)  
    - `GET /api/v1/crm/customers`, `GET /api/v1/crm/customers/:id`, notes, tasks  
    - `GET|PATCH /api/v1/crm/orders`, `GET|PATCH /api/v1/crm/returns`  
    - `GET /api/v1/crm/reports/sales`, seller, product  
    - `POST|GET /api/v1/crm/notes`, `POST|GET|PATCH /api/v1/crm/tasks`  

- **internal_api:** `/api/v1/internal/`  
  - **Typical endpoints (conceptual):**  
    - Job enqueue, event dispatch, search index update, email send trigger, etc.  
    - Not enumerated in full; used by workers and internal services only.  

- **webhooks:** `/api/webhooks/`  
  - **Typical paths (conceptual):**  
    - `POST /api/webhooks/payment/:provider` (e.g. yookassa, stripe)  
    - `POST /api/webhooks/tracking/:carrier` (e.g. dhl, cdek)  
    - Payload and signature are provider-specific.  

### 3.3 Summary

- Public: read-only catalog, search, CMS, delivery and payment methods.  
- Buyer: cart, checkout, orders, profile, addresses, returns (user-scoped).  
- Seller: products, orders, shipments, balance, payouts, documents (seller-scoped).  
- Admin: full platform CRUD and config.  
- CRM: moderation, customers, notes, tasks, orders/returns (limited), reports.  
- Internal: service-to-service.  
- Webhooks: inbound payment and tracking events.

---

## STEP 4 — AUTHORIZATION

### 4.1 How roles and permissions apply

- **users:** Identity from IDENTITY_SYSTEM_ARCHITECTURE. Each request that requires auth resolves the token/session to a **user_id**.
- **user_roles:** User has one or more roles (buyer, seller, admin, crm_operator, support). **API domain** is chosen by the **path** (/api/v1/buyer/, /api/v1/seller/, etc.). The server must ensure the user has the **role** that is allowed to access that domain (e.g. buyer_api requires buyer or default role; seller_api requires seller; admin_api requires admin; crm_api requires crm_operator or support).
- **permissions:** For **admin_api** and **crm_api**, fine-grained checks use **permissions** (e.g. order.view, product.moderate, seller.verify, payout.approve). User’s effective permissions = union of permissions of all their roles (from role_permissions). Before executing a sensitive action (e.g. approve payout), the API checks that the user has the required permission. **buyer_api** and **seller_api** typically do not use permission codes; they use **resource scope** (own cart/orders vs seller’s products/orders).
- **seller_accounts:** For **seller_api**, every request that touches seller-scoped data must restrict by **seller_id**. The user is allowed to act only for **seller_id(s)** present in seller_accounts for that user_id. If the client sends X-Seller-Id or a scope parameter, the server validates that (user_id, seller_id) exists in seller_accounts; otherwise uses the user’s primary or first linked seller. Products, orders, shipments, balance, payouts, and documents are filtered by this seller_id set.

### 4.2 Matrix (conceptual)

| API domain   | Required role(s)     | Scope / extra check        |
|-------------|----------------------|----------------------------|
| public_api  | None                 | —                          |
| buyer_api   | buyer (or default)   | user_id = authenticated user |
| seller_api  | seller               | seller_id in seller_accounts for user |
| admin_api   | admin                | Optional: permission per action |
| crm_api     | crm_operator, support | permission per action (support has subset) |
| internal_api| —                    | Valid service token        |
| webhooks    | —                    | Valid signature            |

### 4.3 Guest vs registered buyer

- **buyer_api** cart and checkout may accept **guest** requests when the path is “cart” or “checkout” and the client sends **session_id** or **guest_token** (cookie or header). In that case there is no user_id; cart is keyed by session_id/guest_token. Order creation for guest stores buyer_guest_email, buyer_phone; buyer_user_id is null. No access to “my orders” or “my addresses” without user token.

---

## STEP 5 — VERSIONING

### 5.1 Strategy

- **URL path versioning:** All domains (except webhooks) use a **major version** in the path: `/api/v1/`. This allows a future `/api/v2/` with breaking changes while keeping v1 stable.
- **Version semantics:** **v1** is the first stable contract. New **backward-compatible** changes (new optional fields, new endpoints) do not require a new version. **Breaking changes** (removed or renamed fields, changed behavior of existing endpoints) require a new major version (e.g. v2) or a long deprecation period and migration path for clients.
- **Webhooks:** May stay at `/api/webhooks/` without a version if the payload and signature are provider-defined and the platform adapts; or use `/api/webhooks/v1/:provider` if the platform defines a stable envelope.

### 5.2 Examples

- `/api/v1/public/products` — public product list/search.  
- `/api/v1/public/categories/:slug` — public category.  
- `/api/v1/buyer/cart` — buyer cart (requires user or guest session).  
- `/api/v1/buyer/orders` — buyer orders (requires user).  
- `/api/v1/seller/products` — seller’s products (requires seller token + seller scope).  
- `/api/v1/seller/balance` — seller balance (requires seller token).  
- `/api/v1/admin/catalog/categories` — admin catalog categories.  
- `/api/v1/admin/orders` — admin orders.  
- `/api/v1/crm/moderation/products` — CRM product moderation queue.  
- `/api/v1/crm/reports/sales` — CRM sales reports.  
- `/api/v1/internal/jobs` (or similar) — internal enqueue (service token).  
- `/api/webhooks/payment/yookassa` — payment provider webhook.

### 5.3 Header and response

- Optional: **Accept** or **X-Api-Version** header to request a version; if omitted, default to v1. Response may include **X-Api-Version: 1** for clarity. Deprecation can be signaled via header (e.g. X-Deprecated: true, Sunset: date) for endpoints that will be removed or moved to a new version.

---

## STEP 6 — RATE LIMITING

### 6.1 Purpose

- Protect the API from abuse and ensure fair use: limit the number of requests per **identifier** (IP, user_id, or client_id) per **time window**. Uses **Redis** (INFRASTRUCTURE_ARCHITECTURE) for counters and sliding or fixed windows.

### 6.2 Strategy by domain

- **public_api:** Limit by **IP** (and optionally by session/guest_token if present). Typical: e.g. 100–300 requests per minute per IP for read-only. Stricter for search or heavy listing endpoints (e.g. 30/min per IP for /public/search) to avoid scraping. Keys: `ratelimit:public:ip:{ip}:{window}` (e.g. window = 60s). Increment on request; reject with 429 if over limit.
- **buyer_api:** Limit by **user_id** (when authenticated) or by **IP** (when guest). Per user: e.g. 200/min for normal use; checkout or place-order may have a lower sub-limit (e.g. 5/min) to prevent brute or scripted orders. Keys: `ratelimit:buyer:user:{user_id}:{window}` or `ratelimit:buyer:ip:{ip}:{window}`.
- **seller_api:** Limit by **user_id** (or user_id + seller_id). E.g. 300/min per seller user. Keys: `ratelimit:seller:user:{user_id}:{window}`.
- **admin_api:** Limit by **user_id**. Higher limits (e.g. 500/min) or no limit for trusted internal IPs. Keys: `ratelimit:admin:user:{user_id}:{window}`.
- **crm_api:** Limit by **user_id**. Similar to admin; may be per role (support vs crm_operator). Keys: `ratelimit:crm:user:{user_id}:{window}`.
- **internal_api:** Limit by **service token** or by **client_id**. Relaxed (e.g. 1000/min per service) or only to prevent runaway jobs. Keys: `ratelimit:internal:service:{client_id}:{window}`.
- **webhooks:** Limit by **provider + endpoint** or by **IP** (gateway/carrier IP). E.g. 100/min per provider to avoid replay or flood. Keys: `ratelimit:webhook:{provider}:{ip}:{window}`.

### 6.3 Implementation (conceptual)

- **Redis:** For each request, key = domain + identifier + time window (e.g. minute). INCR key; set EXPIRE on first set (e.g. 60s). If count > limit, return 429 Too Many Requests and optional Retry-After header.
- **Sliding window:** Alternatively, store timestamps of recent requests in a sorted set; count in last N seconds; remove expired. More accurate but more Redis work.
- **Per-endpoint limits:** Critical endpoints (login, place-order, payout-request) may have **stricter** limits (e.g. 5/min per user) in addition to the domain limit. Key can include path or operation: `ratelimit:buyer:user:{user_id}:place-order:{window}`.
- **Response:** 429 with body (e.g. `{ "error": "rate_limit_exceeded", "retry_after": 60 }`) and header `Retry-After: 60`.

### 6.4 Alignment with infrastructure

- INFRASTRUCTURE_ARCHITECTURE states Redis is used for “rate limiting” and “session store”. This document defines **how** rate limiting is applied per API domain and which key pattern to use in Redis. No code; architecture only.

---

## STEP 7 — FINAL DOCUMENT (SUMMARY)

### 7.1 API domains (recap)

| Domain       | Responsibility | Auth |
|-------------|----------------|------|
| **public_api** | Catalog, search, CMS, menus, banners, delivery/payment methods (read-only) | None or optional session |
| **buyer_api**  | Cart, checkout, orders, profile, addresses, returns (user-scoped) | User session/token |
| **seller_api** | Products, orders, shipments, balance, payouts, documents (seller-scoped) | User token + seller scope |
| **admin_api**  | Full platform catalog, orders, financial, delivery, identity, CMS, parser | Admin role (+ permissions) |
| **crm_api**    | Moderation queues, customers, notes, tasks, orders/returns, reports | CRM/support role + permissions |
| **internal_api** | Service-to-service (jobs, events, index, email) | Service token |
| **webhooks**   | Inbound payment and tracking events from providers | Signed secret |

### 7.2 URL structure (recap)

- `/api/v1/public/*` — public.  
- `/api/v1/buyer/*` — buyer.  
- `/api/v1/seller/*` — seller.  
- `/api/v1/admin/*` — admin.  
- `/api/v1/crm/*` — CRM.  
- `/api/v1/internal/*` — internal.  
- `/api/webhooks/*` — webhooks (optionally `/api/webhooks/v1/:provider`).

### 7.3 Authorization (recap)

- **Role** gates API domain (buyer, seller, admin, crm_operator, support).  
- **Permissions** gate sensitive actions in admin and CRM (e.g. payout.approve, product.moderate).  
- **seller_accounts** restrict seller_api to seller_id(s) linked to the user.

### 7.4 Versioning (recap)

- Major version in path: `/api/v1/`. Backward-compatible changes in v1; breaking changes in a new major version or with deprecation.

### 7.5 Rate limiting (recap)

- Redis-backed counters (or sliding window) per domain and identifier (IP, user_id, service_id). Limits and key patterns defined per domain; 429 and Retry-After on exceed.

### 7.6 Dependencies

- **IDENTITY_SYSTEM_ARCHITECTURE:** users, user_sessions, user_roles, permissions, seller_accounts.  
- **ORDER_SYSTEM_ARCHITECTURE:** cart, orders, payments, returns — consumed by buyer_api and seller_api.  
- **CMS_CONTENT_ARCHITECTURE:** pages, menus, banners — consumed by public_api and admin_api.  
- **CRM_OPERATION_ARCHITECTURE:** moderation queues, crm_customers, notes, tasks, reports — consumed by crm_api.  
- **INFRASTRUCTURE_ARCHITECTURE:** Redis for rate limiting (and sessions/cache).

---

*End of API Architecture.*

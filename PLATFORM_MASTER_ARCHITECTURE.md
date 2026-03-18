# Platform Master Architecture

**Document type:** Master architecture — unified view of the marketplace platform (no code)  
**Audience:** Architects, product and engineering leads  
**Context:** Synthesizes all platform architecture documents into one overview, system map, data flow, and event flow. For detailed entity and table design, see the referenced documents.

---

## STEP 1 — PLATFORM OVERVIEW

### 1.1 What the Platform Is

The platform is a **multi-seller marketplace** that:

- **Acquires catalog data** from external sources (donor sites) via a **parser**, then normalizes and moderates it into a unified **catalog** (categories, products, attributes, brands, sellers).
- **Sells products** to **buyers** through a storefront: browse, search, cart, checkout, payment, and delivery. Orders can contain items from **multiple sellers**; each seller fulfills their own items (multi-shipment).
- **Handles money** as the **merchant of record**: buyer pays the platform; the platform takes a **commission** and credits **seller balance**; sellers receive **payouts** to their bank or wallet.
- **Manages identity**: **buyers** (guest or registered), **sellers** (linked to seller accounts and verification), **admin**, **CRM**, and **support** roles, with auth via email, phone, social, or Telegram.
- **Powers content** via a **CMS**: home, category, landing, and promo pages built from **blocks** (aligned with the frontend constructor); menus and banners for navigation and promotions.
- **Operates the business** through **CRM/Admin**: product and seller **moderation**, **customer support** (notes, tasks), and **analytics** (sales, seller, product reports).
- **Runs asynchronously** on **events** and **queues**: order created, payment captured, shipment shipped, and other domain events drive notifications, balance updates, search index, and emails via an **event bus** and **workers**.
- **Runs on shared infrastructure**: **job queues**, **workers** (parser, event, email), **schedulers**, **search index**, **cache** (Redis, page, query), and **file storage** (media, documents, product images).

### 1.2 Subsystems at a Glance

| # | Subsystem | Role |
|---|-----------|------|
| 1 | **Catalog (V2)** | Donor vs marketplace categories; category_mapping; products placed in catalog_categories. |
| 2 | **Attribute engine** | Normalize raw product attributes; category attribute schema; product_attributes for filters and PDP. |
| 3 | **Product** | products, variants, prices, stock, media, attributes; sellable SKU and parser integration. |
| 4 | **Order** | Cart, checkout, orders, order_items, status, payments, delivery, returns. |
| 5 | **Financial** | Buyer payment capture; platform commissions; seller balance; payouts and seller_wallets. |
| 6 | **Delivery** | Delivery methods, zones, rates; shipments (one per seller per order); tracking. |
| 7 | **Identity** | users, profiles, addresses, sessions, roles, permissions; seller_accounts, seller_verification, auth methods. |
| 8 | **Events** | domain_events, subscribers, handlers; async processing and integration. |
| 9 | **CMS** | pages, versions, blocks; menus, banners; publish workflow; constructor integration. |
| 10 | **CRM/Operations** | Moderation queues (product, seller); crm_customers, notes, tasks; sales/seller/product reports. |
| 11 | **Infrastructure** | jobs, workers, schedulers; search index and filters; Redis, page and query cache; file storage. |

Together they form one **marketplace**: catalog and product feed the storefront; identity identifies buyers and sellers; order and financial and delivery complete the transaction; CMS shapes the front-end experience; CRM and moderation protect quality; events and infrastructure tie everything together.

---

## STEP 2 — SYSTEM MAP

### 2.1 Catalog (CATALOG_ARCHITECTURE_V2)

- **Responsibility:** Separate **donor categories** (parser-owned) from **catalog categories** (marketplace taxonomy). **category_mapping** maps donor → catalog so products get a stable marketplace category. Products, brand_categories, and category_attribute_schema reference **catalog_categories** only.
- **Key entities:** donor_categories, catalog_categories, category_mapping, products (category_id, donor_category_id), brands, brand_categories.
- **Source doc:** CATALOG_ARCHITECTURE_V2.md

### 2.2 Attribute Engine (ATTRIBUTE_ENGINE_ARCHITECTURE)

- **Responsibility:** Normalize raw product attributes (from parser or manual) into **product_attributes** using attributes, attribute_values, mapping, synonyms, canonical values. **category_attribute_schema** defines which attributes apply per catalog category (filters, display). Feeds search facets and PDP.
- **Key entities:** attributes, attribute_values, attribute_key_mapping, attribute_synonyms, attribute_canonical, category_attribute_schema, product_attributes, product_raw_attributes.
- **Source doc:** ATTRIBUTE_ENGINE_ARCHITECTURE.md

### 2.3 Product (PRODUCT_ARCHITECTURE)

- **Responsibility:** **products** (parent) and **product_variants** (SKU); **product_prices**, **product_stock**, **product_media**, **product_attributes** (with optional variant_id). Visibility and **moderation_status**. Parser writes raw product; normalization and moderation produce active catalog. Cart and order reference variant_id.
- **Key entities:** products, product_variants, product_prices, product_stock, product_media, product_attributes, product_raw_attributes.
- **Source doc:** PRODUCT_ARCHITECTURE.md

### 2.4 Order (ORDER_SYSTEM_ARCHITECTURE)

- **Responsibility:** **cart** and **cart_items** (buyer/session/guest); **orders** and **order_items** (with product_id, variant_id, seller_id, unit_price snapshot); **order_status**; **payments** and **payment_transactions** (capture, refund); **delivery** (in order doc: single delivery; in delivery doc: shipments); **returns** and **return_lines**. Checkout flow: cart → validate → payment → order created, stock decremented.
- **Key entities:** cart, cart_items, orders, order_items, order_status, payments, payment_transactions, delivery (or shipments in delivery doc), returns, return_lines.
- **Source doc:** ORDER_SYSTEM_ARCHITECTURE.md

### 2.5 Financial (MARKETPLACE_FINANCIAL_ARCHITECTURE)

- **Responsibility:** Buyer pays platform (gateway); **platform_commissions** per order_item; **seller_balance** credited (seller net) and debited (refund, payout); **commission_rules**; **seller_wallets** (payout destination); **payout_requests** and **payout_batches** for payouts. payment_methods for buyer-facing methods.
- **Key entities:** payments, payment_transactions, payment_methods, platform_commissions, commission_rules, seller_balance, seller_wallets, seller_transactions, payout_requests, payout_batches.
- **Source doc:** MARKETPLACE_FINANCIAL_ARCHITECTURE.md

### 2.6 Delivery (DELIVERY_SYSTEM_ARCHITECTURE)

- **Responsibility:** **delivery_methods**, **shipping_zones**, **delivery_rates**; **shipments** (one per seller per order) and **shipment_items**; **tracking_updates**. Multi-seller split: one order → N shipments. Delivery cost at order/shipment level; status lifecycle created → packed → shipped → in_transit → delivered (and returned).
- **Key entities:** delivery_methods, shipping_zones, delivery_rates, shipments, shipment_items, tracking_updates.
- **Source doc:** DELIVERY_SYSTEM_ARCHITECTURE.md

### 2.7 Identity (IDENTITY_SYSTEM_ARCHITECTURE)

- **Responsibility:** **users**, **user_profiles**, **user_addresses**, **user_sessions**, **user_roles**, **permissions**; **seller_accounts** (user ↔ seller); **seller_verification**, **seller_documents**; auth via **email**, **phone**, **social**, **Telegram** (user_auth_providers). Buyer, seller, admin, CRM, support roles.
- **Key entities:** users, user_profiles, user_addresses, user_sessions, user_roles, permissions, seller_accounts, seller_verification, seller_documents, user_auth_providers.
- **Source doc:** IDENTITY_SYSTEM_ARCHITECTURE.md

### 2.8 Events (PLATFORM_EVENT_ARCHITECTURE)

- **Responsibility:** **domain_events** (append-only log); **event_subscribers** and **event_handlers** for routing; async dispatch to queues; idempotent handling. Events: order_created, payment_captured, shipment_shipped, shipment_delivered, return_created, seller_verified (and optional payment_refunded, order_cancelled, product_moderation_approved).
- **Key entities:** domain_events, event_subscribers, event_handlers, optional event_deliveries.
- **Source doc:** PLATFORM_EVENT_ARCHITECTURE.md

### 2.9 CMS (CMS_CONTENT_ARCHITECTURE)

- **Responsibility:** **pages** (home, category, landing, promo) with **page_key**; **page_versions** (draft/review/published) and **page_blocks** (block_type, settings — same as constructor); **menus** and **menu_items**; **banners**. Publish workflow draft → review → published. Storefront and constructor use same block registry and blockRenderer.
- **Key entities:** pages, page_versions, page_blocks, menus, menu_items, banners.
- **Source doc:** CMS_CONTENT_ARCHITECTURE.md

### 2.10 CRM / Operations (CRM_OPERATION_ARCHITECTURE)

- **Responsibility:** **product_moderation_queue** and **seller_verification_queue**; **crm_customers**, **crm_notes**, **crm_tasks**; **sales_reports**, **seller_reports**, **product_reports**. Product and seller moderation, customer support, analytics.
- **Key entities:** product_moderation_queue, seller_verification_queue, crm_customers, crm_notes, crm_tasks, sales_reports, seller_reports, product_reports.
- **Source doc:** CRM_OPERATION_ARCHITECTURE.md

### 2.11 Infrastructure (INFRASTRUCTURE_ARCHITECTURE)

- **Responsibility:** **jobs**, **job_attempts**, **job_failures** (queue); **parser**, **event**, **email** workers and **schedulers**; **product search index** and **filter index**; **Redis**, **page cache**, **query cache**; **file storage** (media, documents, product images).
- **Key entities:** jobs, job_attempts, job_failures; scheduled_tasks (optional); search index (external or DB); cache keys; storage buckets/paths.
- **Source doc:** INFRASTRUCTURE_ARCHITECTURE.md

---

## STEP 3 — DATA FLOW

### 3.1 Catalog and Product Flow

- **Parser** (donor) → fetches categories and products from donor site. Writes **donor_categories**; for each product page: donor_category_slug, title, description, price, characteristics, photos, seller link.
- **Category mapping:** donor_category_slug → donor_category_id → **category_mapping** → **catalog_category_id**. Product is assigned to a catalog category.
- **Product save:** Upsert **products** (category_id = catalog, donor_category_id, seller_id, brand_id, moderation_status = pending_moderation). Write **product_raw_attributes** from characteristics. Create **product_media**; for single-SKU create **product_variant**, **product_prices**, **product_stock**.
- **Attribute engine:** Normalize product_raw_attributes → **product_attributes** (product_id, attribute_id, value, catalog_category_id).
- **Moderation (CRM):** product_moderation_queue → operator approves/rejects → **products.moderation_status** = approved | rejected. Only approved (and visible) products appear on storefront. Optional: **product_moderation_approved** event → search index update.

### 3.2 Order and Payment Flow

- **Buyer** (storefront): Adds items to **cart** (cart_items: product_id, variant_id, quantity). At checkout: address, delivery method; **order** + **order_items** + **delivery** (or **shipments** per seller) created; **payments** row (pending); gateway capture.
- **Payment success:** **payment_transactions** (capture); orders.paid_at; order status → paid. **payment_captured** event emitted.
- **Financial:** Event handler (or sync) for payment_captured: for each order_item compute **platform_commissions** (gross, commission, seller_net); credit **seller_balance** via **seller_transactions** (order_income); decrement **product_stock**.
- **Delivery:** For each seller in order, **shipments** and **shipment_items** already created (or created on payment_captured). Seller fulfills → shipment status shipped → **tracking_updates**. **shipment_shipped** / **shipment_delivered** events → notifications, optional balance hold release.

### 3.3 Return and Refund Flow

- **Return created:** **returns** and **return_lines** (order_item_id, quantity). **return_created** event → notify seller, CRM, buyer.
- **Return approved/received:** Restock **product_stock**; **payment_transactions** (refund); debit **seller_balance** (seller_transactions refund_debit). Buyer refund via gateway.

### 3.4 Seller and Payout Flow

- **Seller onboarding:** User has **seller_accounts** (user_id, seller_id); uploads **seller_documents**. **seller_verification** status = pending → **seller_verification_queue**.
- **Verification:** Operator reviews documents → seller_verification.status = verified (or rejected). **seller_verified** event → payout eligibility, notifications.
- **Payout:** Seller creates **payout_request**; platform batches into **payout_batch**; transfer to **seller_wallets** (bank/wallet); **seller_transactions** (payout) debit **seller_balance**.

### 3.5 CMS and Storefront Flow

- **Content:** Editors edit **page_versions** (draft) and **page_blocks** (block_type, settings). Publish workflow → **page_versions** status = published; **pages.published_version_id** set.
- **Storefront:** Home/category/landing/promo request page by **page_key** → load published version’s **page_blocks** → render with same **blockRenderer** as constructor. **Menus** loaded by menu_key; **banners** by placement and scope. Data for blocks (products, categories) from catalog API and search.

### 3.6 Search and Cache Flow

- **Search index:** On product save or moderation_approved, job **IndexProductJob** (or event handler) updates **product search index** (title, attributes, category, price). Search API queries index + **filter facets** (aggregations or materialized).
- **Cache:** Category tree, menu, product by id, cart by session → **Redis**. Page cache by URL; query cache for listings. Invalidation on product/category/menu/page update.

---

## STEP 4 — EVENT FLOW

### 4.1 Event Producers and Consumers

| Event | Produced by | Consumed by (typical handlers) |
|-------|-------------|--------------------------------|
| **order_created** | Order service (checkout) | Email (confirmation), analytics, seller notification, inventory reserve |
| **payment_captured** | Payment service / gateway webhook | Seller balance credit, platform_commissions, product_stock decrement, email, create shipments |
| **shipment_shipped** | Fulfillment / shipment service | Buyer email, tracking push, order status “shipped” |
| **shipment_delivered** | Delivery / tracking service | Balance hold release, “delivered” email, order status “delivered”, review request |
| **return_created** | Return service | Seller notification, CRM/support, buyer email |
| **seller_verified** | Verification / admin | Payout unlock, seller email, trust badge |
| **payment_refunded** (optional) | Refund flow | Seller balance debit, notifications |
| **order_cancelled** (optional) | Order service | Stock restore, notifications |
| **product_moderation_approved** (optional) | Moderation / CRM | Search index update, notifications |

### 4.2 Event Path (Conceptual)

1. **Produce:** Application (order, payment, shipment, return, verification) inserts into **domain_events** (event_type, payload, occurred_at). Optionally pushes to message queue.
2. **Dispatch:** Dispatcher (job or daemon) reads **domain_events** (or queue); for each event loads **event_subscribers** for that event_type; for each subscriber enqueues **job** (e.g. HandleDomainEventJob with event_id, subscriber_id) to **jobs** table (queue = events).
3. **Handle:** **Event workers** consume jobs; load event and handler; run handler (e.g. credit seller_balance, send email, update search index). Record **event_deliveries** (optional) for idempotency. On failure: retry with backoff; after max attempts → dead letter.
4. **Cross-system effect:** Events are the **glue** between Order, Financial, Delivery, Identity, CRM, and Infrastructure: payment_captured triggers financial and delivery; shipment_delivered can trigger balance release; product_moderation_approved triggers search; return_created triggers CRM.

### 4.3 Event ↔ System Map

- **Order system** produces: order_created, payment_captured (with payment), return_created; consumes: (none; order is source of truth for order state).
- **Financial system** consumes: payment_captured (credit balance, commission), payment_refunded (debit balance), shipment_delivered (optional hold release).
- **Delivery system** produces: shipment_shipped, shipment_delivered; consumes: payment_captured (create shipments).
- **Identity system** produces: seller_verified; consumes: (optional notifications).
- **CRM** consumes: return_created (tasks/notes), optionally order_created (analytics).
- **Infrastructure** (workers, search, email): consumes all events that trigger jobs (email, index, notifications).

---

## STEP 5 — FINAL DOCUMENT (Summary)

### 5.1 Document Index

| Document | Scope |
|----------|--------|
| **CATALOG_ARCHITECTURE_V2.md** | Donor vs catalog categories; category_mapping; product placement. |
| **ATTRIBUTE_ENGINE_ARCHITECTURE.md** | Attribute normalization; category_attribute_schema; product_attributes. |
| **PRODUCT_ARCHITECTURE.md** | products, variants, prices, stock, media, attributes; parser integration. |
| **ORDER_SYSTEM_ARCHITECTURE.md** | Cart, orders, order_items, payments, delivery, returns; checkout flow. |
| **MARKETPLACE_FINANCIAL_ARCHITECTURE.md** | Payments, commissions, seller_balance, payouts, seller_wallets. |
| **DELIVERY_SYSTEM_ARCHITECTURE.md** | delivery_methods, zones, rates; shipments, shipment_items, tracking. |
| **IDENTITY_SYSTEM_ARCHITECTURE.md** | users, roles, seller_accounts, verification, auth methods. |
| **PLATFORM_EVENT_ARCHITECTURE.md** | domain_events, subscribers, handlers; async processing. |
| **CMS_CONTENT_ARCHITECTURE.md** | pages, versions, blocks; menus, banners; publish workflow. |
| **CRM_OPERATION_ARCHITECTURE.md** | Moderation queues; crm_customers, notes, tasks; reports. |
| **INFRASTRUCTURE_ARCHITECTURE.md** | jobs, workers, schedulers; search; cache; file storage. |

### 5.2 High-Level Diagram

```
                    ┌─────────────────────────────────────────────────────────┐
                    │                    STOREFRONT / BUYER                     │
                    │  (Home, Category, Product, Cart, Checkout, Account)       │
                    └───────────────────────┬──────────────────────────────────┘
                                            │
         ┌──────────────────────────────────┼──────────────────────────────────┐
         │                                  │                                  │
         ▼                                  ▼                                  ▼
┌─────────────────┐              ┌─────────────────┐              ┌─────────────────┐
│      CMS        │              │  Catalog /      │              │  Identity       │
│  pages, blocks  │              │  Product /       │              │  users, roles   │
│  menus, banners │              │  Attribute      │              │  seller_accounts│
└────────┬────────┘              └────────┬────────┘              └────────┬────────┘
         │                                │                                │
         │                                ▼                                │
         │                       ┌─────────────────┐                        │
         │                       │  Search /       │                        │
         │                       │  Cache          │                        │
         │                       └────────┬────────┘                        │
         │                                │                                 │
         └───────────────────────────────┼─────────────────────────────────┘
                                         │
                    ┌────────────────────┼────────────────────┐
                    │                    │                    │
                    ▼                    ▼                    ▼
         ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
         │     Order       │  │   Financial     │  │    Delivery     │
         │  cart, orders   │  │  commissions    │  │   shipments     │
         │  payments       │  │  seller_balance │  │   tracking      │
         │  returns        │  │  payouts        │  │                 │
         └────────┬────────┘  └────────┬────────┘  └────────┬────────┘
                  │                    │                    │
                  └────────────────────┼────────────────────┘
                                       │
                                       ▼
                            ┌─────────────────────┐
                            │  domain_events      │
                            │  event_subscribers   │
                            │  event_handlers     │
                            └──────────┬───────────┘
                                       │
         ┌─────────────────────────────┼─────────────────────────────┐
         │                             │                               │
         ▼                             ▼                               ▼
┌─────────────────┐          ┌─────────────────┐          ┌─────────────────┐
│  CRM / Admin    │          │  Infrastructure  │          │  Workers         │
│  moderation     │          │  jobs, cache     │          │  parser, event   │
│  support        │          │  storage, search │          │  email, scheduler│
│  reports        │          │                 │          │                 │
└─────────────────┘          └─────────────────┘          └─────────────────┘
```

### 5.3 Reading Order for New Team Members

1. **PLATFORM_MASTER_ARCHITECTURE.md** (this document) — overview, system map, data flow, event flow.
2. **CATALOG_ARCHITECTURE_V2.md** and **PRODUCT_ARCHITECTURE.md** — how catalog and products are structured and filled (parser, categories, variants).
3. **ORDER_SYSTEM_ARCHITECTURE.md** and **MARKETPLACE_FINANCIAL_ARCHITECTURE.md** — how orders and money flow (buyer → platform → seller).
4. **DELIVERY_SYSTEM_ARCHITECTURE.md** and **IDENTITY_SYSTEM_ARCHITECTURE.md** — fulfillment and who can do what (sellers, buyers, roles).
5. **PLATFORM_EVENT_ARCHITECTURE.md** and **INFRASTRUCTURE_ARCHITECTURE.md** — how systems communicate and what runs in the background.
6. **CMS_CONTENT_ARCHITECTURE.md** and **CRM_OPERATION_ARCHITECTURE.md** — content and operations (pages, moderation, support, analytics).

---

*End of Platform Master Architecture.*

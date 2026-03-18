# Architecture Index

**Document type:** Navigation and reading map for all architecture documents (no code)  
**Audience:** Developers, architects, new team members  
**Purpose:** Provide a single entry point to find and read the right architecture documents for the platform. Strengthens the development process by making dependencies and reading order explicit.

---

## SECTION 1 — ARCHITECTURE OVERVIEW

### 1.1 Platform architecture layers

The platform is a **multi-seller marketplace** with a layered architecture:

- **Master layer** — One overarching view (PLATFORM_MASTER_ARCHITECTURE) and one implementation plan (IMPLEMENTATION_ROADMAP). These define what the platform is, how subsystems fit together, and in what order they are built. Start here for context before diving into a domain.

- **Core domains** — The business and data layers: **Catalog** (donor vs marketplace categories, mapping), **Attributes** (normalization, filters, category schema), **Product** (products, variants, prices, stock, media), **Order** (cart, checkout, orders, payments), **Delivery** (shipments, methods, rates), **Financial** (seller balance, commissions, payouts), **Identity** (users, sessions, roles, sellers, verification). Each domain has its own architecture document; together they define the data model and domain rules.

- **Platform systems** — Cross-cutting and content/operations: **Events** (domain events, subscribers, handlers, async processing), **CMS** (pages, blocks, menus, banners), **CRM** (moderation, tasks, notes, support). These depend on core domains and define how the platform behaves at runtime and how content and operations are managed.

- **Platform engineering** — How the system is built and run: **Infrastructure** (queues, workers, schedulers, search, cache, file storage), **API** (domains, auth, URLs, rate limiting), **Security** (principles, auth, API protection, secrets, payment, data protection, internal security), **Observability** (metrics, logs, traces, alerting, dashboards). These apply to all domains and must be respected in every implementation.

- **Process** — How architecture is audited and how implementation is constrained: **Architecture audit** (reports and recommendations), **Development guardrails** (rules for implementation, database, testing, observability, review, and incidents). Process documents protect the integrity of the architecture and the safety of changes.

Reading order for a new team member: **Master** → **Core domains** (in dependency order) → **Platform systems** → **Platform engineering** → **Process**. For a specific task, use Section 3 (Development navigation) to pick the minimal set of documents to read.

---

## SECTION 2 — ARCHITECTURE DOCUMENTS MAP

Documents are grouped by system. File names are relative to the project root (e.g. `PLATFORM_MASTER_ARCHITECTURE.md`).

### MASTER

| Document | Purpose |
|----------|---------|
| **PLATFORM_MASTER_ARCHITECTURE.md** | Unified view of the marketplace: subsystems, system map, data flow, event flow. Source of truth for “what the platform is” and how domains relate. |
| **IMPLEMENTATION_ROADMAP.md** | Order of implementation: phases (Core catalog → Attribute engine → Product variants → Orders → Delivery → Financials → Platform systems → CMS + CRM), dependencies, and principles. |

### CORE DOMAINS

| Document | Purpose |
|----------|---------|
| **CATALOG_ARCHITECTURE_V2.md** | Dual category system: donor_categories (parser), catalog_categories (marketplace), category_mapping. Products, brands, sellers. Parser must not drive catalog without mapping. |
| **ATTRIBUTE_ENGINE_ARCHITECTURE.md** | Attributes, attribute_values, attribute_key_mapping, synonyms, canonical; category_attribute_schema; product_attributes, product_raw_attributes; normalization pipeline. |
| **PRODUCT_ARCHITECTURE.md** | products, product_variants, product_prices, product_stock, product_media; visibility and moderation; parser integration; relationship to catalog and attributes. |
| **ORDER_SYSTEM_ARCHITECTURE.md** | cart, cart_items; orders, order_items, order_status; payments, payment_transactions; checkout flow; delivery and returns. |
| **DELIVERY_SYSTEM_ARCHITECTURE.md** | delivery_methods, shipping_zones, delivery_rates; shipments, shipment_items (one per seller per order); tracking_updates. |
| **MARKETPLACE_FINANCIAL_ARCHITECTURE.md** | Buyer payment capture; platform_commissions, commission_rules; seller_balance, seller_transactions; seller_wallets, payout_requests, payout_batches. |
| **IDENTITY_SYSTEM_ARCHITECTURE.md** | users, user_sessions, user_roles, permissions; seller_accounts, seller_verification, seller_documents; auth (email, phone, social, Telegram). |

### PLATFORM SYSTEMS

| Document | Purpose |
|----------|---------|
| **PLATFORM_EVENT_ARCHITECTURE.md** | domain_events, event_subscribers, event_handlers; event flow, async processing, retries, dead letter; event types (order_created, payment_captured, etc.). |
| **CMS_CONTENT_ARCHITECTURE.md** | pages, page_versions, page_blocks; menus, banners; publish workflow; constructor integration. |
| **CRM_OPERATION_ARCHITECTURE.md** | Moderation (product, seller); crm_customers, crm_notes, crm_tasks; sales/seller/product reports; support workflows. |

### PLATFORM ENGINEERING

| Document | Purpose |
|----------|---------|
| **INFRASTRUCTURE_ARCHITECTURE.md** | jobs, job_attempts, job_failures; queues and workers (parser, event, email); schedulers; search index and filter facets; Redis, page and query cache; file storage. |
| **API_ARCHITECTURE.md** | API domains (public, buyer, seller, admin, crm, internal, webhooks); authentication; URL structure; authorization and permissions; rate limiting; versioning. |
| **SECURITY_ARCHITECTURE.md** | Security principles; authentication (passwords, tokens, sessions); API security (rate limit, validation, CORS, CSRF, headers); secrets; payment (no card storage, webhook verification); data protection; internal security. |
| **OBSERVABILITY_ARCHITECTURE.md** | Metrics, logs, traces; logging rules (structured, no secrets/PII); platform metrics; distributed tracing; alerting; dashboards. |

### PROCESS

| Document | Purpose |
|----------|---------|
| **ARCHITECTURE_AUDIT_REPORT.md** | Audit findings, cross-document consistency, gaps, and recommendations. |
| **DEVELOPMENT_GUARDRAILS.md** | Rules for implementation: architecture authority, database, implementation, testing, observability, code review, traceability, migration safety, incident response. |

---

## SECTION 3 — DEVELOPMENT NAVIGATION

Use this section to decide **which documents must be read** when working on a given area. Read the listed documents before implementing or changing that area.

### Catalog

- **CATALOG_ARCHITECTURE_V2.md** — Primary. donor_categories, catalog_categories, category_mapping, products, brands, sellers.
- **ATTRIBUTE_ENGINE_ARCHITECTURE.md** — category_attribute_schema and product_attributes reference catalog_categories; filters and PDP depend on both.

### Attributes

- **ATTRIBUTE_ENGINE_ARCHITECTURE.md** — Primary. attributes, attribute_values, mapping, synonyms, canonical, product_attributes, product_raw_attributes, normalization pipeline.
- **CATALOG_ARCHITECTURE_V2.md** — category_attribute_schema is per catalog_category; catalog categories and mapping context.

### Products

- **PRODUCT_ARCHITECTURE.md** — Primary. products, variants, prices, stock, media, moderation.
- **CATALOG_ARCHITECTURE_V2.md** — product placement in catalog_categories; donor_category_id and mapping.
- **ATTRIBUTE_ENGINE_ARCHITECTURE.md** — product_attributes, product_raw_attributes, category_attribute_schema for filters and PDP.

### Orders

- **ORDER_SYSTEM_ARCHITECTURE.md** — Primary. cart, cart_items, orders, order_items, order_status, payments, payment_transactions, checkout flow.
- **PRODUCT_ARCHITECTURE.md** — order_items reference product_id and variant_id; price and stock from product_prices and product_stock.
- **API_ARCHITECTURE.md** — buyer_api cart and checkout endpoints; public_api and buyer_api boundaries.

### Payments

- **ORDER_SYSTEM_ARCHITECTURE.md** — payments, payment_transactions; link to order and checkout.
- **MARKETPLACE_FINANCIAL_ARCHITECTURE.md** — Buyer payment capture; gateway; platform as merchant of record.
- **SECURITY_ARCHITECTURE.md** — No card storage; gateway only; webhook verification.
- **PLATFORM_EVENT_ARCHITECTURE.md** — payment_captured event and subscribers (e.g. seller balance, email).

### Delivery

- **DELIVERY_SYSTEM_ARCHITECTURE.md** — Primary. delivery_methods, delivery_rates, shipments, shipment_items, tracking.
- **ORDER_SYSTEM_ARCHITECTURE.md** — Orders and shipping address; delivery_amount; when shipments are created (e.g. after payment).
- **PLATFORM_EVENT_ARCHITECTURE.md** — shipment_shipped, shipment_delivered events.

### Identity

- **IDENTITY_SYSTEM_ARCHITECTURE.md** — Primary. users, sessions, roles, permissions, seller_accounts, seller_verification, auth methods.
- **API_ARCHITECTURE.md** — Auth per domain (buyer, seller, admin, crm); session and token handling.
- **SECURITY_ARCHITECTURE.md** — Password hashing, token and session security.

### Events

- **PLATFORM_EVENT_ARCHITECTURE.md** — Primary. domain_events, subscribers, handlers, async flow, retries.
- **INFRASTRUCTURE_ARCHITECTURE.md** — jobs, event worker, queue for handler jobs.
- **ORDER_SYSTEM_ARCHITECTURE.md** / **MARKETPLACE_FINANCIAL_ARCHITECTURE.md** / **DELIVERY_SYSTEM_ARCHITECTURE.md** — Event types and payloads (order_created, payment_captured, shipment_shipped, etc.).

### CMS

- **CMS_CONTENT_ARCHITECTURE.md** — Primary. pages, blocks, menus, banners, publish workflow.
- **API_ARCHITECTURE.md** — public_api pages and blocks; admin_api for CMS management.

### CRM

- **CRM_OPERATION_ARCHITECTURE.md** — Primary. Moderation queues, crm_customers, notes, tasks, reports.
- **IDENTITY_SYSTEM_ARCHITECTURE.md** — seller_verification, seller_documents; roles (crm_operator, support).
- **API_ARCHITECTURE.md** — crm_api scope and permissions.
- **PRODUCT_ARCHITECTURE.md** — product moderation_status; **ORDER_SYSTEM_ARCHITECTURE.md** — orders and returns for support.

### Infrastructure

- **INFRASTRUCTURE_ARCHITECTURE.md** — Primary. jobs, workers, schedulers, search, cache, file storage.
- **PLATFORM_EVENT_ARCHITECTURE.md** — Event dispatch and handler jobs.
- **API_ARCHITECTURE.md** — internal_api for workers and services.
- **OBSERVABILITY_ARCHITECTURE.md** — Logging, metrics, tracing for workers and queues.

---

## SECTION 4 — DOCUMENT DEPENDENCIES

### 4.1 Dependency chain

Implementation and understanding flow in this order. Later items depend on earlier ones; reading and implementing in this order reduces rework and ensures dependencies exist.

1. **Catalog** — donor_categories, catalog_categories, category_mapping, products, brands, sellers. Foundation for taxonomy and product placement. Parser must not assign products to catalog without mapping.

2. **Attributes** — attributes, attribute_values, key mapping, product_attributes, product_raw_attributes, category_attribute_schema. Depends on **Catalog** (catalog_categories and products). Feeds filters and PDP.

3. **Products** — product_variants, product_prices, product_stock, product_media; full product model. Depends on **Catalog** and **Attributes**. Sellable unit (variant) and price/stock are required before orders.

4. **Orders** — cart, orders, order_items, order_status, payments, payment_transactions. Depends on **Products** (variant_id, product_prices, product_stock). Checkout and payment capture are the next step.

5. **Delivery** — delivery_methods, delivery_rates, shipments, shipment_items. Depends on **Orders** (order and order_items; shipments created per seller after payment). Fulfillment and tracking.

6. **Financial** — seller_balance, seller_transactions, commission_rules, payout_requests. Depends on **Orders** and **Payments** (payment_captured); optionally **Delivery** (hold until delivered). Seller money flow.

7. **Events** — domain_events, subscribers, handlers; async processing. Depends on **Orders**, **Financial**, **Delivery** (and Identity, Product) for event types and payloads. Decouples side effects (email, balance, index) from request path.

8. **Infrastructure** — jobs, workers, schedulers, search index, cache. Depends on **Catalog**, **Products**, **Orders**, **Events** for meaningful jobs and index content. Provides the runtime for async and search.

**Identity** can be implemented in parallel with or before **Orders** (buyer and seller identity are needed for cart, checkout, and seller_api). **API**, **Security**, and **Observability** apply to all layers and should be read whenever implementing or changing any domain. **CMS** and **CRM** depend on Products, Orders, and Identity for content and operations workflows.

### 4.2 Summary diagram

```
Catalog → Attributes → Products → Orders → Delivery → Financial
                ↓                    ↓         ↓
            (schema)            (payments) (shipments)
                                    ↓
                                Events → Infrastructure
                                    (workers, search, queues)
```

---

*End of Architecture Index.*

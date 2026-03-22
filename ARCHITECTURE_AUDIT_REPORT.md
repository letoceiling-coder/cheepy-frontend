# Architecture Audit Report

**Document type:** Strict architectural audit of the platform architecture documents (no code, no redesign)  
**Audience:** Architects, engineering leads  
**Scope:** CATALOG_ARCHITECTURE_V2.md, ATTRIBUTE_ENGINE_ARCHITECTURE.md, PRODUCT_ARCHITECTURE.md, ORDER_SYSTEM_ARCHITECTURE.md, MARKETPLACE_FINANCIAL_ARCHITECTURE.md, DELIVERY_SYSTEM_ARCHITECTURE.md, IDENTITY_SYSTEM_ARCHITECTURE.md, PLATFORM_EVENT_ARCHITECTURE.md, CMS_CONTENT_ARCHITECTURE.md, CRM_OPERATION_ARCHITECTURE.md, INFRASTRUCTURE_ARCHITECTURE.md, PLATFORM_MASTER_ARCHITECTURE.md.

---

## 1. Architecture completeness

The following areas are **missing or only lightly implied** in the current set of architecture documents. They are typical for a production marketplace; their absence does not invalidate the design but should be explicitly decided (documented or deferred).

### 1.1 Missing or not designed

| Area | Current state | Comment |
|------|----------------|--------|
| **API architecture** | No dedicated document. References exist to “Search API”, “Upload API”, “GET /api/cms/blocks”, “publicApi” (catalog). | No explicit design for API boundaries (public vs admin vs seller), versioning, authentication/authorization at API level, or request/response contracts. Recommended: add a short API architecture section (or doc) covering public/storefront, admin, seller, and CRM API boundaries and auth. |
| **Security architecture** | IDENTITY covers auth (login, sessions, roles, permissions). No system-wide security design. | Secrets management, HTTPS/TLS, PCI scope (if card data touches the app), input validation, XSS/CSRF, secure headers, and security headers are not described. Recommended: document security principles and scope (e.g. “we do not store raw card data; gateway only”) and where secrets live. |
| **Audit logging** | Moderation (product) can use moderation_events; events use event_deliveries; jobs use job_attempts. | No platform-wide audit log for sensitive or compliance-relevant actions (e.g. who changed order status, who approved payout, who changed commission rules, access to PII). Recommended: define an audit_log (or similar) concept for high-value and compliance-sensitive actions. |
| **Feature flags** | Not mentioned. | No design for toggling features by environment, user segment, or rollout. Optional; add only if the product roadmap requires it. |
| **Analytics event system** | Domain events are server-side business events (order_created, payment_captured, etc.). CRM has sales/seller/product reports (aggregated). | No design for client-side or behavioral analytics (page view, click, add_to_cart, search query) or a pipeline (event collection, warehouse, dashboards). Domain events can feed analytics; a separate “analytics events” model is not defined. Add if product/BI needs behavioral funnels. |
| **Notification system** | Event handlers “send email”, “notify seller”, “notify support”. INFRASTRUCTURE has email workers and SendEmailJob. | No first-class notification entity (in-app, push, email, digest) or channel abstraction. Emails are implicit (job payload). Acceptable for email-only; if in-app or push is planned, a notification model (e.g. notifications table, channels) should be designed. |
| **Fraud / risk detection** | ORDER_SYSTEM_ARCHITECTURE mentions orders.ip_address (optional) for fraud. | No fraud or risk detection system (rules, scoring, block/flag). Optional for MVP; document as out-of-scope or future if relevant. |
| **Observability** | Not covered. | No design for metrics (counters, gauges), distributed tracing, alerting, or dashboards. job_attempts and event_deliveries support debugging but are not an observability strategy. Recommended: add a short observability section (what to measure, where to log, how to alert). |
| **Backup strategy** | Not covered. | No mention of DB backup, retention, point-in-time recovery, or restore procedures. Recommended: document backup and RTO/RPO expectations outside the architecture docs or in a runbook. |
| **Rate limiting** | INFRASTRUCTURE mentions Redis for “rate limiting” and email worker “rate limit per provider”. | No design for API rate limiting (per user, per IP, per endpoint). Recommended: define rate-limiting strategy for public and admin APIs. |

### 1.2 Present and adequate

- Catalog (dual categories, mapping), attribute engine, product (variants, prices, stock, media), order (cart, orders, payments, returns), financial (commissions, seller balance, payouts), delivery (shipments, tracking), identity (users, roles, seller_accounts, verification), events (domain_events, subscribers, handlers), CMS (pages, blocks, menus, banners), CRM (moderation queues, notes, tasks, reports), infrastructure (jobs, workers, schedulers, search, cache, file storage) are all covered.
- Parser integration with catalog and product is described; event flow ties order, financial, delivery, and identity.

---

## 2. Consistency issues

Cross-document consistency was checked for: Catalog → Product → Order; Order → Financial → Delivery; Identity → Seller accounts → Payout; Parser → Catalog → Attribute engine; Events → Workers → Infrastructure.

### 2.1 Delivery vs order “delivery” entity

- **ORDER_SYSTEM_ARCHITECTURE** defines a single **delivery** table per order (one row per order) and **delivery_tracking** keyed by delivery_id. It states that “if marketplace supports split shipments by seller, one order could have multiple delivery rows (order_id, seller_id) — design choice. Here we assume one delivery per order for simplicity.”
- **DELIVERY_SYSTEM_ARCHITECTURE** introduces **shipments** (one per seller per order), **shipment_items**, and **tracking_updates** keyed by shipment_id, and states that ORDER’s delivery table “can be replaced or extended by shipments”.
- **Conclusion:** Not a logical contradiction: ORDER describes the simple (one delivery per order) model; DELIVERY describes the multi-seller (N shipments per order) model. The relationship between the two is “shipments replace or extend delivery” but is not pinned to a single rule (e.g. “when multi-seller is enabled, do not use delivery table; use only shipments”). Implementations could keep both (e.g. one delivery row for address/cost summary and N shipments for fulfillment) or drop delivery in favor of shipments. **Recommendation:** In PLATFORM_MASTER_ARCHITECTURE or ORDER_SYSTEM_ARCHITECTURE, add one sentence: “When multi-seller shipments are used, the canonical fulfillment entity is shipments; the delivery table may be deprecated or kept only for order-level delivery_amount/shipping_address summary.”

### 2.2 Payment and financial alignment

- **payments** and **payment_transactions** are defined in ORDER_SYSTEM_ARCHITECTURE and referenced in MARKETPLACE_FINANCIAL_ARCHITECTURE with the same responsibility and relationships (order_id, capture, refund, order_return_id for refunds). **No contradiction.**

### 2.3 Identity → seller → payout

- **seller_accounts** (user_id, seller_id) link users to sellers; **seller_verification** and **seller_documents** are per seller; **payout_requests** and **seller_balance** are per seller. FINANCIAL references seller_id from order_items and sellers; IDENTITY references seller_verification gating payout. **Consistent.**

### 2.4 Parser → catalog → attribute engine

- Parser writes donor_categories and product data; category_mapping yields catalog_category_id; product save uses category_id (catalog) and donor_category_id; product_raw_attributes are normalized into product_attributes; category_attribute_schema uses catalog_category_id. **Consistent.**

### 2.5 Events → workers → infrastructure

- PLATFORM_EVENT_ARCHITECTURE: domain_events, event_subscribers, event_handlers; dispatch to jobs. INFRASTRUCTURE_ARCHITECTURE: jobs (queue = events), event workers consume HandleDomainEventJob, load event and handler. Event retries and dead letter in events doc; job_failures and retries in infrastructure doc. **Consistent.** Event “dead letter” is conceptual; job_failures is the concrete table for failed jobs; failed event deliveries could be recorded in event_deliveries or a similar structure. **No contradiction.**

### 2.6 Shipment creation trigger

- PLATFORM_MASTER_ARCHITECTURE and PLATFORM_EVENT_ARCHITECTURE state that **payment_captured** can trigger “create shipments” (one per seller). DELIVERY_SYSTEM_ARCHITECTURE states that on “order paid” a shipment is created per distinct seller and shipment_items link order_items to shipments. **Consistent:** payment_captured is the trigger; shipments are created at or after order paid.

### 2.7 Summary of consistency

- One clarification recommended: **delivery table vs shipments** when multi-seller is in use (see 2.1). All other cross-references (catalog → product → order → financial → delivery → identity → events → infrastructure) are consistent.

---

## 3. Data model risks

Verification focused on: products, variants, orders, order_items, payments, seller_balance, shipments, returns, attributes, categories, users, seller_accounts.

### 3.1 Entities present and linked correctly

- **products:** Present (PRODUCT, CATALOG). Links: category_id (catalog_categories), donor_category_id (donor_categories), seller_id (sellers), brand_id (brands). product_variants, product_prices, product_stock, product_media, product_attributes, product_raw_attributes are defined.
- **product_variants:** Present (PRODUCT). Referenced by cart_items, order_items, product_prices, product_stock, product_attributes (optional variant_id), product_media (optional variant_id).
- **orders:** Present (ORDER). buyer_user_id (users), order_items, payments, delivery/shipments, returns. order_status and order_status_history described.
- **order_items:** Present (ORDER). order_id, product_id, variant_id, seller_id (denormalized), quantity, unit_price, total_price. Referenced by shipment_items, return_lines, platform_commissions.
- **payments, payment_transactions:** Present (ORDER, FINANCIAL). order_id, payment_id; refund links to order_return_id.
- **seller_balance, seller_transactions:** Present (FINANCIAL). seller_id; credited on payment_captured, debited on refund and payout.
- **shipments, shipment_items, tracking_updates:** Present (DELIVERY). order_id, seller_id; shipment_items → order_items; constraint seller_id match.
- **returns, return_lines:** Present (ORDER). order_id; return_lines → order_item_id; drive refund and restock.
- **attributes, product_attributes, category_attribute_schema, product_raw_attributes:** Present (ATTRIBUTE_ENGINE, PRODUCT, CATALOG). catalog_category_id used consistently.
- **donor_categories, catalog_categories, category_mapping:** Present (CATALOG). products reference both category_id and donor_category_id.
- **users, user_profiles, user_addresses, user_sessions, user_roles, permissions, seller_accounts, seller_verification, seller_documents:** Present (IDENTITY). orders.buyer_user_id → users; cart.user_id → users; seller_accounts link users to sellers.

No critical entity required for the described marketplace is missing. Relationships and foreign keys are aligned across documents.

### 3.2 Minor data model gaps (non-blocking)

- **currencies:** Only as a code (e.g. currency column on orders, payments, seller_balance). There is no **currencies** reference table. Acceptable for single-currency; for multi-currency or strict reporting, a small currencies table and FK may be needed.
- **addresses:** Shipping address is stored as JSON (or snapshot) on order and shipment; **user_addresses** holds saved addresses. No separate **addresses** table for orders is mandated; the design is explicit (snapshot at order time). No inconsistency.
- **sellers** table: Referenced in PRODUCT, CATALOG, ORDER (order_items.seller_id), DELIVERY (shipments.seller_id), FINANCIAL, IDENTITY. Its columns are listed in CATALOG (id, slug, name, source_url, pavilion, contacts, status, is_verified, products_count, last_parsed_at). IDENTITY says “sellers (from PRODUCT_ARCHITECTURE / catalog)”. **No gap;** sellers is the shared business entity.

---

## 4. Scalability risks

Evaluation against: 100k products, 1M products, 10M products, high order volume, multiple sellers, large attribute sets, heavy search.

### 4.1 Supported by current design

- **100k products:** Search index (INFRASTRUCTURE), Redis and query cache, product_attributes indexes (catalog_category_id, attribute_id, value), product and variant indexes. Architecture is sufficient.
- **Multiple sellers:** Order items and shipments are per seller; seller_balance and payouts are per seller; no single bottleneck on seller_id.
- **High order volume:** Orders and order_items are append-heavy; jobs and event workers offload work. Queue-based design supports horizontal workers.

### 4.2 Risks and gaps

| Scale / area | Risk | Mitigation in docs | Recommendation |
|--------------|------|--------------------|----------------|
| **1M–10M products** | **product_attributes** can grow to tens or hundreds of millions of rows (many attributes per product). Filter queries (catalog_category_id + attribute_id + value) and facet aggregation may become heavy. | ATTRIBUTE_ENGINE and PRODUCT mention indexes and optional materialized facets; INFRASTRUCTURE recommends search engine aggregations for facets. | Rely on search engine (Elasticsearch/OpenSearch/Meilisearch) for filter and facet workload; keep product_attributes as source of truth and index into search. If DB-only, plan for partitioning or materialized facet tables and batch updates. |
| **1M+ products** | **product_media** (and product_photos in current DB) are high volume (2M+ rows noted in docs). Listing pages need “primary image per product” efficiently. | PRODUCT and INFRASTRUCTURE mention covering index (product_id, is_primary) and CDN. | Ensure listing APIs use indexed “primary image” or precomputed thumbnail URL (e.g. on product or materialized view) to avoid N+1 on product_media. |
| **High order volume** | **jobs** table can grow quickly if every event creates multiple jobs. Purging or archiving of completed jobs is not specified. | INFRASTRUCTURE describes job status flow; no retention or purge policy. | Define job retention (e.g. delete or archive completed/failed jobs after N days) and monitor queue depth. |
| **Heavy search** | Search engine choice (Elasticsearch vs DB full-text) and scaling (replicas, sharding) are not specified. | INFRASTRUCTURE states “search engine or DB”; product index and filter index are logical. | Document the chosen search engine and scaling approach (replicas, index partitioning by category or tenant if needed). |
| **Read scaling** | No explicit use of **read replicas** for DB. All reads may hit the primary. | Cache (Redis, page, query) reduces DB load but is not replica strategy. | For high read traffic, consider documenting read replica usage for catalog and order read paths and any replication lag handling. |

### 4.3 Summary

- The architecture supports 100k products and multiple sellers well. For 1M–10M products and heavy search, the main risks are: (1) product_attributes and filter workload — use search engine for facets; (2) product_media/listings — efficient primary image access; (3) job table growth — retention/purge; (4) search engine scaling and read replicas — document when adopting.

---

## 5. Operational risks

Check: background workers, event processing, queue retries, dead letter, monitoring, logging, error handling.

### 5.1 Covered in the architecture

- **Background workers:** INFRASTRUCTURE defines parser, event, and email workers consuming from jobs table (or Redis). Scheduler enqueues jobs on a schedule. **Present.**
- **Event processing:** PLATFORM_EVENT_ARCHITECTURE defines domain_events, dispatch to jobs, event workers run handlers. **Present.**
- **Queue retries:** INFRASTRUCTURE: attempts, max_attempts, available_at backoff; PLATFORM_EVENT_ARCHITECTURE: retry with backoff. **Present.**
- **Dead letter:** INFRASTRUCTURE: job_failures table for jobs that exceeded max_attempts; PLATFORM_EVENT_ARCHITECTURE: “dead letter table or queue” for failed event deliveries. **Present** (jobs); event dead-letter is conceptual and can be implemented via job_failures or event_deliveries with status = failed).

### 5.2 Gaps

| Area | Current state | Recommendation |
|------|----------------|----------------|
| **Monitoring** | job_attempts and (optionally) event_deliveries give per-job/per-delivery status. No design for metrics (throughput, latency, error rate) or health checks. | Add observability: metrics for job consumption rate, queue depth, handler duration, failure rate; health checks for queue and workers; alerting on backlog and failure spike. |
| **Logging** | parser_logs exist; optional email_log; no application or request logging design. | Define structured logging (request id, user id, module, level) and log aggregation for errors and critical paths (e.g. checkout, payment). |
| **Error handling** | Retry and dead letter are designed; no global error handling or error reporting (e.g. to a tracker or ops channel). | Document how unhandled exceptions in workers and API are logged and reported (e.g. Sentry, PagerDuty) and how job_failures are surfaced to ops. |
| **Worker process management** | Workers are “processes” (Supervisor or systemd). No detail on graceful shutdown, concurrency limits, or memory limits. | Document worker lifecycle (graceful drain on shutdown, max concurrent jobs per process) in runbooks or infrastructure doc. |

### 5.3 Summary

- Background workers, event processing, retries, and dead letter (job_failures) are in place. Monitoring, structured logging, error reporting, and worker lifecycle are not designed; they are operational necessities for production and should be added (short sections or runbooks) without changing the core architecture.

---

## 6. Recommended improvements

Prioritized list of improvements that keep the existing architecture intact and add only what is necessary.

### 6.1 High priority (production readiness)

1. **Clarify delivery vs shipments** (see §2.1): In one place (e.g. PLATFORM_MASTER_ARCHITECTURE or ORDER_SYSTEM_ARCHITECTURE), state explicitly that when multi-seller shipments are used, shipments are the canonical fulfillment entity and whether the delivery table is deprecated or kept for summary only.
2. **Document API boundaries and auth:** Add a short API architecture section (or document): public/storefront API (catalog, cart, checkout, search), admin API (JWT/role), seller API (scoped by seller_id), and how they map to identity (roles, permissions). No redesign of existing entities.
3. **Document observability and operations:** Add a short section (or appendix) on: what to measure (queue depth, job throughput, handler latency, API latency), where to log (structured logs, levels), and how to alert (e.g. on job_failures growth, queue backlog). Optionally: backup and restore expectations (RTO/RPO) in a runbook rather than in architecture docs.
4. **Audit logging for sensitive actions:** Define a minimal audit_log (or equivalent) concept for: order status and payment changes, payout approval, commission rule changes, access to PII (e.g. buyer contact). Reference it from IDENTITY and CRM/Financial flows.

### 6.2 Medium priority (security and resilience)

5. **Security scope document:** One short document or section: we do not store raw card data (gateway only); where secrets live (env, vault); HTTPS and secure headers; input validation and output encoding. Does not replace IDENTITY auth; complements it.
6. **Rate limiting:** Define rate-limiting strategy for public API (e.g. per IP and per user for authenticated) and for admin/seller APIs (per user or per role). INFRASTRUCTURE already mentions Redis for rate limiting; tie it to API boundaries.
7. **Job retention and queue hygiene:** Define retention for completed and failed jobs (e.g. delete or archive after N days) and, if needed, a separate archive or cold storage for job_failures for compliance.

### 6.3 Lower priority (optional scope)

8. **Feature flags:** Add only if product roadmap needs gradual rollouts or A/B; otherwise leave out.
9. **Analytics events:** If product/BI needs behavioral analytics (clicks, search, add to cart), add a short design for event types and pipeline (collection → storage/warehouse); otherwise domain events + CRM reports can suffice.
10. **Notification entity:** If in-app or push notifications are planned, add a notifications/channels model; otherwise keep email-as-job as is.
11. **Fraud/risk:** Document as out-of-scope for current phase or add a minimal “fraud signals” (e.g. ip_address, velocity) for later use; no full system required for initial audit.

### 6.4 What not to change

- Do not redesign catalog, product, order, financial, delivery, identity, events, CMS, CRM, or infrastructure entities and flows. The audit found no critical contradictions or missing core entities; only clarifications and additions for production operation, security, and scale.

---

*End of Architecture Audit Report.*

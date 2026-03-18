# CRM / Admin Operation Architecture

**Document type:** CRM and platform operations design (no code)  
**Audience:** Backend/frontend leads, operations  
**Context:** Manages product moderation, seller moderation, customer support, analytics, and platform operations. Builds on PRODUCT_ARCHITECTURE.md, ORDER_SYSTEM_ARCHITECTURE.md, IDENTITY_SYSTEM_ARCHITECTURE.md, MARKETPLACE_FINANCIAL_ARCHITECTURE.md, and DELIVERY_SYSTEM_ARCHITECTURE.md.

---

## STEP 1 — MODERATION

### 1.1 product_moderation_queue

- **Responsibility:** **Work queue** for products awaiting moderation. When a product’s moderation_status is **pending_moderation** (parser or import), it can be represented in this queue so CRM/Admin operators see a list of “to review” items. Optionally: priority, assignment, SLA. The queue is a **view or table** over products (or a denormalized list) so operators can filter, sort, assign, and act (approve/reject).
- **Columns (conceptual):** id, product_id (FK products), status (pending | in_review | approved | rejected), priority (int or enum: low | normal | high | urgent), assigned_to (nullable, user_id; which operator is reviewing), assigned_at (nullable), submitted_at (when product entered pending_moderation), reviewed_at (nullable), reviewed_by (nullable, user_id), resolution (approved | rejected), resolution_comment (nullable), created_at, updated_at. Optional: source (parser | manual | re_submit), category_id (denormalized for filters).
- **Relationship:** product_moderation_queue.product_id → products. One row per product in queue; when product is approved or rejected, queue row is updated (status = approved/rejected, reviewed_at, reviewed_by) and products.moderation_status is set accordingly. **Alternative:** No separate queue table — CRM lists products WHERE moderation_status = pending_moderation; assignment and notes live in crm_tasks or crm_notes linked to product_id. The **queue table** is useful when you need explicit assignment, priority, and SLA (e.g. “oldest first,” “assigned to me”).
- **Flow:** Parser (or import) sets product.moderation_status = pending_moderation → insert or update product_moderation_queue (status = pending). Operator opens CRM moderation view → sees queue (filter by assigned_to, priority, submitted_at). Operator assigns to self (assigned_to = user_id, status = in_review), reviews product, then approves or rejects → update products.moderation_status and product_moderation_queue (resolution, reviewed_by, reviewed_at). Optional: **moderation_events** (product_id, from_status, to_status, user_id, comment, created_at) for full audit.

### 1.2 seller_verification_queue

- **Responsibility:** **Work queue** for sellers awaiting verification. When a seller has submitted documents (seller_documents) and seller_verification.status is **pending**, the seller appears in this queue so operators can review documents and approve or reject verification.
- **Columns (conceptual):** id, seller_id (FK sellers), status (pending | in_review | verified | rejected), priority (optional), assigned_to (nullable, user_id), assigned_at (nullable), submitted_at (when verification was requested or last document uploaded), reviewed_at (nullable), reviewed_by (nullable, user_id), resolution (verified | rejected), resolution_comment (nullable), created_at, updated_at. Optional: verification_level (basic | full).
- **Relationship:** seller_verification_queue.seller_id → sellers. seller_verification and seller_documents are in IDENTITY_SYSTEM_ARCHITECTURE; this queue table adds **assignment and workflow** for the verification process. When operator verifies: update seller_verification.status = verified (or rejected), seller_verification.verified_by, verified_at; update seller_verification_queue (resolution, reviewed_by, reviewed_at). Optional: emit **seller_verified** domain event (PLATFORM_EVENT_ARCHITECTURE) when verified.
- **Flow:** Seller uploads documents → seller_documents rows (status = pending); seller_verification.status = pending. Insert or update seller_verification_queue (status = pending). Operator sees queue → assigns, opens seller profile and documents → approves or rejects documents (seller_documents.status) and seller_verification (status = verified | rejected); queue row updated.

### 1.3 Moderation Summary

- **Product moderation:** product_moderation_queue drives “what to review”; actions update products.moderation_status (and optionally moderation_events). Storefront shows only products with moderation_status = approved and visibility active.
- **Seller verification:** seller_verification_queue drives “which sellers to verify”; actions update seller_verification and seller_documents. Payout and trust rules use seller_verification.status.

---

## STEP 2 — CRM ENTITIES

### 2.1 crm_customers

- **Responsibility:** **CRM view of a customer** (buyer). Can be a dedicated table that aggregates identity and order data for CRM use (quick view: contact, order count, last order, total spent, support tickets) or a **virtual view** over users + orders. If a table: one row per “customer” (user_id or guest identified by email/phone). Used by support and CRM to see “who is this buyer,” attach notes and tasks, and run segments.
- **Columns (conceptual):** id, user_id (nullable, FK users; null for guest), email (nullable; from user or from first order’s buyer_guest_email), phone (nullable), display_name (nullable), first_order_at (nullable), last_order_at (nullable), order_count (int, default 0), total_spent (numeric, default 0), currency (optional), segment (optional: new | regular | vip | at_risk), created_at, updated_at. Optional: tags (JSON or separate table), source (web | app), last_contact_at.
- **Relationship:** crm_customers.user_id → users. For **guests:** create crm_customers row when first order is placed (email/phone from order); later if they register, link user_id and merge. CRM UI lists customers; drill-down to orders, notes, tasks. **Alternative:** No crm_customers table — CRM “customer” is users + aggregated stats computed from orders (API or materialized view). Dedicated table is useful for segments, tags, and offline CRM sync.

### 2.2 crm_notes

- **Responsibility:** **Notes** attached to a customer, order, return, seller, or product. Used by support and CRM to record conversations, decisions, and context. One note = one row; many notes per entity.
- **Columns (conceptual):** id, author_id (FK users; who wrote the note), entity_type (customer | order | return | seller | product), entity_id (polymorphic: user_id, order_id, order_return_id, seller_id, product_id), content (text), is_internal (boolean; if true, not shown to seller/buyer in their portal), created_at, updated_at. Optional: attachment_urls (JSON).
- **Relationship:** crm_notes.author_id → users. entity_type + entity_id identify the subject. CRM UI: “Notes for this order” → filter crm_notes WHERE entity_type = order AND entity_id = order_id. Same for customer (entity_type = customer, entity_id = user_id or crm_customer_id), seller, return, product.

### 2.3 crm_tasks

- **Responsibility:** **Tasks** for operators: follow-up on order, return, seller verification, product moderation, or generic “call customer,” “check payout.” Supports assignment, due date, status, and link to related entity.
- **Columns (conceptual):** id, title (string), description (optional text), task_type (order | return | seller_verification | product_moderation | payout | support | other), entity_type (nullable; order | return | seller | product | customer), entity_id (nullable), status (open | in_progress | done | cancelled), priority (low | normal | high | urgent), assigned_to (nullable, user_id), due_at (nullable), completed_at (nullable), created_by (user_id), created_at, updated_at. Optional: result_comment.
- **Relationship:** crm_tasks.assigned_to → users; crm_tasks.created_by → users. entity_type + entity_id link to order, return, seller, product, or customer. CRM dashboard: “My tasks,” “Overdue,” “By type.” When operator completes a task (e.g. “approve product”), they mark task done and perform the action (update product_moderation_queue and products.moderation_status). Tasks can be created manually or by system (e.g. “New return requested” → create crm_task for return).

### 2.4 CRM Entity Relationship

```
users (operators, buyers)
    │
    ├──► crm_customers (user_id; or guest by email/phone)
    │         └──► crm_notes (entity_type=customer, entity_id)
    │         └──► crm_tasks (entity_type=customer, entity_id)
    │
    ├──► crm_notes (author_id; entity_type/entity_id → order, return, seller, product)
    └──► crm_tasks (assigned_to, created_by; entity_type/entity_id)

orders ──► crm_notes, crm_tasks (entity_type=order)
returns ──► crm_notes, crm_tasks (entity_type=return)
sellers ──► crm_notes, crm_tasks (entity_type=seller)
products ──► crm_notes, crm_tasks (entity_type=product)
```

### 2.5 Customer Support Flow

- **Inbound:** Buyer or seller contacts support (chat, email, ticket). Support creates crm_customers row if new (or finds by email/phone). Create crm_task (task_type = support, entity_type = customer, entity_id = customer id). Add crm_notes as conversation progresses. Link task to order or return if relevant (entity_type/entity_id).
- **Order/return issue:** Operator opens order or return in CRM → sees crm_notes and crm_tasks for that entity. Can create task “Follow up refund,” assign, set due date. When refund is processed, mark task done and add note.
- **Seller verification:** Operator works from seller_verification_queue; can add crm_notes to seller (entity_type = seller, entity_id = seller_id) and crm_tasks (task_type = seller_verification, entity_id = seller_id).

---

## STEP 3 — ANALYTICS

### 3.1 sales_reports

- **Responsibility:** **Pre-aggregated sales metrics** for dashboards and exports. Can be a table of daily (or hourly) snapshots: GMV, order count, AOV, by channel/segment. Alternatively, “sales report” is a **query or view** over orders (group by date, status, seller); this section describes a **report table** for performance and caching.
- **Columns (conceptual):** id, report_date (date), period_type (day | week | month), currency, total_orders (count), total_gmv (sum of order total), total_refunded (sum of refunds), net_gmv (gmv − refunded), average_order_value (optional), new_customers_count (optional), created_at. Optional: breakdown by channel (source), by payment_method, by catalog_category (if stored at order level or aggregated from order_items). Unique (report_date, period_type) or one row per (report_date, period_type, dimension_value) for breakdowns.
- **Relationship:** Populated by a **scheduled job** that aggregates from orders and payment_transactions (refunds). CRM/Admin dashboard reads sales_reports for charts and KPIs. Raw orders remain source of truth; this table is derived.

### 3.2 seller_reports

- **Responsibility:** **Per-seller metrics** for platform and seller dashboard: sales, commission, payouts, order count, return rate. One row per seller per period (e.g. per month) or a view over order_items + platform_commissions + seller_transactions.
- **Columns (conceptual):** id, seller_id (FK sellers), report_date (date), period_type (day | week | month), orders_count, items_sold, gmv (sum of order_items.total_price for this seller), commission_total, net_earnings (gmv − commission), refunded_amount, return_count, payout_count, payout_total, created_at. Optional: top_products (JSON or separate table), top_categories.
- **Relationship:** seller_reports.seller_id → sellers. Populated by job aggregating order_items (seller_id), platform_commissions, seller_transactions (refund_debit, payout), returns (via return_lines → order_items.seller_id). Used by Admin “seller performance” and optionally by seller dashboard “your stats.”

### 3.3 product_reports

- **Responsibility:** **Per-product (or per category) metrics**: views, clicks, units sold, revenue, return rate. Can be a table of aggregates or a view over order_items + optional events (product_view, add_to_cart). Lightweight: order_items already give units_sold and revenue per product; product_reports can store daily/monthly rollups.
- **Columns (conceptual):** id, product_id (FK products), report_date (date), period_type (day | week | month), units_sold, revenue (sum of order_items.total_price for this product), order_count (orders containing this product), return_count (optional), return_rate (optional), created_at. Optional: category_id (denormalized), seller_id (denormalized). For **category reports:** category_id, report_date, period_type, products_count, units_sold, revenue (sum over products in category).
- **Relationship:** product_reports.product_id → products. Populated by job from order_items (product_id, quantity, total_price) and optionally return_lines. Used by Admin “product performance,” “category performance,” and merchandising.

### 3.4 Analytics Summary

- **Sales reports:** Platform-level GMV, orders, AOV, refunds; by period and optional dimensions. Table or materialized view; job updates periodically.
- **Seller reports:** Per-seller orders, GMV, commission, net, payouts, returns. Feeds seller dashboard and admin seller analytics.
- **Product reports:** Per-product (and optionally per category) units sold, revenue, returns. Feeds merchandising and admin product analytics.
- **Real-time vs batch:** Dashboards can read pre-aggregated tables (sales_reports, seller_reports, product_reports) for speed; “live” numbers can be queries over orders/order_items with a short time range. Export/reporting uses aggregated tables or direct query with date filter.

---

## STEP 4 — FINAL DOCUMENT (Summary)

### 4.1 Moderation (Recap)

| Entity | Purpose |
|--------|---------|
| **product_moderation_queue** | Work queue for products with moderation_status = pending_moderation; assignment, priority, resolution; actions update products.moderation_status. |
| **seller_verification_queue** | Work queue for sellers with seller_verification.status = pending; assignment, resolution; actions update seller_verification and seller_documents. |

### 4.2 CRM Entities (Recap)

| Entity | Purpose |
|--------|---------|
| **crm_customers** | CRM view of customer (user or guest): contact, order count, total spent, segment; link for notes and tasks. |
| **crm_notes** | Notes on customer, order, return, seller, product; author_id, entity_type, entity_id, content, is_internal. |
| **crm_tasks** | Tasks for operators: type, entity (order, return, seller, product, customer), status, assignment, due date. |

### 4.3 Analytics (Recap)

| Entity | Purpose |
|--------|---------|
| **sales_reports** | Platform sales aggregates by date/period: GMV, order count, AOV, refunds; optional breakdowns. |
| **seller_reports** | Per-seller aggregates: orders, GMV, commission, net, payouts, returns; by period. |
| **product_reports** | Per-product (and optionally category) aggregates: units sold, revenue, returns; by period. |

### 4.4 Platform Operations (Scope)

- **Product moderation:** product_moderation_queue + products.moderation_status; CRM/Admin UI lists queue, assign, approve/reject.
- **Seller moderation:** seller_verification_queue + seller_verification + seller_documents; CRM/Admin UI lists queue, review documents, verify/reject.
- **Customer support:** crm_customers, crm_notes, crm_tasks; link to orders, returns; support and CRM operators work from one place.
- **Analytics:** sales_reports, seller_reports, product_reports; dashboards and exports; jobs populate from orders, order_items, platform_commissions, seller_transactions, returns.
- **Other operations:** Parser control, delivery methods, commission rules, payouts (from MARKETPLACE_FINANCIAL_ARCHITECTURE, DELIVERY_SYSTEM_ARCHITECTURE) are configured in Admin; CRM focuses on moderation, support, and reporting. Optional: **crm_tickets** (support tickets with status, channel) if you need formal ticket system; otherwise crm_tasks + crm_notes can cover “support case” workflow.

### 4.5 Dependencies

- **PRODUCT_ARCHITECTURE:** products.moderation_status; product_moderation_queue references product_id.
- **IDENTITY_SYSTEM_ARCHITECTURE:** seller_verification, seller_documents, users; seller_verification_queue references seller_id; crm_notes/crm_tasks reference user_id (operators).
- **ORDER_SYSTEM_ARCHITECTURE:** orders, order_items, returns; crm_customers derived from orders (buyer); crm_notes/crm_tasks entity_type = order | return; sales_reports from orders.
- **MARKETPLACE_FINANCIAL_ARCHITECTURE:** platform_commissions, seller_transactions; seller_reports and sales_reports use these.
- **DELIVERY_SYSTEM_ARCHITECTURE:** shipments; optional for “fulfillment” tasks or reports.

### 4.6 Indexing (Conceptual)

- **product_moderation_queue:** (status), (assigned_to), (submitted_at), (priority).
- **seller_verification_queue:** (status), (assigned_to), (submitted_at).
- **crm_customers:** (user_id), (email), (phone), (segment).
- **crm_notes:** (entity_type, entity_id), (author_id), (created_at).
- **crm_tasks:** (assigned_to), (status), (due_at), (entity_type, entity_id), (task_type).
- **sales_reports:** (report_date), (period_type).
- **seller_reports:** (seller_id), (report_date), (period_type).
- **product_reports:** (product_id), (report_date), (period_type).

---

*End of CRM Operation Architecture.*

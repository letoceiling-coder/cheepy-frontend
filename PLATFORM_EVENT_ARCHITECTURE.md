# Platform Event Architecture

**Document type:** Domain event and event bus design for the marketplace (no code)  
**Audience:** Backend leads, integration  
**Context:** Builds on ORDER_SYSTEM_ARCHITECTURE.md, MARKETPLACE_FINANCIAL_ARCHITECTURE.md, DELIVERY_SYSTEM_ARCHITECTURE.md, IDENTITY_SYSTEM_ARCHITECTURE.md, and related docs. Defines domain events, event storage, subscribers/handlers, and async processing.

---

## STEP 1 — DOMAIN EVENTS

### 1.1 order_created

- **When:** An order record is created and persisted (e.g. at checkout, before or after payment; typically when order status = created and order_items + delivery are written).
- **Payload (conceptual):** order_id, order_number, buyer_user_id (nullable), buyer_guest_email (nullable), total, currency, created_at. Optional: item_count, seller_ids (list), delivery_amount. Subscribers use this to send confirmation email, update analytics, notify sellers of new order, or trigger inventory reservation.
- **Source:** Order service / checkout flow (ORDER_SYSTEM_ARCHITECTURE: orders, order_items).

### 1.2 payment_captured

- **When:** Payment gateway confirms capture; payment_transactions row (type = capture, status = success) is written and orders.paid_at is set; order status → paid.
- **Payload (conceptual):** order_id, payment_id, amount, currency, gateway_name, captured_at. Optional: buyer_user_id. Subscribers use this to credit seller_balance (MARKETPLACE_FINANCIAL_ARCHITECTURE), create platform_commissions, decrement product_stock, send “payment received” email, notify sellers to fulfill, or trigger shipment creation (one shipment per seller).
- **Source:** Payment service / gateway webhook handler.

### 1.3 shipment_shipped

- **When:** A shipment’s status is set to **shipped** (parcel handed to carrier; tracking_code set). DELIVERY_SYSTEM_ARCHITECTURE: shipment.status = shipped, shipped_at set.
- **Payload (conceptual):** shipment_id, order_id, seller_id, tracking_code, carrier_name, shipped_at. Optional: shipment_number. Subscribers use this to send “your order has shipped” to buyer, push tracking to buyer app, update order status to “shipped” if first shipment, or notify CRM.
- **Source:** Fulfillment / shipment service (seller dashboard or carrier webhook).

### 1.4 shipment_delivered

- **When:** A shipment is marked **delivered** (carrier or manual confirmation); shipment.status = delivered, delivered_at set; tracking_update (delivered) recorded.
- **Payload (conceptual):** shipment_id, order_id, seller_id, delivered_at. Optional: tracking_code. Subscribers use this to move seller balance from pending to available (if hold until delivery), send “order delivered” email, update order status to “delivered” when all shipments delivered, or trigger review request.
- **Source:** Delivery / tracking service (carrier webhook or manual update).

### 1.5 return_created

- **When:** A return request is created (order_returns row; status = requested or similar). ORDER_SYSTEM_ARCHITECTURE: returns, return_lines.
- **Payload (conceptual):** order_return_id, order_id, return_number, status, requested_at. Optional: seller_ids (from return_lines / order_items), reason. Subscribers use this to notify sellers of return request, notify support/CRM, send buyer “return received” email, or reserve stock for potential restock.
- **Source:** Return service (buyer or support creates return).

### 1.6 seller_verified

- **When:** Seller verification status is set to **verified** (seller_verification.status = verified). IDENTITY_SYSTEM_ARCHITECTURE: seller_verification, seller_documents.
- **Payload (conceptual):** seller_id, verified_at, verified_by (user_id, optional). Optional: verification_level. Subscribers use this to unlock payout eligibility, send “you’re verified” to seller, update trust badge, or notify admin.
- **Source:** Verification / admin workflow (after document review).

### 1.7 Optional Additional Events

- **payment_refunded:** Refund completed (payment_transactions type = refund); payload: order_id, payment_id, order_return_id (optional), amount. For seller balance debit, notifications, analytics.
- **order_cancelled:** Order status → cancelled; payload: order_id, reason. For stock restore, notifications, analytics.
- **product_moderation_approved:** Product moderation_status = approved; payload: product_id, category_id. For search index, notifications.

Domain events are **named and versioned** (e.g. order_created.v1) so subscribers can depend on a stable contract; payload schema may evolve with new optional fields and new versions.

---

## STEP 2 — EVENT BUS

### 2.1 domain_events

- **Responsibility:** **Append-only log** of every domain event emitted by the platform. Each row is one occurrence of an event; payload is serialized (JSON or JSONB). Enables replay, audit, and async dispatch to subscribers. Can also be the source of truth for “what happened” before writing to a queue or message broker.
- **Columns (conceptual):** id (PK, e.g. bigint or UUID), event_type (e.g. order_created, payment_captured), event_version (e.g. 1), aggregate_type (optional, e.g. order, payment, shipment), aggregate_id (optional, e.g. order_id or payment_id), payload (JSON/JSONB), occurred_at (timestamp), created_at (timestamp). Optional: correlation_id (for tracing), causation_id (id of event that caused this), metadata (JSON: user_id, ip, request_id). Unique ordering: id or (occurred_at, id) for deterministic replay.
- **Relationship:** domain_events is the log; no FK to other tables required (aggregate_id is logical reference). event_handlers or a dispatcher read from this table (or from a queue fed by it) to invoke subscribers.

### 2.2 event_subscribers

- **Responsibility:** **Registry** of which subscribers (consumers) exist and which event types they listen to. Used by the event bus to route events: when an event is published, find all subscribers for that event_type and dispatch (sync or async). Subscriber is a logical name (e.g. “order_confirmation_email”, “seller_balance_crediter”).
- **Columns (conceptual):** id, code (unique, e.g. order_confirmation_email, seller_balance_on_payment), name (display), event_type (e.g. order_created, payment_captured), is_active, created_at, updated_at. Optional: priority (order of execution if sync), run_async (boolean; default true). One row per (subscriber, event_type) if a subscriber handles multiple event types; or one row per subscriber and a separate table subscriber_events (subscriber_id, event_type).
- **Relationship:** event_subscribers reference event_type (string or FK to event_types table). event_handlers reference event_subscribers (which handler implementation to run for that subscriber).

### 2.3 event_handlers

- **Responsibility:** **Binding** between a subscriber and the concrete handler (e.g. class name, queue name, or webhook URL). In code, “handler” is the logic that runs when an event is dispatched to a subscriber; this table can store handler identifier (e.g. class/method or job name) and optional config (queue name, retry policy). Alternatively, event_handlers is the table that records **invocations** (event_id, subscriber_id, status, started_at, finished_at, error) for idempotency and monitoring; the “handler” implementation is in code. Design choice: (A) registry table (subscriber_id, handler_class, queue) or (B) execution log (event_id, subscriber_id, status). Below: (A) for routing, plus optional (B) for audit.
- **Columns (conceptual) — registry style:** id, event_subscriber_id (FK event_subscribers), handler_type (e.g. class | queue | webhook), handler_target (e.g. FullyQualified\Class\Name, or queue name, or URL), config (JSON: queue options, retry count, timeout), created_at, updated_at. **Execution log style (optional):** event_deliveries or event_handler_runs: id, domain_event_id (FK domain_events), event_subscriber_id (FK event_subscribers), status (pending | running | completed | failed), started_at, finished_at (nullable), error_message (nullable), retry_count, created_at. Unique (domain_event_id, event_subscriber_id) for idempotent “deliver once per subscriber per event.”
- **Relationship:** event_handlers.event_subscriber_id → event_subscribers. When an event is published: load domain_events row(s) or push to queue; for each event_subscriber where event_type = event.event_type and is_active, load event_handlers and dispatch (invoke handler or enqueue job). Optional: event_deliveries record each delivery attempt for replay and monitoring.

### 2.4 Event Flow (Conceptual)

1. **Publish:** Application code (e.g. after creating order) inserts into **domain_events** (event_type, payload, occurred_at). Optionally, same process or a trigger pushes event to an in-process bus or message queue.
2. **Dispatch:** A dispatcher (job or daemon) reads **domain_events** (or consumes from queue). For each event, queries **event_subscribers** where event_type = X and is_active. For each subscriber, looks up **event_handlers** and enqueues a job (or calls handler synchronously). Optionally writes **event_deliveries** (domain_event_id, event_subscriber_id, status = pending).
3. **Handle:** Worker runs the handler (e.g. “send order confirmation email”). Handler loads event payload from domain_events or from job payload. On success: mark event_deliveries status = completed. On failure: mark failed, retry according to config (re-queue or dead-letter).
4. **Replay:** To reprocess events, re-dispatch from domain_events (e.g. by event_type and occurred_at range) and re-run handlers; idempotency keys (event_id + subscriber_id) prevent duplicate side effects if handlers are idempotent.

### 2.5 Entity Relationship

```
domain_events (event_type, payload, occurred_at)
    │
    │  dispatch
    ▼
event_subscribers (event_type, code, is_active)
    │
    └──► event_handlers (handler_type, handler_target, config)

optional: event_deliveries (domain_event_id, event_subscriber_id, status)
```

---

## STEP 3 — EVENT PROCESSING

### 3.1 Async Processing (Why)

- **Decouple:** The flow that creates an order (or captures payment) does not wait for email sending, analytics, or seller balance update. It only writes the event; subscribers run in background. This keeps checkout and payment APIs fast and avoids cascading failures (e.g. email service down should not block order creation).
- **Scale:** Handlers can run on separate workers; multiple workers can consume from a queue. Heavy subscribers (e.g. search index update) do not block light ones (e.g. send email).
- **Reliability:** Events are persisted in domain_events. If a handler fails, the event is still there; retry (with backoff) or dead-letter and manual replay. No “fire and forget” loss.

### 3.2 How Async Is Achieved

- **Option A — Database as queue:** domain_events is the log. A worker process (or cron) selects rows where id > last_processed_id (or status = pending_dispatch), dispatches to subscribers by enqueueing **handler jobs** (e.g. in a jobs table: job_type = “handle_event”, payload = { event_id, subscriber_id }). Another worker runs these jobs. Mark domain_events or a separate event_deliveries row as “dispatched” / “completed” to avoid duplicate dispatch. Simple, no extra infra; good for moderate volume.
- **Option B — Message queue (Redis, RabbitMQ, Kafka):** After inserting into domain_events, the publisher (or a sync listener) pushes the event (or event_id) to a queue or topic. Workers consume from the queue and run the handler. Event payload can be in the message or loaded from domain_events by event_id. Gives at-least-once delivery, retries, and dead-letter; scales well. domain_events remains the audit log; queue is the transport.
- **Option C — Hybrid:** Write domain_events first (source of truth). A single “event_dispatcher” job or process reads new domain_events and pushes one message per (event, subscriber) to a queue. Workers run handlers from the queue. event_deliveries can record status per (event_id, subscriber_id) for idempotency (skip if already completed) and monitoring.

### 3.3 Ordering and Idempotency

- **Ordering:** For a single aggregate (e.g. one order), events usually have a natural order (order_created before payment_captured before shipment_shipped). Subscribers that care about order can use occurred_at or sequence; or process events per aggregate_id in order. Cross-aggregate ordering is not guaranteed unless a single queue per aggregate or partitioning is used.
- **Idempotency:** Handlers should be **idempotent**: processing the same event twice (e.g. retry after failure) should not double-apply side effects. Use (event_id, subscriber_id) as idempotency key: before running handler, check if this (event_id, subscriber_id) already completed; if yes, skip. Store completion in event_deliveries or in a dedicated idempotency_keys table.

### 3.4 Retries and Dead Letter

- **Retry:** On handler failure (exception, timeout), re-queue the job with retry_count += 1. Backoff: delay increases with retry_count (e.g. 1min, 5min, 15min). Max retries (e.g. 3 or 5) then move to dead letter.
- **Dead letter:** Events (or jobs) that failed after max retries are stored in a dead_letter table or queue for manual inspection and replay. Alert ops so failed handlers are fixed and events replayed.

### 3.5 At-Least-Once and Exactly-Once

- **At-least-once:** Default when using queues: a handler may run more than once (e.g. after retry or consumer restart). Idempotency ensures correctness.
- **Exactly-once:** Harder; requires transactional outbox (write domain_events and business data in same transaction) and exactly-once consumption (e.g. Kafka consumer with transactional commit). For most marketplace use cases, at-least-once + idempotent handlers is sufficient.

---

## STEP 4 — FINAL DOCUMENT (Summary)

### 4.1 Domain Events (Recap)

| Event | When | Typical subscribers |
|-------|------|----------------------|
| **order_created** | Order record created (checkout) | Confirmation email, analytics, seller notification, inventory reserve |
| **payment_captured** | Payment captured; order paid | Seller balance credit, commission, stock decrement, “paid” email, create shipments |
| **shipment_shipped** | Shipment status = shipped | Buyer “shipped” email, tracking push, order status update |
| **shipment_delivered** | Shipment status = delivered | Balance hold release, “delivered” email, order delivered, review request |
| **return_created** | Return request created | Seller notification, CRM/support, buyer email |
| **seller_verified** | Seller verification = verified | Payout unlock, seller email, trust badge |

### 4.2 Tables (Recap)

| Entity | Purpose |
|--------|---------|
| **domain_events** | Append-only event log: event_type, version, aggregate_id, payload, occurred_at. |
| **event_subscribers** | Registry: subscriber code, event_type(s), is_active. |
| **event_handlers** | Binding: subscriber → handler (class/queue/webhook) and config. Optional: event_deliveries for per-event, per-subscriber status and idempotency. |

### 4.3 Dependencies

- **ORDER_SYSTEM_ARCHITECTURE:** order_created, payment_captured, return_created reference orders, payments, returns.
- **DELIVERY_SYSTEM_ARCHITECTURE:** shipment_shipped, shipment_delivered reference shipments.
- **MARKETPLACE_FINANCIAL_ARCHITECTURE:** payment_captured triggers seller balance and commission; shipment_delivered can trigger hold release.
- **IDENTITY_SYSTEM_ARCHITECTURE:** seller_verified references seller_verification.

### 4.4 Async Processing (Recap)

- Publish: write **domain_events**; optionally push to message queue.
- Dispatch: for each event, find **event_subscribers** for that event_type; for each subscriber, enqueue handler job (or invoke via **event_handlers**).
- Handle: workers run handlers; idempotency by (event_id, subscriber_id); retry with backoff; dead letter after max retries.
- domain_events is the audit log and replay source; queue is the transport for async, at-least-once delivery.

### 4.5 Indexing (Conceptual)

- **domain_events:** (event_type), (occurred_at), (aggregate_type, aggregate_id), (created_at) for replay and cleanup.
- **event_subscribers:** (event_type), (is_active), (code unique).
- **event_handlers:** (event_subscriber_id).
- **event_deliveries (optional):** (domain_event_id, event_subscriber_id unique), (status), (created_at).

---

*End of Platform Event Architecture.*

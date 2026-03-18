# Order System Architecture

**Document type:** Order and checkout system design for the marketplace (no code)  
**Audience:** Backend/frontend leads, product owner  
**Context:** Builds on CATALOG_ARCHITECTURE_V2.md, ATTRIBUTE_ENGINE_ARCHITECTURE.md, and PRODUCT_ARCHITECTURE.md. Defines cart, checkout, orders, payments, delivery, and returns.

---

## STEP 1 — ANALYZE CURRENT ORDER FLOW

### 1.1 How Orders Would Work with Existing Product Architecture

**Current product model (as implemented today)**

- **products** has: id, external_id, title, price, price_raw, description, category_id, seller_id, brand_id, status, product_photos, product_attributes. No **product_variants**, no **product_stock**, no **product_prices** table.
- One product row = one purchasable item. Price is on the product; there is no sellable SKU (variant) to put in a cart or order line.

**Hypothetical flow with current schema**

1. **Cart:** Would store product_id and quantity. No variant_id (no variants). Cart would need a table (e.g. cart_items: session_id or user_id, product_id, quantity). Price shown in cart would come from product.price / product.price_raw; if price changes between add and checkout, no snapshot exists.
2. **Checkout:** Buyer enters shipping and payment. No stock check (no product_stock table) → risk of oversell. No reserved quantity; concurrent checkouts can claim the same “unit.”
3. **Order creation:** Would create an **orders** row (buyer, totals, status) and **order_items** (order_id, product_id, quantity, unit_price). Unit price must be copied from product at order time to preserve history; current schema does not define where “price at order time” is stored (only current product.price). Seller is derived from product.seller_id per line; multi-seller order would be one order with multiple sellers (no split by seller in current design).
4. **Payment:** No **payments** or **payment_transactions** tables. Payment would be external (gateway); no link from order to payment id or status.
5. **Fulfillment:** No **product_stock** to decrement. No **delivery** or **delivery_tracking**; no shipping address or carrier data on the order.
6. **Returns:** No **returns** table; no way to record which items were returned or to restore stock.

So with the **current** product architecture, a minimal order flow would: add product_id + quantity to cart; at checkout copy product.price_raw into order_items.unit_price and create order + order_items; then rely on external payment and manual fulfillment. Stock would not be enforced; delivery and returns would be out of scope or ad hoc.

**With the designed product architecture (PRODUCT_ARCHITECTURE.md)**

- **Sellable unit** is **product_variant** (or product when no variants). Cart and order must reference **variant_id** (nullable when product has no variants) so that the correct SKU, price, and stock are used.
- **Price** comes from **product_prices** (per product or variant); at order creation, “price at order time” is snapshotted in order_items to avoid changes after checkout.
- **Stock** is in **product_stock** (per variant or product). At checkout: validate quantity ≤ quantity_available; optionally reserve (quantity_reserved += quantity) until payment confirmed or timeout; on order creation decrement quantity_available and clear reservation.
- **Seller:** Each product has seller_id; order_items reference product_id and variant_id, so seller is derived from product. One order can contain items from multiple sellers; fulfillment and settlement may be per-seller (split shipments, per-seller payouts). No **product_offers** in current design, so one product = one seller.

Even with the designed product model, the following are still **missing** for a full order system: cart and cart_items; orders and order_items; order status and history; payments and payment_transactions; delivery (shipping address, method, cost) and delivery_tracking; returns (items, reason, status, restock). The sections below design these.

### 1.2 Missing Components (Summary)

| Component | Purpose | Current state |
|-----------|---------|----------------|
| **Cart** | Hold items before checkout (product/variant, quantity) | Not present. Need cart + cart_items keyed by session or user. |
| **Cart items** | Link cart to product/variant, quantity, snapshot price (optional) | Not present. |
| **Orders** | Commit purchase: buyer, totals, status, shipping, seller split | Not present. |
| **Order items** | Order lines: product_id, variant_id, quantity, unit_price, seller (denormalized) | Not present. |
| **Order status** | Lifecycle: created → paid → processing → shipped → delivered (and cancelled, returned) | Not present. |
| **Payments** | Link order to payment method and gateway; capture amount | Not present. |
| **Payment transactions** | Log charges, refunds, gateway id, status | Not present. |
| **Delivery** | Shipping address, method, cost, carrier; link to order | Not present. |
| **Delivery tracking** | Parcel/carrier tracking events and status | Not present. |
| **Returns** | Return request, items, reason, status, restock | Not present. |
| **Buyer identity** | Who places the order (user or guest) | Out of scope of catalog; assumed as user_id or session/guest token. |

---

## STEP 2 — DESIGN ORDER ENTITIES

### 2.1 Cart and Cart Items

**cart**

- **Responsibility:** One basket per buyer (or guest) before checkout. Identified by user_id (logged-in) or session_id / guest_token (anonymous). One active cart per identity; merging guest cart into user cart on login is application logic.
- **Columns (conceptual):** id, user_id (nullable), session_id (nullable), guest_token (nullable), currency (default store currency), created_at, updated_at. At least one of user_id, session_id, or guest_token is set. Unique constraint or business rule: one cart per user_id when present; one per session_id or guest_token when no user.
- **Relationship:** One cart has many cart_items. Cart is abandoned when no checkout; optional TTL or cleanup job.

**cart_items**

- **Responsibility:** One line per product/variant in the cart. Stores quantity and optionally snapshot of unit_price and product title/variant name for display; price at checkout is re-read from product_prices (or product) and validated.
- **Columns (conceptual):** id, cart_id (FK cart), product_id (FK products), variant_id (nullable, FK product_variants), quantity (positive int), created_at, updated_at. Optional: unit_price_snapshot, product_title_snapshot, variant_name_snapshot (for cart UI without joining product). Unique (cart_id, product_id, variant_id) so the same SKU is one line with summed quantity, or allow multiple lines and merge at checkout.
- **Relationship:** cart_items.cart_id → cart. cart_items.product_id → products; cart_items.variant_id → product_variants. Price and availability are resolved at read time from product_prices and product_stock (and product visibility/moderation). Seller is derived from product.seller_id.

### 2.2 Orders and Order Items

**orders**

- **Responsibility:** The committed purchase. Immutable after creation for line items; status and payment/delivery/return state evolve.
- **Columns (conceptual):** id, order_number (unique, human-readable, e.g. ORD-2025-00001), buyer_user_id (nullable), buyer_guest_email (nullable), buyer_phone (optional), status (FK or enum: see order_status), currency, subtotal (sum of order_items before delivery/discount), delivery_amount, discount_amount, tax_amount (optional), total, created_at, updated_at, paid_at (nullable), shipped_at (nullable), delivered_at (nullable). Optional: notes, source (web | app | admin), ip_address for fraud.
- **Relationship:** orders have many order_items; one order has one current order_status (or status column); one order has one delivery (shipping); one order can have one or more payments; one order can have zero or more returns.

**order_items**

- **Responsibility:** One line per product/variant purchased. Snapshots price and seller at order time; immutable.
- **Columns (conceptual):** id, order_id (FK orders), product_id (FK products), variant_id (nullable, FK product_variants), seller_id (FK sellers, denormalized from product), quantity, unit_price (numeric, at order time), total_price (quantity * unit_price), product_title_snapshot, variant_name_snapshot (optional), created_at. Optional: sku_snapshot, tax_amount.
- **Relationship:** order_items.order_id → orders. order_items.product_id → products; order_items.variant_id → product_variants; order_items.seller_id → sellers. Fulfillment and returns reference order_item_id.

### 2.3 Order Status

**order_status**

- **Responsibility:** Lifecycle state of the order. Can be a table (order_status_id on orders, with history in order_status_history) or an enum/column on orders. For audit trail, a history table is useful.
- **Columns (conceptual) — status table:** id, code (unique, e.g. created, paid, processing, shipped, delivered, returned, cancelled), name, description, sort_order. **order_status_history:** id, order_id, order_status_id (or status code), created_at, created_by (user_id or system). orders.status_id → order_status or orders.status (enum).
- **Relationship:** orders have one current status; order_status_history gives ordered list of transitions. See STEP 4 for allowed transitions.

### 2.4 Payments and Payment Transactions

**payments**

- **Responsibility:** Link an order to a payment attempt or capture. One order can have one payment (simple) or multiple (split payment, partial refund then new charge). Holds method and high-level state.
- **Columns (conceptual):** id, order_id (FK orders), amount, currency, method (card | bank | wallet | cash_on_delivery | other), status (pending | authorized | captured | failed | cancelled | refunded), gateway_name (e.g. stripe, yookassa), gateway_payment_id (external id), created_at, updated_at, captured_at (nullable). Optional: payer_email, payer_id, metadata (JSON).
- **Relationship:** payments.order_id → orders. One order can have several payments (e.g. one failed, one succeeded). payment_transactions belong to a payment.

**payment_transactions**

- **Responsibility:** Immutable log of money movements: charge, capture, refund, partial_refund. Enables reconciliation and dispute handling.
- **Columns (conceptual):** id, payment_id (FK payments), type (authorize | capture | refund | partial_refund), amount, currency, status (success | failed | pending), gateway_transaction_id (nullable), gateway_response (JSON, optional), created_at. Optional: reason (e.g. refund reason), order_return_id (FK when type = refund).
- **Relationship:** payment_transactions.payment_id → payments. Refunds may link to returns (order_return_id).

### 2.5 Delivery and Delivery Tracking

**delivery**

- **Responsibility:** Shipping data for one order. One order = one delivery (one shipment); if marketplace supports split shipments by seller, one order could have multiple delivery rows (order_id, seller_id) — design choice. Here we assume one delivery per order for simplicity.
- **Columns (conceptual):** id, order_id (FK orders), method (courier | pickup | postal | other), carrier_name (nullable), carrier_service (nullable), cost (numeric), currency, status (pending | label_created | picked_up | in_transit | delivered | failed), shipping_address (JSON or FK to address: full_name, phone, country, region, city, street, building, apartment, postal_code), estimated_delivery_from, estimated_delivery_to (optional), created_at, updated_at.
- **Relationship:** delivery.order_id → orders. delivery_tracking rows belong to delivery.

**delivery_tracking**

- **Responsibility:** Time-ordered events from carrier or manual updates: accepted, in_transit, out_for_delivery, delivered, exception.
- **Columns (conceptual):** id, delivery_id (FK delivery), status (carrier status code or normalized: accepted | in_transit | out_for_delivery | delivered | exception), description (optional text), location (optional), occurred_at, created_at. Optional: carrier_tracking_code, carrier_event_id.
- **Relationship:** delivery_tracking.delivery_id → delivery. Ordered by occurred_at for timeline UI.

### 2.6 Returns

**returns (order_returns)**

- **Responsibility:** A return request for one order (full or partial). Contains reason, status, and which items/quantities are returned; links to refund and restock.
- **Columns (conceptual):** id, order_id (FK orders), return_number (unique, e.g. RET-2025-00001), status (requested | approved | received | inspected | refunded | rejected), reason (optional code or text), comment (optional), requested_at, approved_at (nullable), received_at (nullable), refunded_at (nullable), created_at, updated_at. Optional: refund_amount, restock_completed_at.
- **Relationship:** order_id → orders. Many return_lines per return. Refund is recorded in payment_transactions (refund type) and optionally payment_id or order_return_id. product_stock is increased when return is received/inspected (restock).

**return_lines (order_return_items)**

- **Responsibility:** Which order items and how many units are returned.
- **Columns (conceptual):** id, order_return_id (FK returns), order_item_id (FK order_items), quantity (returned quantity, ≤ order_items.quantity), condition (ok | damaged | other), created_at.
- **Relationship:** return_lines.order_return_id → returns; return_lines.order_item_id → order_items. Restock uses order_items.variant_id (or product_id) and return_lines.quantity to update product_stock.

### 2.7 Entity Relationship Diagram

```
buyer (user_id / session_id / guest)
    │
    ▼
  cart ──► cart_items ──► product_id, variant_id (products, product_variants)
    │
    │  checkout
    ▼
  orders ──► order_status (current + history)
    │
    ├──► order_items ──► product_id, variant_id, seller_id (products, product_variants, sellers)
    ├──► payments ──► payment_transactions
    ├──► delivery ──► delivery_tracking
    └──► returns (order_returns) ──► return_lines (order_item_id)
```

---

## STEP 3 — CHECKOUT FLOW

### 3.1 Cart → Checkout → Payment → Order Creation

**Step 1 — Cart**

- Buyer adds product/variant and quantity to cart (cart_items). If cart does not exist, create cart (by session_id or user_id). Validate product is visible and (if product_stock exists) quantity ≤ quantity_available; optionally reserve stock (product_stock.quantity_reserved += quantity) with a short TTL to reduce oversell. Cart UI reads current price from product_prices (or product) and shows subtotal.

**Step 2 — Checkout start**

- Buyer proceeds to checkout. Collect: shipping address (or select saved), delivery method (if multiple), contact (email, phone). Re-validate all cart items: still visible, still in stock, price still available. If any item fails (out of stock, removed, price changed), update or remove line and inform buyer. Calculate: subtotal (from current product_prices), delivery cost (by method/address), discount (if any), tax (if any), total. Optionally create a **checkout session** or **order draft** (pending order row with status = draft) to hold reserved stock and snapshot; or defer order creation until after payment success.

**Step 3 — Payment**

- Buyer chooses payment method. Frontend sends payment method and order total to backend. Backend: create **orders** row (status = created), **order_items** from cart (with unit_price snapshot from product_prices/product), **delivery** row (address, method, cost). Create **payments** row (status = pending), call payment gateway (authorize or capture). On gateway success: create **payment_transactions** (type = capture, status = success), set payments.status = captured, set orders.paid_at, set order status to **paid**. Decrement **product_stock** (quantity_available -= quantity; quantity_reserved -= quantity if reservation was used). Clear or lock cart (delete cart_items or mark cart as converted). On gateway failure: set payments.status = failed, create payment_transactions (failed); order remains in status **created** or **pending_payment**; optional retry or cancel order and release reservation.

**Step 4 — Order created and confirmed**

- Order is in status **paid**. Buyer sees confirmation (order_number, total, delivery details). Seller/Admin sees order in “paid” or “processing” queue. Fulfillment: pick, pack, create shipping label; update **delivery** (carrier, tracking code, status) and **delivery_tracking** (in_transit, etc.). When parcel is delivered: delivery_tracking (delivered), delivery.status = delivered, orders.delivered_at, order status → **delivered**.

**Optional: reservation and draft order**

- To reduce oversell between “checkout” and “payment success,” reserve stock when checkout starts (or when payment is initiated). Reservation TTL (e.g. 15–30 minutes); on timeout or cart abandon, release reservation. On payment success, convert reservation into permanent stock decrement. If using draft order: create order with status = draft or pending_payment, create order_items, reserve stock; on payment success set status = paid and decrement stock; on failure or timeout set status = cancelled and release reservation.

### 3.2 Flow Summary

```
Cart (cart_items)
  → Validate stock & price
  → Checkout: address, delivery method, totals
  → Create order (status = created) + order_items + delivery + payment (pending)
  → Gateway: authorize/capture
  → Success: payment_transactions (capture), order status = paid, decrement stock, clear cart
  → Failure: payment failed; order stays created/pending_payment; release reservation if any
```

---

## STEP 4 — ORDER LIFECYCLE

### 4.1 Statuses

| Status | Meaning |
|--------|--------|
| **created** | Order record created; payment not yet completed (or pending at gateway). |
| **paid** | Payment captured; order is confirmed. Ready for fulfillment. |
| **processing** | Seller/warehouse is preparing the order (pick, pack, label). |
| **shipped** | Parcel handed to carrier or sent; tracking may be available. |
| **delivered** | Parcel delivered to buyer (from carrier or manual confirmation). |
| **returned** | Full or partial return completed; refund and restock done (or in progress). |
| **cancelled** | Order cancelled before or after payment. If after payment, refund must be recorded. |

Optional intermediate statuses: **pending_payment** (awaiting gateway callback), **refunded** (if you want a distinct “refunded” state from **returned**). **returned** can mean “at least one return processed”; if full return and full refund, order can stay **returned** or move to **refunded** by policy.

### 4.2 Transitions

- **created** → **paid**: Payment captured successfully.
- **created** → **cancelled**: Buyer or system cancels before payment; release reservation.
- **paid** → **processing**: Fulfillment started (manual or automatic).
- **processing** → **shipped**: Shipment created; tracking added to delivery.
- **shipped** → **delivered**: Carrier or manual confirmation of delivery.
- **paid** | **processing** | **shipped** → **returned**: Return requested and processed (partial or full); refund and restock applied. Optionally **delivered** → **returned** when return is received.
- **created** | **paid** | **processing** → **cancelled**: Cancellation; if already paid, refund via payment_transactions and restock.

Invalid transitions (examples): **delivered** → **processing**; **cancelled** → **paid**; **returned** → **shipped**. Enforce in application logic or with a state machine (allowed_transitions matrix).

### 4.3 Order Status History

- **order_status_history:** For each transition, insert (order_id, from_status, to_status or status_id, created_at, created_by). Enables “timeline” and auditing. Current status is the latest row or orders.status_id.

### 4.4 Payment and Stock Impact

- **created → paid:** Decrement product_stock; create payment_transactions (capture). Release any temporary reservation.
- **paid → cancelled:** Refund (payment_transactions type = refund); restore product_stock for all order_items.
- **returned:** For each return_line, restore product_stock (quantity_available += quantity); create payment_transactions (refund). Mark return as refunded.

---

## STEP 5 — FINAL DOCUMENT (Summary)

### 5.1 Table Summary

| Entity | Purpose |
|--------|---------|
| **cart** | One basket per buyer/session/guest; holds cart_items. |
| **cart_items** | Lines: cart_id, product_id, variant_id, quantity; optional price/title snapshot. |
| **orders** | Committed purchase: buyer, totals, status, paid_at, timestamps. |
| **order_items** | Lines: order_id, product_id, variant_id, seller_id, quantity, unit_price, snapshots. |
| **order_status** | Status codes (created, paid, processing, shipped, delivered, returned, cancelled). |
| **order_status_history** | Audit of status transitions (order_id, from, to, at, by). |
| **payments** | Link order to gateway; amount, method, status, gateway_payment_id. |
| **payment_transactions** | Log: authorize, capture, refund; amount, status, gateway_transaction_id. |
| **delivery** | One per order: method, carrier, cost, address, status, estimates. |
| **delivery_tracking** | Events per delivery: status, description, occurred_at. |
| **returns (order_returns)** | Return request: order_id, status, reason, requested_at, refunded_at. |
| **return_lines** | order_return_id, order_item_id, quantity, condition; drive restock and refund. |

### 5.2 Dependencies on Product and Catalog

- **PRODUCT_ARCHITECTURE:** Cart and order items reference **product_id** and **variant_id**. Price at checkout from **product_prices** (or product); snapshot in order_items. **product_stock** decremented on order paid; restored on cancel or return.
- **CATALOG_ARCHITECTURE_V2:** **sellers** linked to products; order_items denormalize seller_id from product for fulfillment and reporting. **catalog_categories** only indirectly (product belongs to category; order does not store category).

### 5.3 Checkout and Lifecycle (Recap)

- **Checkout:** Cart → validate stock/price → collect address and delivery → create order + order_items + delivery + payment → gateway capture → on success: paid, decrement stock, clear cart. Optional: reserve stock during checkout; draft order until payment.
- **Lifecycle:** created → paid → processing → shipped → delivered. Side paths: created/paid/processing → cancelled (refund + restock); any → returned (return_lines + refund + restock).

### 5.4 Indexing (Conceptual)

- **cart:** (user_id), (session_id), (guest_token), (updated_at) for cleanup.
- **cart_items:** (cart_id), (product_id, variant_id) for uniqueness/merge.
- **orders:** (buyer_user_id), (order_number unique), (status), (created_at).
- **order_items:** (order_id), (seller_id) for seller dashboards.
- **payments:** (order_id), (gateway_payment_id), (status).
- **payment_transactions:** (payment_id), (created_at).
- **delivery:** (order_id), (status).
- **delivery_tracking:** (delivery_id), (occurred_at).
- **returns:** (order_id), (return_number unique), (status).
- **return_lines:** (order_return_id), (order_item_id).

---

*End of Order System Architecture.*

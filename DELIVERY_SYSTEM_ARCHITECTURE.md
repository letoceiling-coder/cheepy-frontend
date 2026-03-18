# Delivery System Architecture

**Document type:** Delivery and logistics system design for the marketplace (no code)  
**Audience:** Backend/frontend leads, operations  
**Context:** Builds on PRODUCT_ARCHITECTURE.md, ORDER_SYSTEM_ARCHITECTURE.md, and MARKETPLACE_FINANCIAL_ARCHITECTURE.md. Defines delivery methods, zones, rates, shipments, and tracking in a multi-seller model.

---

## STEP 1 — ANALYZE DELIVERY FLOW

### 1.1 How Delivery Works in a Multi-Seller Marketplace

**Single-seller order**

- One order contains order_items from a single seller. One **shipment** is created: the seller packs all items and hands one parcel to a carrier. The buyer receives one delivery; one tracking code; one address. Delivery cost can be calculated at checkout (from delivery_methods and shipping_zones) and stored on the order (delivery_amount). The shipment is linked to the order and the seller.

**Multi-seller order**

- One order contains order_items from **multiple sellers** (e.g. item 1 from Seller A, items 2–3 from Seller B). Each seller fulfills from their own location. Therefore:
  - **One order → multiple shipments.** Each shipment is tied to one seller and contains only that seller’s order_items. The buyer may receive several parcels on different dates, each with its own tracking.
  - **Delivery cost:** Can be one total for the order (single delivery_amount; platform or one seller absorbs multi-parcel logic) or **split per shipment**: each shipment has its own cost, and order.delivery_amount = sum of shipment costs (or a rule: first shipment full price, others discounted/free). Checkout must either show one combined shipping fee or a breakdown per seller/shipment.
  - **Fulfillment responsibility:** Seller A is responsible for creating and sending shipment 1 (their items); Seller B for shipment 2. The platform may provide label generation (carrier API) or the seller uses their own carrier account; in either case the platform records the shipment and tracking.
  - **Returns:** Each return is per order_item; the returned item goes back to **that item’s seller**. Return shipment (if any) is linked to the original shipment or to the return request; tracking can be stored similarly (return_shipment or tracking on return).

**Flow summary**

1. **Checkout:** Buyer enters shipping address. Platform determines **shipping_zone** (e.g. by country/region/postcode). Available **delivery_methods** and **delivery_rates** for that zone (and optionally cart weight/seller count) are shown. Buyer selects method; **delivery_amount** is set on the order (one total or sum of per-shipment estimates).
2. **Order paid:** Order is created with order_items (each with seller_id). For each **distinct seller** in the order, a **shipment** is created (order_id, seller_id). **shipment_items** link each shipment to the relevant order_items (seller_id match). Shipment status = **created**. Each seller sees “their” shipment in a seller dashboard.
3. **Fulfillment:** Seller packs the items, marks shipment as **packed**, optionally creates a label (carrier API or manual). When parcel is handed to carrier, shipment status → **shipped**; **tracking_updates** (or delivery_tracking) record carrier events. Carrier sends updates (webhook or poll): **in_transit**, **out_for_delivery**, **delivered** (or **exception**). Platform stores each event as a tracking_update.
4. **Order status:** Order status “shipped” when at least one shipment is shipped; “delivered” when all shipments are delivered (or by policy: e.g. order delivered when last shipment delivered). ORDER_SYSTEM_ARCHITECTURE’s delivery table can be replaced or extended by **shipments** (one row per parcel); order-level delivery_amount and shipping_address remain on the order or duplicated per shipment for label/display.
5. **Returns:** Buyer requests return for specific order_items. Return shipment (if applicable) is to the seller’s address; return can have its own tracking. Shipment status **returned** or a separate return_shipment entity can record return logistics.

### 1.2 Design Implications

- **Shipment = one parcel from one seller for one order.** So: shipments.order_id, shipments.seller_id; shipment_items.shipment_id, shipment_items.order_item_id (each order_item belongs to exactly one shipment, the one for its seller).
- **Rates and methods** are platform-level (or seller-overridable later): delivery_methods, shipping_zones (e.g. by country/region), delivery_rates (zone + method → cost or rule). At checkout, address → zone → available methods and total delivery cost.
- **Tracking** is per shipment: one tracking code per shipment (or per parcel); tracking_updates are time-ordered events for that shipment. Order-level “tracking” is derived: list of all shipments and their tracking codes/status.
- **Delivery cost allocation:** If order has one delivery_amount, it can be allocated to shipments for seller settlement (e.g. proportional to shipment weight or item total) in MARKETPLACE_FINANCIAL_ARCHITECTURE; or each shipment has shipment.cost and order.delivery_amount = sum(shipment.cost).

---

## STEP 2 — DESIGN DELIVERY ENTITIES

### 2.1 delivery_methods

- **Responsibility:** Catalog of **how** the buyer can receive goods: courier, postal, pickup point, express, etc. Used at checkout to show options and to link to delivery_rates and later to carrier integration.
- **Columns (conceptual):** id, code (unique, e.g. standard_courier, express, pickup_point, postal), name (display), description (optional), carrier_name (nullable; e.g. DHL, local post), carrier_service_code (nullable; carrier’s service id), is_active, sort_order, estimated_days_min, estimated_days_max (optional), created_at, updated_at. Optional: requires_dimensions, requires_weight.
- **Relationship:** delivery_rates reference delivery_method_id. Shipments reference delivery_method_id (which method was chosen for that shipment). No direct seller_id; methods are platform-wide unless extended with seller overrides.

### 2.2 shipping_zones

- **Responsibility:** Define **where** the platform (or seller) ships. A zone is a set of destinations (countries, regions, postcodes) to which the same delivery rules apply. Used to look up delivery_rates (zone + method → cost).
- **Columns (conceptual):** id, name (e.g. “Moscow”, “Russia”, “CIS”), type (country | region | postcode_range | custom), country_code (ISO 2-letter, nullable), region_code (nullable), postcode_from, postcode_to (nullable, for range), is_active, sort_order, created_at, updated_at. Optional: JSON or separate table for complex rules (e.g. list of postcodes, polygon). Matching at checkout: shipping_address → resolve to one or more zones (e.g. by country, then by region, then by postcode); typically one zone wins by priority.
- **Relationship:** delivery_rates (zone_id, delivery_method_id, …). One zone has many delivery_rates (one per delivery_method or per method + weight tier).

### 2.3 delivery_rates

- **Responsibility:** **Cost** and optionally **time** for a given shipping_zone and delivery_method. Can be flat rate, weight-based, or order-value-based.
- **Columns (conceptual):** id, shipping_zone_id (FK shipping_zones), delivery_method_id (FK delivery_methods), type (flat | by_weight | by_order_total), amount (numeric), currency, weight_min, weight_max (nullable; for by_weight tiers), order_total_min, order_total_max (nullable; for by_order_total tiers), estimated_days_min, estimated_days_max (optional), is_active, created_at, updated_at. Unique (shipping_zone_id, delivery_method_id) for flat; or (shipping_zone_id, delivery_method_id, weight_max) for tiers.
- **Relationship:** delivery_rates.shipping_zone_id → shipping_zones; delivery_rates.delivery_method_id → delivery_methods. At checkout: address → zone; cart weight and/or order subtotal → select rate(s). For multi-seller, one rate may apply to the whole order or rates may be combined (e.g. sum per-seller rate, or max + increment per additional seller).

### 2.4 shipments

- **Responsibility:** One **parcel** (or logical shipment) for one order from one seller. Replaces or extends the single “delivery” row in ORDER_SYSTEM_ARCHITECTURE: one order can have many shipments. Holds shipping address snapshot, method, carrier, cost, status, and tracking code.
- **Columns (conceptual):** id, order_id (FK orders), seller_id (FK sellers), shipment_number (unique, e.g. SHP-2025-00001), delivery_method_id (nullable, FK delivery_methods), shipping_address (JSON or FK: full_name, phone, country, region, city, street, building, apartment, postal_code), cost (numeric), currency, status (see STEP 4: created | packed | shipped | in_transit | delivered | returned), carrier_name (nullable), carrier_service (nullable), tracking_code (nullable), estimated_delivery_from, estimated_delivery_to (optional), shipped_at (nullable), delivered_at (nullable), created_at, updated_at. Optional: label_url, weight, dimensions, return_shipment_id (if this row represents a return parcel).
- **Relationship:** shipments.order_id → orders; shipments.seller_id → sellers. shipments have many shipment_items; each shipment_item links to one order_item. tracking_updates belong to shipment. One order has many shipments (one per seller that has items in the order).

### 2.5 shipment_items

- **Responsibility:** Which **order_items** are in which shipment. Each order_item (and thus each line from a given seller) belongs to exactly one shipment — the shipment for that order_item’s seller_id.
- **Columns (conceptual):** id, shipment_id (FK shipments), order_item_id (FK order_items), quantity (default order_items.quantity; or partial if split across parcels, then sum of shipment_items for that order_item ≤ order_items.quantity), created_at. Unique (shipment_id, order_item_id) or allow multiple rows per order_item only if quantity is split.
- **Relationship:** shipment_items.shipment_id → shipments; shipment_items.order_item_id → order_items. Constraint: shipment.seller_id must equal order_items.seller_id for each shipment_item. An order_item appears in exactly one shipment (or N rows summing to order_item.quantity).

### 2.6 tracking_updates

- **Responsibility:** Time-ordered **events** for a shipment from carrier or manual input: accepted, in_transit, out_for_delivery, delivered, exception. Same concept as delivery_tracking in ORDER_SYSTEM_ARCHITECTURE; here keyed by shipment_id.
- **Columns (conceptual):** id, shipment_id (FK shipments), status (normalized: accepted | picked_up | in_transit | out_for_delivery | delivered | exception | returned), description (optional text), location (optional), occurred_at, created_at. Optional: carrier_event_id, raw_carrier_code (carrier’s status code before normalization).
- **Relationship:** tracking_updates.shipment_id → shipments. Ordered by occurred_at for timeline. Latest status can be derived or cached on shipments.status.

### 2.7 Entity Relationship Diagram

```
orders ──► order_items (seller_id, product_id, variant_id, quantity, unit_price)
    │
    └──► shipments (order_id, seller_id, status, tracking_code, cost, address, ...)
              │
              ├──► shipment_items (shipment_id, order_item_id, quantity)
              │         └──► order_item.seller_id = shipment.seller_id
              │
              └──► tracking_updates (shipment_id, status, occurred_at)

delivery_methods ──► delivery_rates ◄── shipping_zones
        │
        └──► shipments.delivery_method_id
```

---

## STEP 3 — MULTI-SELLER SHIPMENT SPLIT

### 3.1 When Order Is Paid: Create One Shipment per Seller

- Order has order_items; each order_item has seller_id. **Group order_items by seller_id.** For each distinct seller_id, create one **shipment** (order_id, seller_id, status = created, shipping_address from order, delivery_method_id and cost from checkout or allocation). For each order_item in that group, create **shipment_item** (shipment_id, order_item_id, quantity = order_item.quantity). Result: every order_item is assigned to exactly one shipment; each shipment contains only items from one seller.

### 3.2 Delivery Cost: One Order Total vs Per-Shipment

- **Option A — Single delivery_amount on order:** At checkout, platform computes one total delivery_amount (e.g. first shipment full rate, additional sellers free or fixed extra). Order.delivery_amount is that total. When creating shipments, allocate cost to each shipment (e.g. equal split, or by weight, or first shipment gets full amount and others zero) and set shipment.cost; sum(shipment.cost) = order.delivery_amount. Used for financial reporting and seller settlement (MARKETPLACE_FINANCIAL_ARCHITECTURE: delivery cost allocation to sellers if needed).
- **Option B — Per-shipment cost at checkout:** Checkout knows number of sellers (or shipment count). Available rates are “per shipment” or “base + per additional shipment.” Order.delivery_amount = sum of chosen shipment costs. Each shipment gets its own cost when created. Same end state: each shipment has a cost; order.delivery_amount is the total.

### 3.3 Seller View and Responsibility

- Seller dashboard lists **shipments** where shipment.seller_id = current seller. Seller sees only their shipments (their order_items). Seller actions: pack, print label (or upload tracking), mark shipped, enter tracking_code. Platform can auto-create label via carrier API and set tracking_code; or seller enters it manually. When tracking_code is set and status → shipped, tracking_updates can be filled by carrier webhooks or manual updates.

### 3.4 Buyer View

- Order page shows **all shipments** for the order. Each shipment: “From Seller X”, list of items, one tracking code (if shipped), one timeline (tracking_updates). Buyer may receive multiple parcels; each has its own “track your parcel” link.

### 3.5 Order-Level “Shipped” and “Delivered”

- **Order status “shipped”:** When at least one shipment has status shipped (or in_transit). Optional: set order.shipped_at when first shipment is shipped.
- **Order status “delivered”:** When **all** shipments have status delivered. Set order.delivered_at when the last shipment is delivered. If one shipment is lost or exception, order can stay “shipped” until resolution (refund or resend); policy decision.

---

## STEP 4 — DELIVERY STATUS LIFECYCLE

### 4.1 Shipment Statuses

| Status | Meaning |
|--------|--------|
| **created** | Shipment created after order paid; contains shipment_items. Seller has not yet packed. |
| **packed** | Seller has packed the items; parcel may be ready for handover. Optional: label generated. |
| **shipped** | Parcel handed to carrier; tracking_code set. Carrier has accepted (or platform has recorded handover). |
| **in_transit** | Carrier reports parcel is in transit (or out_for_delivery). |
| **delivered** | Carrier or recipient confirmed delivery. shipment.delivered_at set; order-level delivered_at updated when all shipments delivered. |
| **returned** | Parcel is being or has been returned to seller (return flow). Optional status for return shipment. |

Optional: **exception** (delay, failed delivery, lost) as a separate status or as a substate of in_transit; **cancelled** if shipment is cancelled before shipping.

### 4.2 Transitions

- **created** → **packed**: Seller marks as packed (and optionally generates label).
- **packed** → **shipped**: Seller hands over to carrier and sets tracking_code; or carrier webhook “accepted”.
- **shipped** → **in_transit**: First “in_transit” or “out_for_delivery” tracking_update.
- **in_transit** → **delivered**: “delivered” tracking_update; set shipment.delivered_at, update shipment.status.
- **shipped** | **in_transit** → **returned**: Return requested and return shipment created or carrier reports return. Used for return logistics.
- **created** | **packed** → **cancelled**: Shipment cancelled (e.g. order cancelled); items revert to unshipped.

Shipment status can be **derived** from the latest tracking_update (e.g. if latest = delivered then status = delivered) or **explicit** on the shipment row and updated when tracking_update is inserted. Explicit status is simpler for “packed” (no carrier event) and for querying.

### 4.3 tracking_updates and Status Sync

- When a **tracking_update** is inserted (carrier webhook or manual), update **shipments.status** and optional **shipments.delivered_at** based on the new event. E.g. status = delivered → set shipment.delivered_at = occurred_at, shipment.status = delivered. Then check order: if all shipments for that order are delivered, set order.delivered_at and order status → delivered.

### 4.4 Returns and Return Shipments

- Return is per order_item (ORDER_SYSTEM_ARCHITECTURE: return_lines). The **return parcel** (buyer → seller) can be modeled as: (a) a separate **shipment** with type = return and link to order_return_id, same tracking_updates; or (b) only tracking on the return request (return.tracking_code, return.tracking_updates). Option (a) reuses shipments and tracking_updates; status **returned** or **return_received** when seller gets the parcel. Option (b) keeps returns separate. Design choice; both allow “return in transit” and “return received” for restock and refund timing.

---

## STEP 5 — FINAL DOCUMENT (Summary)

### 5.1 Table Summary

| Entity | Purpose |
|--------|---------|
| **delivery_methods** | Catalog of shipping options (courier, express, pickup, postal); platform-level. |
| **shipping_zones** | Destinations (country, region, postcode) for rate lookup. |
| **delivery_rates** | Cost (and optional time) per zone + method; flat or by weight/order total. |
| **shipments** | One parcel per order per seller; order_id, seller_id, address, method, cost, status, tracking_code. |
| **shipment_items** | Links shipment to order_items; which items are in this parcel. |
| **tracking_updates** | Time-ordered carrier events per shipment: accepted, in_transit, delivered, exception. |

### 5.2 Multi-Seller Split (Recap)

- One order with items from N sellers → N **shipments**. Each shipment has the same order_id, one seller_id, and shipment_items only for that seller’s order_items. Delivery cost is on the order (delivery_amount) and optionally per shipment (shipment.cost) for allocation. Seller sees only their shipments; buyer sees all shipments and tracking per parcel.

### 5.3 Dependencies

- **ORDER_SYSTEM_ARCHITECTURE:** **orders**, **order_items** (seller_id, quantity). The previous “delivery” and “delivery_tracking” are superseded by **shipments** and **tracking_updates** when multi-seller is adopted; order keeps delivery_amount and optional shipping_address at order level; each shipment also has shipping_address (snapshot or FK). **returns** / **return_lines** reference order_items; return shipment can be a shipment (type = return) or tracking on return.
- **PRODUCT_ARCHITECTURE:** **sellers**; products and order_items have seller_id.
- **MARKETPLACE_FINANCIAL_ARCHITECTURE:** Delivery cost allocation to sellers (if needed) uses shipment.cost or order.delivery_amount split by shipment.

### 5.4 Indexing (Conceptual)

- **delivery_methods:** (code unique), (is_active).
- **shipping_zones:** (country_code, region_code), (is_active), (type).
- **delivery_rates:** (shipping_zone_id, delivery_method_id), (is_active).
- **shipments:** (order_id), (seller_id), (shipment_number unique), (status), (tracking_code), (created_at).
- **shipment_items:** (shipment_id), (order_item_id).
- **tracking_updates:** (shipment_id), (occurred_at).

### 5.5 Optional Extensions

- **Seller-specific rates:** delivery_rates or delivery_methods with seller_id override for sellers who set their own zones/rates.
- **Pickup points:** delivery_method type = pickup_point; shipping_zone or separate pickup_points table with address; buyer selects point at checkout; shipment stores pickup_point_id.
- **Weight and dimensions:** order_items or products have weight; cart weight at checkout for delivery_rates by_weight; shipment.weight for carrier API.
- **Label generation:** Integration with carrier API; store label_url on shipment; optional label_created_at as step between packed and shipped.

---

*End of Delivery System Architecture.*

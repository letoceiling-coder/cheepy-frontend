# Marketplace Financial Architecture

**Document type:** Payment and payout system design for the marketplace (no code)  
**Audience:** Backend leads, product owner, finance  
**Context:** Builds on PRODUCT_ARCHITECTURE.md and ORDER_SYSTEM_ARCHITECTURE.md. Defines buyer payment flow, platform commissions, seller balance, and seller payouts.

---

## STEP 1 — ANALYZE PAYMENT FLOW

### 1.1 How Money Flows: Buyer → Platform → Seller

**Phase 1 — Buyer pays the platform**

- The **buyer** pays the **full order total** (items + delivery + tax if any) at checkout. Payment is collected by the **platform** via a payment gateway (e.g. card, e-wallet, bank). The gateway captures funds into the **platform’s** merchant account (or settlement account). The buyer does not pay the seller directly; the platform is the merchant of record for the transaction.
- **ORDER_SYSTEM_ARCHITECTURE:** One **payments** row links the order to the gateway (amount, method, status, gateway_payment_id). **payment_transactions** log the capture (and later refunds). So at this stage: buyer’s money → gateway → platform’s bank.

**Phase 2 — Platform holds and settles per order/seller**

- The order can contain **order_items** from one or more **sellers** (each order_item has seller_id). The platform is responsible for:
  - **Revenue split:** For each order item (or each seller’s portion of the order), compute: **seller gross** = quantity × unit_price (item revenue); **platform commission** = f(seller_gross) by rule; **seller net** = seller_gross − commission (and optionally − fees, − refunds).
  - **Holding period (optional):** Platform may hold seller net for a period (e.g. until delivery, or N days after delivery) to cover returns and chargebacks before it becomes **available for payout**.
  - **Seller balance:** Seller net (and adjustments for refunds, commissions, fees) is credited to the **seller’s balance** (seller_wallet or seller_balance). So money flow is logical: platform “owes” the seller that balance until paid out.

**Phase 3 — Platform pays the seller**

- When the seller requests a payout (or when the platform runs automatic payouts), the platform transfers money **from the platform’s bank** to the **seller’s bank account** (or e-wallet). That transfer is a **payout**. The seller’s balance is debited by the payout amount; the payout is recorded (payout_requests, payout_batches) for audit and bank reconciliation.
- So end-to-end: **buyer → platform (gateway capture) → platform holds and computes commission → seller balance (credit) → platform pays seller (payout, debit balance).**

### 1.2 Summary Diagram

```
Buyer                    Platform                         Seller
  │                         │                                │
  │  Checkout (order total) │                                │
  │ ──────────────────────►│  Gateway capture                │
  │                         │  (payments, payment_transactions)
  │                         │                                │
  │                         │  Order paid: for each order_item
  │                         │  • seller_gross = item total   │
  │                         │  • commission = rule(seller_gross)
  │                         │  • seller_net = gross − commission
  │                         │  • Credit seller_balance (seller_net)
  │                         │                                │
  │                         │  Refund/return:                 │
  │                         │  • Debit seller_balance (refund share)
  │                         │  • payment_transactions (refund)
  │                         │                                │
  │                         │  Payout (seller request/batch) │
  │                         │  • Debit seller_balance        │
  │                         │  • Bank transfer ─────────────►│
  │                         │  • payout_requests / payout_batches
```

### 1.3 Design Implications

- **Single merchant of record:** The platform contracts with the payment gateway; buyers pay the platform. Sellers never receive buyer payment directly; they receive **payouts** from the platform after commission and hold.
- **Per-order-item (or per-seller) settlement:** Commission and seller net are computed per order_item (or aggregated per seller per order) so that multi-seller orders are split correctly. Order-level delivery or discount may need allocation rules (e.g. proportional to item total).
- **Refunds and returns:** When the buyer is refunded (full or partial), the platform issues a refund via the gateway (payment_transactions type = refund). The corresponding **seller balance** must be debited (and optionally commission reversed); return_lines and order_items drive how much to debit per seller.
- **Seller balance is internal ledger:** seller_balance (or seller_wallet balance) is the platform’s liability to the seller; it is not a real bank account. Payout is the act of settling that liability by bank transfer.

---

## STEP 2 — DESIGN PAYMENT SYSTEM

### 2.1 payments (align with ORDER_SYSTEM_ARCHITECTURE)

- **Responsibility:** Links an **order** to the payment captured from the buyer. One order can have one or more payments (e.g. one failed attempt, one success; or split payment). Holds high-level state and gateway reference.
- **Columns (conceptual):** id, order_id (FK orders), amount, currency, method (code or FK payment_methods), status (pending | authorized | captured | failed | cancelled | refunded), gateway_name (e.g. stripe, yookassa), gateway_payment_id (external id), created_at, updated_at, captured_at (nullable). Optional: payer_email, payer_id, metadata (JSON), payment_method_id (FK payment_methods if table exists).
- **Relationship:** payments.order_id → orders. payment_transactions belong to a payment. Refunds are recorded as payment_transactions (type = refund); payments.status may become refunded when fully refunded.

### 2.2 payment_transactions (align with ORDER_SYSTEM_ARCHITECTURE)

- **Responsibility:** Immutable log of money movements at the gateway: authorize, capture, refund, partial_refund. Used for reconciliation, disputes, and linking refunds to returns.
- **Columns (conceptual):** id, payment_id (FK payments), type (authorize | capture | refund | partial_refund), amount, currency, status (success | failed | pending), gateway_transaction_id (nullable), gateway_response (JSON, optional), created_at. Optional: reason (text), order_return_id (FK when type = refund).
- **Relationship:** payment_transactions.payment_id → payments. When type = refund, order_return_id links to the return that triggered the refund. Platform uses this to know how much was refunded to the buyer and to debit seller balance accordingly.

### 2.3 payment_methods

- **Responsibility:** Catalog of payment methods the platform supports (card, e-wallet, bank transfer, cash on delivery, etc.). Used for checkout UI, gateway routing, and reporting. Optional: per-method fees or constraints.
- **Columns (conceptual):** id, code (unique, e.g. card, bank_transfer, wallet, cod), name (display), gateway_name (nullable; which gateway handles this method), is_active, sort_order, created_at, updated_at. Optional: fee_percent, fee_fixed, min_amount, max_amount, allowed_currencies (JSON).
- **Relationship:** payments.method or payments.payment_method_id → payment_methods. No direct relationship to sellers; payment methods are platform-level. Sellers are paid via payout (bank/wallet) in a separate flow (seller payout details in STEP 4).

### 2.4 Payment System Diagram

```
orders ──► payments ──► payment_transactions
    │           │              │
    │           └── method ────► payment_methods
    │
    └── (order_items with seller_id drive commission & seller balance)
```

---

## STEP 3 — DESIGN MARKETPLACE COMMISSIONS

### 3.1 platform_commissions (order-level or order-item-level commission record)

- **Responsibility:** Record the **commission** the platform takes for each relevant order or order_item. One row per order_item (or per order if commission is calculated per order). Enables reporting, disputes, and correct seller net for balance credit.
- **Columns (conceptual):** id, order_id (FK orders), order_item_id (FK order_items, nullable if commission is order-level), seller_id (FK sellers), commission_rule_id (nullable, FK commission_rules), gross_amount (item total: quantity × unit_price), commission_amount (platform take), commission_percent (optional, for display), currency, created_at. Optional: fee_amount (fixed fee), net_amount (gross − commission − fee), refunded_commission (if item was returned).
- **Relationship:** platform_commissions.order_id → orders; platform_commissions.order_item_id → order_items; platform_commissions.seller_id → sellers. commission_rule_id references the rule that was applied. When an order_item is refunded (return), a separate row or refunded_commission field can record commission reversal.

### 3.2 commission_rules

- **Responsibility:** Define **how** commission is calculated. Rules can be global or per seller/category. Typical: percentage of gross, or tiered (e.g. 10% up to 10k, 8% above), or fixed fee + percentage.
- **Columns (conceptual):** id, name, type (percent | fixed | tiered), value (e.g. 10 for 10%), value_extra (JSON for tiered: e.g. [{max: 10000, percent: 10}, {max: null, percent: 8}]), scope (global | per_seller | per_category), scope_entity_id (nullable; seller_id or catalog_category_id when scope is per_seller or per_category), priority (int; higher = applied first when multiple match), is_active, valid_from, valid_to (optional), created_at, updated_at.
- **Relationship:** commission_rules are read when computing commission for an order_item (seller_id, category from product). platform_commissions.commission_rule_id → commission_rules. Only one rule typically applies per order_item (first match by priority); or rules can be combined by policy.

### 3.3 seller_balance

- **Responsibility:** The **current balance** the platform owes the seller. Increased when an order is paid (seller net credited); decreased when there is a refund (seller share debited), a fee, or a payout. One row per seller (or one per seller per currency if multi-currency).
- **Columns (conceptual):** id, seller_id (FK sellers, unique), currency, available_balance (numeric; amount available for payout), pending_balance (numeric; amount in hold, e.g. until delivery or hold period), total_earned (optional; lifetime credited), total_paid_out (optional; lifetime payouts), updated_at. Optional: on_hold_until (for time-based hold).
- **Relationship:** seller_balance.seller_id → sellers. **seller_transactions** (STEP 4) are the ledger entries that change available_balance and pending_balance; balance is derived from sum of seller_transactions or maintained as a cached total for performance.

### 3.4 Commission and Balance Flow

- **On order paid:** For each order_item: compute gross = quantity × unit_price; apply commission_rule → commission_amount; seller_net = gross − commission_amount. Insert **platform_commissions** row(s). Credit seller: insert **seller_transactions** (type = order_income, amount = seller_net, order_id, order_item_id); update **seller_balance** (available_balance += seller_net, or pending_balance += seller_net if hold; then move to available after hold).
- **On refund/return:** For each return_line: seller’s share of refund = (returned quantity × unit_price) for that order_item; optionally reverse commission. Debit seller: insert seller_transactions (type = refund_debit, amount = −seller_share, order_return_id); update seller_balance (available_balance −= seller_share). payment_transactions (refund) already records buyer refund; seller_balance and seller_transactions record seller side.

### 3.5 Entity Relationship (Commissions and Balance)

```
order_items (seller_id, quantity, unit_price)
    │
    ├──► platform_commissions (order_id, order_item_id, seller_id, gross, commission_amount, commission_rule_id)
    │
    └──► seller_transactions (credit on paid; debit on refund)
              │
              ▼
         seller_balance (seller_id, available_balance, pending_balance)

commission_rules (scope: global | per_seller | per_category)
    └──► used when creating platform_commissions
```

---

## STEP 4 — SELLER PAYOUT SYSTEM

### 4.1 seller_wallets

- **Responsibility:** Seller’s **payout destination** and optional wallet metadata. One row per seller (or per seller per currency). Holds bank details or e-wallet identifier to which payouts are sent; do not store full card numbers; use tokens or references from a provider if needed.
- **Columns (conceptual):** id, seller_id (FK sellers, unique or unique per currency), currency, type (bank_account | wallet | other), account_holder_name, account_identifier (masked or tokenized; e.g. last4, or external wallet id), bank_name (nullable), routing_code (nullable), is_verified (boolean), is_default (if multiple per seller), created_at, updated_at. Optional: verified_at, gateway_seller_id (if payout goes through a provider that has its own seller id).
- **Relationship:** seller_wallets.seller_id → sellers. payout_requests reference the wallet (or seller_id and currency) used for the payout. For simplicity, one active payout destination per seller can be assumed; then seller_wallets is one row per seller.

### 4.2 seller_transactions

- **Responsibility:** **Ledger** of every credit and debit to the seller’s balance. Enables balance reconstruction and audit. Each order income, refund debit, fee, and payout creates one or more rows.
- **Columns (conceptual):** id, seller_id (FK sellers), type (order_income | refund_debit | commission_reversal | fee | payout | adjustment), amount (signed: positive = credit, negative = debit), currency, balance_after (optional; snapshot after this tx for consistency), reference_type (order | order_return | payout_request | manual), reference_id (order_id, order_return_id, payout_request_id, etc.), description (optional text), created_at. Optional: order_item_id, platform_commission_id.
- **Relationship:** seller_transactions.seller_id → sellers. reference_type + reference_id link to orders, order_returns, payout_requests. Sum of seller_transactions (or up to a cutoff) should match seller_balance.available_balance + pending_balance (or balance is cached and updated on each insert).

### 4.3 payout_requests

- **Responsibility:** A **request** by a seller (or by system on their behalf) to pay out a certain amount. Can be manual “withdraw” or auto-generated when balance reaches threshold. One request = one intended transfer; it may be grouped into a payout_batch for actual bank transfer.
- **Columns (conceptual):** id, seller_id (FK sellers), amount, currency, status (pending | batched | processing | completed | failed | cancelled), seller_wallet_id (nullable, FK seller_wallets; which destination), payout_batch_id (nullable, FK payout_batches; set when batched), requested_at, processed_at (nullable), failure_reason (nullable), created_at, updated_at. Optional: requested_by (user_id if manual), min_amount check at request time.
- **Relationship:** payout_requests.seller_id → sellers. payout_requests.seller_wallet_id → seller_wallets. payout_requests.payout_batch_id → payout_batches. When status = pending, platform can batch several requests into one payout_batch; when batch is sent, status → processing then completed (or failed). On completion, seller_transactions (type = payout, reference_id = payout_request_id) debits balance; seller_balance is updated.

### 4.4 payout_batches

- **Responsibility:** A **batch** of payout_requests that are processed together (e.g. one file to the bank or one API call to a payout provider). Enables bulk processing and reconciliation.
- **Columns (conceptual):** id, batch_number (unique, e.g. PAY-2025-00001), status (pending | processing | completed | partially_failed | failed), total_amount, currency, gateway_batch_id (nullable; external batch id from provider), scheduled_at, processed_at (nullable), created_at, updated_at. Optional: file_path (if batch is a file), item_count.
- **Relationship:** payout_batches have many payout_requests (payout_requests.payout_batch_id). When batch is created, attach pending payout_requests; when batch is sent to bank/provider, status = processing; when provider confirms, status = completed and each payout_request.status = completed; create seller_transactions (payout) and debit seller_balance for each. Failed items can set payout_request.status = failed and optionally create a new batch for retry.

### 4.5 Payout Flow Summary

1. Seller (or cron) creates **payout_request** (amount ≤ available_balance, seller_wallet_id). Status = pending. Optionally hold: do not debit balance yet.
2. Platform **batches** pending payout_requests (e.g. daily) into a **payout_batch**. Set payout_request.payout_batch_id, payout_request.status = batched (or processing).
3. Platform sends batch to bank/provider (file or API). Set payout_batch.status = processing, payout_batch.gateway_batch_id.
4. On success: For each payout_request in batch, set status = completed, processed_at; insert **seller_transactions** (type = payout, amount = −amount, reference_id = payout_request_id); update **seller_balance** (available_balance −= amount). Set payout_batch.status = completed, processed_at.
5. On failure: Set payout_request.status = failed, failure_reason; optionally retry in a new batch. seller_balance is not debited until payout is confirmed.

### 4.6 Entity Relationship (Payouts)

```
seller_balance (seller_id, available_balance)
    │
    ├──► seller_transactions (credit/debit ledger)
    │
    └──► payout_requests (seller_id, amount, status, seller_wallet_id, payout_batch_id)
              │
              ├──► seller_wallets (payout destination)
              │
              └──► payout_batches (batch of requests for one transfer job)
```

---

## STEP 5 — FINAL DOCUMENT (Summary)

### 5.1 Money Flow (Recap)

- **Buyer → platform:** Buyer pays order total via gateway; **payments** and **payment_transactions** record capture (and refunds). Funds sit in platform’s merchant account.
- **Platform → seller (logical):** On order paid, **platform_commissions** records commission per order_item; **seller_transactions** (order_income) credits **seller_balance**. On refund, **seller_transactions** (refund_debit) debits seller_balance; **payment_transactions** (refund) records buyer refund.
- **Platform → seller (physical):** Seller creates **payout_request**; platform groups into **payout_batch** and sends to bank/provider; on success **seller_transactions** (payout) debits seller_balance and money is sent to **seller_wallets** destination.

### 5.2 Table Summary

| Entity | Purpose |
|--------|---------|
| **payments** | Link order to gateway; amount, method, status, gateway_payment_id. |
| **payment_transactions** | Immutable log: authorize, capture, refund; amount, status, order_return_id for refunds. |
| **payment_methods** | Catalog of buyer-facing methods (card, wallet, cod, etc.); platform-level. |
| **platform_commissions** | Per order_item (or order) commission record: gross, commission_amount, seller_id, rule_id. |
| **commission_rules** | How to compute commission: percent, fixed, tiered; scope global/seller/category. |
| **seller_balance** | Current balance owed to seller: available_balance, pending_balance (optional hold). |
| **seller_wallets** | Payout destination: bank or wallet details (tokenized), per seller. |
| **seller_transactions** | Ledger: order_income, refund_debit, fee, payout, adjustment; reference order/return/payout_request. |
| **payout_requests** | Seller’s request to withdraw; amount, status, seller_wallet_id, payout_batch_id. |
| **payout_batches** | Group of payout_requests processed together; batch_number, status, gateway_batch_id. |

### 5.3 Dependencies

- **ORDER_SYSTEM_ARCHITECTURE:** **orders**, **order_items** (seller_id, quantity, unit_price) drive commission and seller net. **payments**, **payment_transactions** already defined; this doc adds **payment_methods** and extends usage for refunds and seller-side impact. **returns** / **return_lines** drive refund amount per seller and seller_transactions (refund_debit).
- **PRODUCT_ARCHITECTURE:** **products.seller_id**; **sellers** table. Order items reference product and variant; seller is denormalized on order_item for settlement.

### 5.4 Indexing (Conceptual)

- **payments:** (order_id), (gateway_payment_id), (status).
- **payment_transactions:** (payment_id), (type), (created_at); (order_return_id) for refund lookups.
- **payment_methods:** (code unique), (is_active).
- **platform_commissions:** (order_id), (seller_id), (order_item_id), (created_at).
- **commission_rules:** (scope, scope_entity_id), (is_active), (priority).
- **seller_balance:** (seller_id unique).
- **seller_transactions:** (seller_id), (reference_type, reference_id), (created_at), (type).
- **seller_wallets:** (seller_id), (is_default).
- **payout_requests:** (seller_id), (status), (payout_batch_id), (requested_at).
- **payout_batches:** (batch_number unique), (status), (processed_at).

### 5.5 Optional Extensions

- **Hold period:** Before crediting available_balance, credit pending_balance; move to available_balance after delivery or N days (job or event-driven).
- **Multi-currency:** seller_balance and seller_transactions per currency; payout in same currency or with FX.
- **Fees:** Deduct platform fees (e.g. payment processing fee) from seller_net before crediting balance; record as seller_transactions (type = fee).
- **Adjustments:** Manual credit/debit (support, dispute) as seller_transactions (type = adjustment) with reference and reason.

---

*End of Marketplace Financial Architecture.*

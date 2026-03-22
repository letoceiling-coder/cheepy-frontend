# Development Guardrails

**Document type:** Implementation rules and constraints (no code)  
**Audience:** Developers, Cursor (AI assistant), code reviewers, architects  
**Purpose:** Define strict rules for implementing the architecture. Ensures that implementation stays aligned with architecture documents and that quality, safety, and observability are enforced.

---

## SECTION 1 — ARCHITECTURE AUTHORITY

### 1.1 Source of truth

**Existing architecture documents are the source of truth.** All implementation decisions that affect system structure, data model, API contracts, or cross-domain behavior must be traceable to one or more of these documents:

- PLATFORM_MASTER_ARCHITECTURE  
- CATALOG_ARCHITECTURE_V2  
- ATTRIBUTE_ENGINE_ARCHITECTURE  
- PRODUCT_ARCHITECTURE  
- ORDER_SYSTEM_ARCHITECTURE  
- API_ARCHITECTURE  
- INFRASTRUCTURE_ARCHITECTURE  
- IDENTITY_SYSTEM_ARCHITECTURE  
- DELIVERY_SYSTEM_ARCHITECTURE  
- MARKETPLACE_FINANCIAL_ARCHITECTURE  
- PLATFORM_EVENT_ARCHITECTURE  
- SECURITY_ARCHITECTURE  
- OBSERVABILITY_ARCHITECTURE  
- IMPLEMENTATION_ROADMAP  

When in doubt, the architecture document wins. Do not infer or invent structure that is not described there.

### 1.2 Cursor (AI) must NOT

- **Change table structures** — Do not add, remove, or rename columns or tables unless the change is explicitly specified in an architecture document or in an approved migration that itself references the architecture. Do not “optimize” or “simplify” the schema in a way that diverges from the documented entities and relationships.
- **Invent new entities** — Do not introduce new tables, new API domains, or new domain concepts (e.g. new event types, new job types) that are not defined in the architecture. If a gap is found, flag it for architect review; do not fill it with an invented entity.
- **Merge domains** — Do not merge responsibilities or boundaries between domains (e.g. putting order logic in the catalog layer, or parser logic in the order layer). Each domain (catalog, attribute, product, order, delivery, financial, event, infrastructure, CMS, CRM, identity) has a defined scope; implementation must respect those boundaries.

### 1.3 When architecture is silent

If the architecture does not specify a detail (e.g. exact column type, index name, error code), implementation may choose a consistent, safe default **within the same domain and style** as the document. Document the choice in code comments or in a short implementation note; do not extend the architecture document unless you are an architect (see Section 7).

---

## SECTION 2 — DATABASE RULES

All database changes must follow these rules. No exception for “quick fixes” or “temporary” changes.

### 2.1 Explicit migration

- **Every** structural change (new table, new column, new index, new constraint, new enum value) must be expressed in an **explicit migration** (e.g. migration file with up/down or equivalent). Migrations are versioned and applied in order. No ad-hoc SQL run directly against the database for schema changes; no schema drift maintained only in code or in a single “current state” script without history.
- Migrations must be **reversible** where possible (down step that restores prior state or documents why rollback is not supported). Migration files must be reviewed in the same way as application code.

### 2.2 No destructive changes

- **Destructive changes** (drop column, drop table, drop index that is in use, change column type in a breaking way) are **forbidden** unless: (a) the architecture document explicitly deprecates the element and specifies removal, and (b) a separate, approved migration plan exists (including data migration, backfill, or compatibility period). Prefer **additive** changes: new columns (nullable or with default), new tables, new indexes. Renaming or removing must follow a deprecation and migration path, not a single destructive migration.

### 2.3 Foreign keys required

- **Every** reference from one table to another (e.g. product_id in order_items, catalog_category_id in products) must be enforced by a **foreign key constraint** (or the equivalent in the DB engine in use). Do not rely on application logic alone to maintain referential integrity. Optional: document FK names and cascade behavior (e.g. ON DELETE RESTRICT vs SET NULL) in migration or schema docs so that intent is clear.

### 2.4 Indexes required

- **Indexes** must exist for: (a) all foreign key columns (unless the engine creates them automatically); (b) columns used in **WHERE**, **JOIN**, or **ORDER BY** in hot or critical queries (e.g. order_id in order_items, status in jobs, (queue, status) in jobs); (c) unique constraints required by the architecture (e.g. order_number, external_id). Do not leave critical query paths without an index “for later.” Index naming and choice (single column vs composite) should be consistent and documented in migration or architecture.

---

## SECTION 3 — IMPLEMENTATION RULES

Before implementing any phase (or any feature that touches multiple domains or the data model), the following steps are **required**. Skipping them increases the risk of misalignment and rework.

### 3.1 Analyze architecture documents

- **Read** the relevant architecture documents for the area being implemented. Identify the exact entities (tables, API domains, event types, job types), their responsibilities, and their relationships. Note any constraints (e.g. “parser must not assign category without mapping,” “order_items.unit_price is snapshot at order time”). Implementation must not contradict these constraints.

### 3.2 Confirm dependencies

- **Confirm** that all **dependencies** for the current phase are already implemented and stable. Use IMPLEMENTATION_ROADMAP.md: Phase N depends on Phase 1…N−1 (or listed dependencies). Do not implement Phase N if a dependency is missing or only partially done (e.g. do not implement order_items if product_variants and product_prices are not yet in place per PRODUCT_ARCHITECTURE and ORDER_SYSTEM_ARCHITECTURE). If a dependency is optional or can be stubbed, document that explicitly.

### 3.3 Define acceptance criteria

- **Define** acceptance criteria **before** coding. Criteria must be testable and traceable to the architecture (e.g. “category_mapping returns catalog_category_id for donor_category_id,” “order_items.unit_price equals product_prices at checkout time,” “buyer_api returns only orders where buyer_user_id = current user”). These criteria feed into unit, integration, and e2e tests (Section 4). If criteria cannot be stated, the scope is not clear enough to implement safely.

---

## SECTION 4 — TESTING RULES

Each phase (and each major feature within a phase) requires the following test levels. “Phase” here means a coherent deliverable as in IMPLEMENTATION_ROADMAP.md.

### 4.1 Unit tests

- **Unit tests** must cover: domain logic (e.g. mapping resolution, attribute normalization, price/stock validation, status transitions), calculations (e.g. commission, totals), and any logic that can be exercised in isolation without a full stack. Use test doubles for external dependencies (DB, gateway, email). Aim for high coverage on business rules and edge cases (e.g. empty cart, missing mapping, zero stock). Unit tests must run fast and not depend on real DB or network unless explicitly marked as integration.

### 4.2 Integration tests

- **Integration tests** must cover: API contracts (request/response schema, status codes, auth and scope), database behavior (migrations apply cleanly, FK and indexes exist, queries return expected results for given data), and cross-component flows within the same phase (e.g. create cart → add item → get cart; create order → create payment → webhook updates order). Use a test database or container; do not use production data. Integration tests may use real DB and in-process HTTP; external services (payment gateway, email) should be stubbed or mocked.

### 4.3 Basic e2e tests

- **Basic e2e tests** must cover: at least one **critical path** per phase that involves the user or system journey end-to-end (e.g. “browse category → open product → add to cart → checkout → order created and payment pending”). E2e tests may run against a dedicated test environment or a local full stack; they should be few and stable rather than exhaustive. Their purpose is to catch integration and configuration errors that unit and integration tests might miss. Document which e2e scenarios are required for each phase (e.g. in IMPLEMENTATION_ROADMAP or in a test plan).

### 4.4 Test maintenance

- Tests are part of the deliverable. Broken or skipped tests must be fixed or removed with justification; do not leave tests permanently disabled without an approved exception. New code that changes behavior must update or add tests so that acceptance criteria remain verified.

---

## SECTION 5 — OBSERVABILITY RULES

New components (new API domains, new workers, new jobs, new integrations) must include observability from the start. Align with OBSERVABILITY_ARCHITECTURE.md and SECURITY_ARCHITECTURE.md (no secrets or PII in logs).

### 5.1 Structured logging

- **Structured logging** must be used: each log line is a structured record (e.g. JSON) with at least **timestamp**, **level**, **message**, and **context** (e.g. request_id, job_id, user_id, order_id, component name). Use a consistent schema so that log aggregation can filter by component, request_id, or level. Do not log secrets (passwords, tokens, API keys, webhook secrets) or PII (full email, phone, address); use identifiers (user_id, order_id) only.

### 5.2 Metrics

- **Metrics** must be exposed for: (a) **API**: request count and latency (and error count or rate) per endpoint or route group and per domain (public, buyer, seller, admin, etc.); (b) **Workers/jobs**: job completion and failure count per queue and job_type, job duration, queue depth if applicable; (c) **Business**: optional but recommended for critical flows (e.g. orders created, payment success/failure). Use the platform’s chosen metrics format (e.g. Prometheus). Do not expose high-cardinality labels (e.g. per-user or per-order id) on high-volume metrics; use aggregates.

### 5.3 Error tracking

- **Error tracking** must be in place for: unhandled exceptions and logged errors (level = error) so that failures are visible and countable. Errors must include enough context (request_id, job_id, component) to correlate with logs and traces, but must not include secrets or PII in the payload sent to the error-tracking service. Optionally, integrate with the same correlation id used in logs and traces so that an error can be linked to the full request or job.

---

## SECTION 6 — CODE REVIEW RULES

Every implementation (merge request, pull request) that touches schema, API, or security-sensitive behavior must be reviewed with the following checks. The reviewer (human or checklist) must confirm each before approval.

### 6.1 Schema validation

- **Schema validation:** (a) All new or changed tables and columns are introduced via a **migration** (Section 2). (b) Migrations have **foreign keys** and **indexes** as required. (c) No **destructive** change without an approved plan. (d) Names and types align with the **architecture** (entity and column names as in CATALOG_ARCHITECTURE_V2, PRODUCT_ARCHITECTURE, ORDER_SYSTEM_ARCHITECTURE, etc.). (e) No **invented** tables or columns that are not in the architecture. Flag any divergence for architect decision.

### 6.2 API validation

- **API validation:** (a) Endpoints and methods align with **API_ARCHITECTURE** (URL structure, domain: public/buyer/seller/admin/crm/internal). (b) **Authentication and authorization** match the document (e.g. buyer_api requires user session; seller_api scopes by seller_accounts). (c) **Request and response** shapes match the intended contract (schema or doc); no extra sensitive fields exposed. (d) **Rate limiting**, **validation**, and **error responses** are consistent with the architecture and SECURITY_ARCHITECTURE. (e) No new API domain or endpoint that is not described in the architecture without explicit approval.

### 6.3 Security validation

- **Security validation:** (a) No **secrets** or **credentials** in code or in config files in the repo; use environment or secret manager. (b) No **PII** or **secrets** in logs or error reports (Section 5). (c) **Input validation** and **output encoding** are applied (no raw user input in queries or responses that could lead to injection or XSS). (d) **Authorization** is enforced per endpoint and per resource (e.g. buyer sees only own orders; seller sees only own products and orders). (e) **CORS**, **CSRF**, and **secure headers** follow SECURITY_ARCHITECTURE. (f) **Payment and webhook** handling: no card storage; webhook signature verification. Flag any deviation for security review.

---

## SECTION 7 — FINAL RULE

### 7.1 Architecture documents are immutable

- **Architecture documents** (the set listed in Section 1.1) are **immutable** from the perspective of implementation. Implementations must **conform** to them; they must **not** be edited to “match” an implementation. If the implementation cannot conform (e.g. performance or technical constraint), the correct response is to **change the implementation** or to **request an architecture change** through the process below, not to alter the document unilaterally.

### 7.2 Only architects can modify them

- **Only architects** (roles or persons designated as platform or domain architects) may **modify** architecture documents. Developers, Cursor, and automated tools **must not** edit these documents. Proposed changes (new entity, new phase, change in responsibility, change in table or API contract) must be submitted as a **proposal** (e.g. RFC or change request) and approved by an architect before the architecture document is updated. After update, implementation and guardrails (including this document) can be updated to reflect the new authority.

### 7.3 This document

- **DEVELOPMENT_GUARDRAILS.md** itself is a **process** document, not an architecture document. It may be updated by agreement of the team or architects to add or refine rules (e.g. new review checklist item, new test requirement) without changing the underlying architecture. Changes to guardrails should be visible (e.g. changelog or version note) so that the team knows what is required.

---

## SECTION 8 — ARCHITECTURE TRACEABILITY

### 8.1 Every implementation must reference architecture sections

Every implementation (feature, phase, or significant change) must **explicitly reference** the architecture document and section(s) it implements. This keeps code traceable to the source of truth and makes review and onboarding easier.

**Example:**

- Implements: **PRODUCT_ARCHITECTURE.md** → STEP 3 (Product variants: product_variants, product_prices, product_stock, product_media).
- Implements: **ORDER_SYSTEM_ARCHITECTURE.md** → STEP 2 (Orders and order_items; unit_price snapshot at order time).

References may be in: (a) the pull request description, (b) a short comment in the migration or module, or (c) a dedicated “Architecture” subsection in the PR. The reviewer must be able to verify that the change aligns with the cited section.

### 8.2 Pull requests must include architecture references

**Pull requests** that touch schema, API, or domain logic **must include** architecture references. In the PR description, add a line such as:

- **Implements:** DOCUMENT.md → STEP N (or section X); DOCUMENT2.md → STEP M.

If the change does not implement a specific step but supports it (e.g. a test or refactor), reference the document and step being validated or supported. Missing references for schema/API/domain changes are grounds for requesting an update before merge.

---

## SECTION 9 — MIGRATION SAFETY

Large or risky database migrations must follow **safe deployment rules** so that production is not blocked or damaged. Apply these whenever a migration touches large tables, adds heavy indexes, or changes columns in a way that could lock tables or cause long-running updates.

### 9.1 Chunked migrations

- **Chunked migrations:** For data backfills or bulk updates (e.g. populating a new column from an existing one, or updating many rows), split the work into **chunks** (e.g. by id range or by batch size). Run one chunk per migration step or per job run, with a limit on rows per chunk. This avoids long-running transactions and allows progress to be resumed after failure or deployment.

### 9.2 Backfill jobs

- **Backfill jobs:** Prefer **async backfill jobs** (e.g. queue jobs that process N rows at a time) over a single migration that updates the whole table in one transaction. The migration adds the column or structure (nullable or with default); the backfill job fills data in the background. Deploy migration first; then run or schedule the backfill; then optionally add a follow-up migration to add a NOT NULL constraint or drop the default once backfill is complete and verified.

### 9.3 Online index creation

- **Online index creation:** Where the database supports it, create indexes **online** (e.g. CREATE INDEX CONCURRENTLY in PostgreSQL) so that the table remains writable during index build. Avoid blocking writes with a long-running index creation in a single transaction. If online creation is not available, plan the migration for a low-traffic window and communicate the expected lock duration.

### 9.4 No long table locks

- **No long table locks:** Do not run migrations that hold **exclusive locks** on large tables for a long time (e.g. full table rewrite, heavy ALTER). Prefer additive changes (new column, new table) and backfill; use multiple small migrations instead of one large one. If a long lock is unavoidable, it must be planned, approved, and executed in a maintenance window with rollback and monitoring.

### 9.5 Avoid blocking production databases

- **Summary:** The goal is to **avoid blocking production databases**. Chunking, backfill jobs, online index creation, and avoiding long locks reduce the risk of outages and allow deployments to proceed safely. Document migration strategy (including rollback) in the migration or in a short runbook.

---

## SECTION 10 — INCIDENT RESPONSE

If a **production incident** occurs, follow this process. The goal is to restore service, understand cause, and prevent recurrence without making the situation worse.

### 10.1 Steps

1. **Freeze deployments** — Stop non-emergency deployments and changes to the affected service or area. Prevent additional changes from complicating diagnosis or rollback. Communicate the freeze to the team.

2. **Collect logs, metrics, traces** — Gather **logs** (structured logs for the time window and component), **metrics** (error rate, latency, queue depth, etc.), and **traces** (if available) for the incident period. Preserve them for the postmortem; do not rely on volatile buffers. Use OBSERVABILITY_ARCHITECTURE and SECURITY_ARCHITECTURE (no secrets or PII in shared artifacts).

3. **Identify root cause** — Analyze the collected data to determine **root cause** (not only symptoms). Distinguish between trigger (e.g. traffic spike, bad payload) and underlying cause (e.g. missing index, bug, misconfiguration). Document findings so they can be used in the postmortem.

4. **Rollback if necessary** — If the incident is caused by a recent deployment or migration, **rollback** (revert the deployment or apply the rollback migration) if that is the fastest and safest way to restore service. Follow the rollback plan; verify that the system is stable after rollback. If rollback is not possible or not sufficient, apply a fix forward (hotfix) with the same rigor (review, testing where possible).

5. **Write postmortem** — After the incident is resolved, write a **postmortem** (see below). Publish it to the team and store it in a known location. Schedule any follow-up actions (e.g. fix, migration, alert, runbook update).

### 10.2 Postmortem must include

- **Timeline** — When the incident started, when it was detected, key actions taken (e.g. freeze, rollback, fix), when service was restored. Use UTC and relative times so that correlation with logs and metrics is clear.

- **Root cause** — Concise explanation of the underlying cause (code bug, config error, migration issue, dependency failure, etc.). Reference logs, metrics, or traces where helpful. Avoid blame; focus on systems and process.

- **Impact** — Who or what was affected (users, orders, API, workers), for how long, and to what degree (e.g. errors, latency, data). Quantify where possible (e.g. error rate, number of failed orders).

- **Prevention steps** — Concrete actions to reduce the chance of recurrence: code or config fix, new test, new alert, migration safety improvement, runbook update, or process change. Assign owners and deadlines where appropriate.

---

*End of Development Guardrails.*

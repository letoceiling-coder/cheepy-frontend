# Security Architecture

**Document type:** Platform-wide security model (no code)  
**Audience:** Architects, security and backend leads  
**Context:** Aligns with PLATFORM_MASTER_ARCHITECTURE.md, IDENTITY_SYSTEM_ARCHITECTURE.md, API_ARCHITECTURE.md, ORDER_SYSTEM_ARCHITECTURE.md, and INFRASTRUCTURE_ARCHITECTURE.md. Defines security principles, authentication, API protections, secrets, payment handling, data protection, and internal security.

---

## STEP 1 — SECURITY PRINCIPLES

### 1.1 Least privilege

- **Principle:** Every identity (user, role, service) has only the **minimum access** required to perform its function. No broad “admin” where “read-only” suffices; no seller access to other sellers’ data; no buyer access to order or PII of others.
- **Application:** **Roles** (buyer, seller, admin, crm_operator, support) and **permissions** (order.view, product.moderate, payout.approve) restrict what each user can do. **seller_accounts** restrict seller scope to linked seller_id(s). **API domains** (public, buyer, seller, admin, crm, internal) enforce boundaries: public_api has no write; buyer_api only own cart/orders; seller_api only own products/orders/shipments/balance. Internal workers and services use **service tokens** with scope only for the operations they perform (e.g. enqueue job, index product). No shared “super” credential for all operations.

### 1.2 Defense in depth

- **Principle:** Security does not rely on a single control. Multiple layers (network, application, data, monitoring) reduce the impact of a single failure.
- **Application:** **Network:** TLS for all client and service traffic; optional WAF or DDoS mitigation in front of the API. **Application:** Authentication at API gateway or middleware; authorization per endpoint (role + permission or resource scope); **request validation** (schema, size, type) to reject malformed or malicious input. **Data:** Sensitive data (passwords, tokens, PII) not logged in plain form; **secrets** in environment or secret manager, not in code or config files in repo. **Monitoring:** Audit-relevant actions (e.g. login, role change, payout approve) logged; failed auth and rate-limit events monitored for abuse.

### 1.3 Secure defaults

- **Principle:** Default configuration is **secure**; unsafe behavior must be explicitly enabled. New users, new roles, and new features start with restrictive settings.
- **Application:** **Users:** New accounts are not admin or seller; they have only buyer (or default) role until explicitly granted seller/admin. **Products:** New products from parser have moderation_status = pending_moderation and are not visible until approved. **Sessions:** Expiry and revocation (user_sessions.expires_at, revoked_at) are enforced by default. **API:** Public endpoints are read-only; write and sensitive read require auth. **Secrets:** Default is no default secret; missing secret causes startup failure rather than fallback to a weak value.

### 1.4 Zero trust between services

- **Principle:** Internal services do not trust each other by network location alone. Every call from one service to another (e.g. frontend to API, worker to API, gateway to platform) is **authenticated and authorized**.
- **Application:** **internal_api** is not “open to localhost”; it requires a **service token** (or machine credential) that is validated on every request. Workers that call back into the platform (e.g. to mark job complete or to trigger a callback) use a scoped token. **Webhooks** from payment or carrier are not trusted by IP; they are verified with a **signed secret** (signature of payload). No “internal only” endpoints that skip auth when called from a “trusted” IP unless that IP check is an additional layer, not the only layer.

---

## STEP 2 — AUTHENTICATION SECURITY

### 2.1 User authentication

- **Principle:** Only verified identity is accepted. Authentication must be resistant to credential stuffing, replay, and theft.
- **Rules:** **Login:** Use constant-time comparison for any server-side secret comparison (e.g. token hash). **Failed attempts:** Optional lockout or backoff after N failed logins per identifier (email/phone/IP) to limit brute force; do not reveal whether the identifier exists (e.g. same message for “wrong password” and “unknown user”). **Multi-factor:** If 2FA is supported (IDENTITY_SYSTEM_ARCHITECTURE: two_factor_enabled), store only hashed or encrypted backup codes; TOTP secret not in plain text. **Social/Telegram:** Rely on provider’s auth; validate state and token from provider; do not trust client-supplied “provider user id” without verification. **Password reset:** Token is single-use and short-lived (e.g. 1 hour); invalidate after use; store hash of token if stored at all.

### 2.2 Password hashing

- **Principle:** Passwords must not be stored in reversible form. Use a **strong adaptive hash** so that a compromise of the DB does not reveal passwords.
- **Rules:** **Algorithm:** Use a modern algorithm (e.g. bcrypt, Argon2id) with a **cost factor** (work factor) appropriate for the platform (e.g. bcrypt cost ≥ 12; Argon2id with recommended memory/time). **Salt:** Algorithm-provided salt (per hash); no global salt. **No plain text:** Never log or transmit the password; compare only via the hash API (e.g. verify(password, hash)). **Storage:** Only the hash (and algorithm identifier if needed) is stored in **users.password_hash** (IDENTITY_SYSTEM_ARCHITECTURE). No “password” or “password_plain” column.

### 2.3 Token handling

- **Principle:** Tokens (session token, Bearer token, refresh token) are **secrets**. They must be transmitted only over TLS, stored securely on the client, and invalidated on logout or compromise.
- **Rules:** **Transmission:** Tokens are sent in **Authorization: Bearer &lt;token&gt;** or in an **HttpOnly, Secure, SameSite** cookie (for session). Not in URL or Referer. **Storage (client):** If stored in browser, prefer **HttpOnly cookie** for session so script cannot read it (XSS cannot steal). If Bearer token in localStorage or app storage, ensure no other origin can read it; document risk of XSS. **Server:** Store only **token_hash** (or session_id hash) in user_sessions; never store the raw token in DB. **Validation:** On each request, resolve token to user_id and check user_sessions.expires_at and revoked_at; reject expired or revoked. **Refresh:** If refresh tokens are used, they are long-lived but single-use (rotate on use); store hash; revoke family on reuse (token theft detection).

### 2.4 Session management

- **Principle:** Sessions are bound to an identity and have a bounded lifetime and a secure invalidation path.
- **Rules:** **Expiry:** user_sessions.expires_at is enforced; session is invalid after that time. **Logout:** Set user_sessions.revoked_at (or delete row) so the token cannot be used again. **Logout everywhere:** Revoke all sessions for that user_id when user requests “log out all devices”. **Binding:** Optional: bind session to IP or User-Agent for high-sensitivity actions; document trade-off (usability vs theft from same device). **Concurrency:** Limit number of active sessions per user if needed (e.g. revoke oldest when exceeding N). **Listing:** Admin or user may list active sessions (device_info, last_activity_at) and revoke by session id.

---

## STEP 3 — API SECURITY

### 3.1 Rate limiting

- **Principle:** Limit request rate per identifier to reduce abuse, brute force, and DoS. Applied at API boundary (see API_ARCHITECTURE).
- **Rules:** **Redis-backed** counters (or sliding window) per API domain and identifier (IP, user_id, service_id). **Public API:** By IP (and optional session); stricter for search or heavy listing. **Buyer/Seller/Admin/CRM:** By user_id; stricter for login, checkout, payout-request. **Webhooks:** By provider and IP; reject if over limit or invalid signature. **Response:** 429 Too Many Requests with Retry-After; do not leak internal state. **No bypass:** Internal API and webhooks are also rate-limited (by service or provider) to prevent runaway callers.

### 3.2 Request validation

- **Principle:** Reject invalid or malicious input before it reaches business logic. Validate type, size, format, and business rules.
- **Rules:** **Schema:** Request body and query params conform to a defined schema (e.g. type, max length, allowed values). **Size:** Limit request body size (e.g. max 1 MB for JSON); reject oversized. **Content-Type:** Accept only expected types (e.g. application/json for JSON APIs); reject others. **Injection:** Do not concatenate user input into raw queries or commands; use parameterized queries and safe APIs. **XSS:** Sanitize or escape user-generated content when rendering (storefront, admin, emails); CSP and encoding per context. **Path traversal:** Reject paths containing .. or absolute paths when mapping to file or resource id. **IDs:** Validate that ids (product_id, order_id) are expected type (e.g. integer or UUID); 404 for non-existent, not 500.

### 3.3 CORS

- **Principle:** Browser same-origin policy is enforced; cross-origin requests are allowed only from **explicitly allowed origins**.
- **Rules:** **Allow list:** Only origins that operate the storefront or admin (e.g. https://siteaacess.store, https://admin.siteaacess.store) are in the allow list. No wildcard for credentialed requests. **Credentials:** If cookies or Authorization header are sent, Access-Control-Allow-Origin must be a specific origin, not *. **Methods and headers:** Expose only needed methods (GET, POST, PATCH, DELETE) and headers; avoid Allow: * for headers. **Preflight:** Respond correctly to OPTIONS with allowed origin, methods, headers, and max-age. **Internal and webhooks:** CORS does not apply to server-to-server (internal_api, webhooks); only to browser-originated requests.

### 3.4 CSRF protection

- **Principle:** State-changing requests from the browser must not be executable by a malicious site on another origin (cross-site request forgery).
- **Rules:** **Cookie-based session:** If session is in cookie, use **SameSite=Strict or Lax** so cookie is not sent on cross-site POST. For strict state-changing operations (e.g. checkout, payout, role change), require **CSRF token**: server sends a token in a non-cookie way (e.g. meta tag or response header); client sends it back in header or body; server validates token per session. **Bearer token:** If the client uses only Authorization: Bearer and no session cookie for API calls, CSRF is mitigated (malicious site cannot read the token due to same-origin). **Idempotency:** For payment or order placement, **idempotency key** (client-generated) reduces impact of duplicate submission (including accidental double-submit from another tab).

### 3.5 Secure headers

- **Principle:** HTTP response headers signal to the browser and client how to treat the response and how to enforce security.
- **Rules:** **Strict-Transport-Security (HSTS):** Enforce HTTPS for the domain (e.g. max-age=31536000; includeSubDomains). **X-Content-Type-Options:** nosniff so the browser does not MIME-sniff. **X-Frame-Options:** DENY or SAMEORIGIN to reduce clickjacking; or **Content-Security-Policy** frame-ancestors. **Content-Security-Policy:** Restrict script and resource origins (e.g. script-src self; style-src self) to reduce XSS. **Referrer-Policy:** Limit referrer (e.g. strict-origin-when-cross-origin) so sensitive URLs are not leaked. **Permissions-Policy:** Disable unneeded browser features (e.g. camera, geolocation) if not used. **Cache:** Do not cache sensitive responses (e.g. Cache-Control: no-store for API that returns PII or tokens).

---

## STEP 4 — SECRETS MANAGEMENT

### 4.1 Where secrets live

- **Principle:** Secrets (DB credentials, API keys, signing keys, webhook secrets) are **not** in source code or in config files committed to the repo. They are supplied at **deploy time** or at **runtime** from a controlled store.
- **Environment variables:** **Development and small deployments:** Secrets are set in the process environment (e.g. DB_PASSWORD, JWT_SECRET, PAYMENT_GATEWAY_SECRET). The application reads them at startup. **Risk:** Env vars may appear in process listings or in shell history; restrict access to the host and to deployment pipelines. **Production:** Prefer a **secret manager** (e.g. HashiCorp Vault, cloud provider secret manager) that injects secrets into the environment or mounts them as files; the application does not change, only the source of the env or file.
- **Secret manager:** **Production (recommended):** Secrets are stored in a dedicated service (Vault, AWS Secrets Manager, etc.). The application or orchestration (e.g. Kubernetes secret, startup script) fetches them at startup and provides them as env vars or temp files. **Benefits:** Central rotation, audit of access, no secrets in config repo. **Scope:** DB credentials, JWT signing key, payment gateway keys, webhook signing secrets, internal service tokens, Redis password, SMTP credentials.

### 4.2 Rotation policies

- **Principle:** Secrets are **rotated** periodically or on compromise so that a leaked value has limited validity.
- **Rules:** **Passwords:** User password change invalidates existing sessions (or only current session) per policy. **JWT signing key:** If symmetric (e.g. HS256), rotation requires all issuers and verifiers to use the new key; support a short overlap (e.g. accept old key for 24h). If asymmetric (RS256), private key rotation and new public key distribution. **DB and Redis:** Rotate credentials; update app config and restart; avoid long-lived shared passwords. **Webhook secrets:** Rotate per provider; update platform config and provider dashboard in sync; use a new secret and deprecate the old one during overlap. **Service tokens:** Rotate internal_api tokens; issue new token, update calling services, revoke old. **Document:** Define rotation interval (e.g. 90 days for DB, 1 year for JWT key) and procedure (who rotates, how to update consumers, rollback if failure).

---

## STEP 5 — PAYMENT SECURITY

### 5.1 No card storage

- **Principle:** The platform **does not store** full card numbers, CVV, or magnetic-stripe data. Card data goes **only** to the payment gateway (e.g. Stripe, YooKassa). This keeps the platform out of PCI DSS scope for card data (or minimizes it to gateway’s hosted fields / redirect).
- **Rules:** **Checkout:** Card entry is either (a) **redirect** to gateway’s page, or (b) **hosted fields** or **gateway SDK** that send card data directly from the client to the gateway; the platform never receives card number or CVV. **Storage:** The platform stores only **gateway_payment_id**, **gateway_transaction_id**, and optional last4 or brand if returned by the gateway for display. No full PAN, no CVV, no track data. **Logs:** Do not log request body that might contain card data; gateway webhook payload may contain only non-sensitive identifiers.

### 5.2 Gateway only

- **Principle:** All **capture, refund, and payout** flows go through the **contracted payment gateway**. The platform never directly debits or credits cards or bank accounts; it instructs the gateway via API and receives webhooks for status.
- **Rules:** **Capture:** Checkout calls gateway API (from backend) with amount and reference; gateway returns success/failure; platform records payment and payment_transactions (ORDER_SYSTEM_ARCHITECTURE, MARKETPLACE_FINANCIAL_ARCHITECTURE). **Refund:** Platform calls gateway refund API with payment id and amount; gateway sends webhook; platform updates payment_transactions and seller balance. **Credentials:** Gateway API keys and secrets are in **secrets management**; only backend and workers use them; never exposed to frontend or in API responses.

### 5.3 Webhook verification

- **Principle:** Inbound webhooks from the payment (or carrier) provider are **not trusted by origin alone**. Each request must be **cryptographically verified** so that an attacker cannot forge “payment succeeded” or “refund completed”.
- **Rules:** **Signature:** Provider sends a signature (e.g. X-Signature: HMAC-SHA256(body, webhook_secret)). Platform recomputes HMAC with the same webhook_secret and compares; reject if mismatch. **Secret:** webhook_secret is per provider (or per endpoint), stored in secrets; never in client or logs. **Replay:** Include timestamp in payload or signature; reject if timestamp is too old (e.g. > 5 minutes). **Idempotency:** Process each webhook event id (or payment_intent_id) at most once; store processed id and skip duplicate delivery. **Response:** Return 2xx only after verification and successful processing; non-2xx may cause provider to retry—ensure handler is idempotent.

---

## STEP 6 — DATA PROTECTION

### 6.1 PII

- **Principle:** **Personally identifiable information** (email, phone, name, address, payment identifiers) is sensitive. Access is limited to roles that need it; storage and transmission are protected; logging and analytics do not expose raw PII unnecessarily.
- **Rules:** **Access:** Only **buyer** (own profile, addresses, orders), **seller** (own data), **admin/CRM** (for support and operations) can access PII per API_ARCHITECTURE and IDENTITY_SYSTEM_ARCHITECTURE. **Transmission:** TLS for all API and storefront; no PII in URL or Referer when possible. **Storage:** DB and backups are access-controlled and encrypted at rest (per deployment); application does not store PII in plain text in logs or in cache keys that could be dumped. **Logs:** Do not log full email, phone, or address; mask or hash in logs (e.g. last4 of email, or “***” for address). **Retention:** Define retention for PII (e.g. order and customer data); purge or anonymize after retention period if required by policy.

### 6.2 Seller documents

- **Principle:** **seller_documents** (IDENTITY_SYSTEM_ARCHITECTURE) contain verification artifacts (ID, company registration, tax). They are **confidential**; only the owning seller (via seller_api), admin, and CRM (for verification) should access them.
- **Rules:** **Storage:** Files are in **object storage** with path not guessable (e.g. UUID or signed path); bucket is not public. **Download:** Download URL is **signed** (temporary) or served via backend that checks **authorization** (user is admin, or user is seller and document.seller_id is in user’s seller_accounts). **Transmission:** HTTPS only. **Logs:** Do not log file content or full path in access logs; log only “document accessed, document_id, user_id” for audit.

### 6.3 Order data

- **Principle:** **Orders** and **order_items** (ORDER_SYSTEM_ARCHITECTURE) contain buyer identity, address, and payment outcome. They are **business-critical and sensitive**; access is scoped to buyer (own orders), seller (own items/shipments), admin, and CRM.
- **Rules:** **Access control:** buyer_api returns only orders where buyer_user_id = current user (or guest match by token); seller_api returns only order_items/shipments for seller_id in seller_accounts; admin/crm see all but are audited. **Display:** In storefront and emails, mask or truncate if needed (e.g. last4 of card in order confirmation). **Backup:** Backups of order data are encrypted and access-controlled; same retention and purge policy as live DB.

### 6.4 Access logs

- **Principle:** **Audit trail** of who accessed what and when supports compliance and incident response. Sensitive data must not be written into logs in plain form.
- **Rules:** **What to log:** For sensitive operations: **user_id** (or service id), **action** (e.g. order.view, document.download, payout.approve), **resource** (e.g. order_id, document_id), **timestamp**, **result** (success/failure), **IP** (optional). **What not to log:** Passwords, tokens, full PII (email, address), card data, webhook payloads that contain secrets. **Storage:** Logs go to a **centralized** store (e.g. log aggregation) with access control; restrict who can search and export. **Retention:** Define retention for access/audit logs (e.g. 1 year); archive or delete after.

---

## STEP 7 — INTERNAL SECURITY

### 7.1 internal_api authentication

- **Principle:** **internal_api** (API_ARCHITECTURE) is used by workers, schedulers, and other backend services. Every request must be **authenticated** so that only trusted services can call it.
- **Rules:** **Service token:** Each internal client has a **service token** (e.g. API key or JWT with issuer “internal”). Token is passed in header (e.g. X-Internal-Token or Authorization: Bearer). **Validation:** Server validates token on every request: check signature (if JWT) or lookup in allowed list; reject if missing or invalid. **Scope:** Token may be scoped (e.g. “event-dispatcher” can only enqueue jobs; “index-worker” can only call index endpoint). **No user context:** internal_api does not carry user_id; it carries service identity and optionally correlation_id or job_id.

### 7.2 Service tokens

- **Principle:** Service tokens are **secrets**; they are created, stored, and rotated in a controlled way.
- **Rules:** **Generation:** Tokens are generated with sufficient entropy (e.g. 256-bit random); stored as hash on server if needed for validation, or validated via signature (JWT). **Distribution:** Tokens are given to the deploying service (e.g. worker) via **secrets management** (env or secret manager); not in code or in a shared doc. **Rotation:** Rotate periodically; update all consumers and revoke old token. **Revocation:** If a token is compromised, revoke immediately; have a revocation list or short-lived JWT so that revoked tokens are rejected.

### 7.3 Worker security

- **Principle:** **Workers** (parser, event, email — INFRASTRUCTURE_ARCHITECTURE) run with the **least privilege** needed: DB and queue access, no unnecessary network exposure; they consume jobs and call internal or external APIs with scoped credentials.
- **Rules:** **Process:** Workers run under a **dedicated OS user** (not root); files and DB credentials are readable only by that user. **Network:** Workers do not expose an HTTP server to the internet; they pull from queue (DB or Redis) and call out to gateway, SMTP, or internal_api. **Secrets:** Workers receive DB URL, Redis URL, gateway keys, and internal_api token via environment or secret manager; same rotation policy. **Jobs:** Job payload may contain ids (order_id, product_id); workers must not trust payload beyond what is needed (validate id format and existence); do not execute arbitrary code from payload. **Errors:** Do not log full payload or customer data in error messages; log job_id and error type for debugging.

---

## STEP 8 — FINAL DOCUMENT (SUMMARY)

### 8.1 Security principles (recap)

- **Least privilege:** Roles, permissions, seller_accounts, and API domains limit access to the minimum required.  
- **Defense in depth:** TLS, auth, validation, data protection, and monitoring.  
- **Secure defaults:** New users and resources start restricted; no default weak secrets.  
- **Zero trust:** internal_api and webhooks require authentication and verification; no trust by network alone.

### 8.2 Authentication security (recap)

- **User auth:** Constant-time comparison; optional lockout; 2FA secrets not stored plain.  
- **Passwords:** Strong adaptive hash (bcrypt/Argon2); salt per hash; never store or log plain password.  
- **Tokens:** TLS only; HttpOnly/Secure/SameSite for cookies; server stores only token hash; validate expiry and revocation.  
- **Sessions:** Expiry and revocation enforced; logout invalidates token; optional “logout everywhere.”

### 8.3 API security (recap)

- **Rate limiting:** Redis-backed, per domain and identifier; 429 and Retry-After.  
- **Request validation:** Schema, size, type; no injection; safe encoding for output.  
- **CORS:** Allow list of origins; no wildcard for credentialed; correct preflight.  
- **CSRF:** SameSite cookie and/or CSRF token for state-changing browser requests; Bearer-only APIs mitigate CSRF.  
- **Secure headers:** HSTS, X-Content-Type-Options, X-Frame-Options, CSP, Referrer-Policy; no-store for sensitive responses.

### 8.4 Secrets (recap)

- **Location:** Environment or secret manager; never in repo or client.  
- **Rotation:** Passwords, JWT key, DB/Redis, webhook secrets, service tokens; document interval and procedure.

### 8.5 Payment (recap)

- **No card storage:** Gateway only; platform stores only gateway ids and optional last4.  
- **Webhook verification:** Signature (e.g. HMAC) with webhook_secret; replay protection; idempotent handling.

### 8.6 Data protection (recap)

- **PII:** Access by role; TLS; no PII in logs; retention and purge policy.  
- **Seller documents:** Private storage; signed or auth-backed download; audit log without content.  
- **Order data:** Scoped by buyer/seller/admin; backups encrypted; same retention.  
- **Access logs:** Log who/what/when; do not log secrets or full PII; centralized store and retention.

### 8.7 Internal security (recap)

- **internal_api:** Service token required; validated on every request; optional scope per token.  
- **Service tokens:** Strong generation; distribution via secrets; rotation and revocation.  
- **Workers:** Least privilege process and network; secrets from env/manager; validate job payload; safe error logging.

### 8.8 Dependencies

- **IDENTITY_SYSTEM_ARCHITECTURE:** users, user_sessions, user_roles, permissions, seller_accounts; password and session model.  
- **API_ARCHITECTURE:** API domains, auth per domain, rate limiting.  
- **ORDER_SYSTEM_ARCHITECTURE:** orders, payments; no card storage; webhook for payment.  
- **INFRASTRUCTURE_ARCHITECTURE:** Redis (rate limiting, session); workers and jobs.

---

*End of Security Architecture.*

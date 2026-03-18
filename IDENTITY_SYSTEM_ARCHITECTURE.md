# Identity System Architecture

**Document type:** User and identity system design for the marketplace (no code)  
**Audience:** Backend/frontend leads, security  
**Context:** Builds on PRODUCT_ARCHITECTURE.md, ORDER_SYSTEM_ARCHITECTURE.md, MARKETPLACE_FINANCIAL_ARCHITECTURE.md, and DELIVERY_SYSTEM_ARCHITECTURE.md. Defines user types, identity tables, seller account and verification, and authentication methods.

---

## STEP 1 — USER TYPES

### 1.1 Buyer

- **Who:** A person who browses the catalog, adds items to the cart, and places orders. May be **guest** (no account; identified by session_id or guest_token) or **registered** (has a user account; orders and cart linked to user_id).
- **Capabilities:** View products, cart, checkout, pay, view order history and tracking, manage addresses, request returns. Registered buyers have persistent profile, addresses, and order history; guests have only session-scoped cart and one-time order with buyer_guest_email / buyer_phone.
- **Where used:** ORDER_SYSTEM_ARCHITECTURE: cart.user_id (nullable for guest), orders.buyer_user_id, orders.buyer_guest_email, orders.buyer_phone. Identity system provides the **user** behind buyer_user_id and the session/guest behind anonymous cart and guest checkout.

### 1.2 Seller

- **Who:** A merchant who lists products, fulfills orders, and receives payouts. In the catalog, **sellers** (sellers table) is the business entity (id, slug, name, contacts, etc.); the **seller user** is the person who logs in and operates the seller dashboard. One seller (business) can have one or more users with seller role; one user can be linked to one or more sellers (e.g. staff).
- **Capabilities:** Manage products (their own), view orders and shipments (their items), fulfill shipments, view balance and payout requests, upload documents for verification, manage payout destination (seller_wallets). Access is scoped to seller_id(s) linked to their account.
- **Where used:** PRODUCT_ARCHITECTURE (products.seller_id), ORDER_SYSTEM_ARCHITECTURE (order_items.seller_id), DELIVERY_SYSTEM_ARCHITECTURE (shipments.seller_id), MARKETPLACE_FINANCIAL_ARCHITECTURE (seller_balance, payout_requests). Identity system links **users** to **sellers** via seller_accounts so that “seller dashboard” is accessed by a user with seller role for a given seller_id.

### 1.3 Admin

- **Who:** Platform administrator with full access to catalog, orders, users, and system configuration. Typically internal staff.
- **Capabilities:** Manage catalog_categories, category_mapping, products (moderation, visibility), sellers (create, suspend, verify), users and roles, parser settings, commission rules, payouts, delivery methods and zones. Access to admin panel and APIs is gated by admin role and permissions.
- **Where used:** Catalog moderation (product approval), seller verification, order/return overrides, financial and delivery configuration. Identity system assigns admin role and permissions (e.g. permissions table) to control what each admin can do.

### 1.4 CRM Operator

- **Who:** User who works in CRM: orders, returns, customer and seller communication, but without full system configuration or financial payout approval.
- **Capabilities:** View and update orders (status, notes), process returns (approve, reject, restock), view customers and sellers, contact buyers/sellers, possibly moderate products or view reports. Typically **restricted** compared to admin: no payment gateway config, no commission rule edit, no user role assignment, or only specific permissions.
- **Where used:** ORDER_SYSTEM_ARCHITECTURE (order status, returns), support flows. Identity system assigns crm_operator role (or a role with a subset of permissions) so CRM panel and APIs are accessible with limited scope.

### 1.5 Support

- **Who:** User who handles customer and seller support: tickets, chats, refund/return assistance. May have read-only or limited write access to orders and returns.
- **Capabilities:** View orders and shipments, view returns, create refund or return on behalf of buyer (within policy), communicate with buyer/seller. Usually **no** access to catalog configuration, financial setup, or user/role management.
- **Where used:** Support tickets (future), return/refund flows. Identity system assigns support role with minimal permissions (e.g. view order, create return, view contact info).

### 1.6 Summary

| Type | Scope | Typical role(s) |
|------|--------|-----------------|
| **Buyer** | Storefront, cart, own orders | buyer (or no role; default for registered user) |
| **Seller** | Seller dashboard for linked seller(s) | seller |
| **Admin** | Full platform control | admin |
| **CRM operator** | Orders, returns, customers, limited config | crm_operator |
| **Support** | Support tools, limited order/return actions | support |

A single **user** can have multiple roles (e.g. same person is buyer and seller; or admin and crm_operator). Authorization is role- and permission-based; seller access is further scoped by seller_id via seller_accounts.

---

## STEP 2 — IDENTITY SYSTEM

### 2.1 users

- **Responsibility:** The **account** that can log in. One row per identity. Holds auth-related and global identity data; no business profile (that is in user_profiles). Can be used for both “person” (buyer, seller user, staff) and optionally system/bot accounts.
- **Columns (conceptual):** id, email (nullable, unique when set), email_verified_at (nullable), phone (nullable, unique when set), phone_verified_at (nullable), password_hash (nullable; null if only social/phone auth), is_active, last_login_at (nullable), created_at, updated_at. Optional: locale, timezone, two_factor_enabled. Do not store plain passwords; use standard hashing (e.g. bcrypt/argon2).
- **Relationship:** users have one user_profile; users have many user_addresses; users have many user_sessions; users have many user_roles (or one role; design choice). orders.buyer_user_id → users. cart.user_id → users. seller_accounts link users to sellers.

### 2.2 user_profiles

- **Responsibility:** **Display and contact** data for the user: name, avatar, optional legal name for invoices. Separates “auth identity” (users) from “profile” so profile can be updated without touching auth columns.
- **Columns (conceptual):** id, user_id (FK users, unique), first_name, last_name, display_name (nullable), avatar_url (nullable), phone (optional duplicate for display; or only in users), created_at, updated_at. Optional: legal_name (for invoices), date_of_birth, gender, preferred_language.
- **Relationship:** user_profiles.user_id → users. Orders and support may show profile name; checkout may use profile or user_address for shipping name.

### 2.3 user_addresses

- **Responsibility:** **Saved addresses** for a user (shipping, billing). Used at checkout “select address” and for delivery. Guest checkout does not create a user_address; registered user can save address after order or in profile.
- **Columns (conceptual):** id, user_id (FK users), label (optional, e.g. “Home”, “Office”), full_name, phone, country_code, region, city, street, building, apartment (optional), postal_code, is_default_shipping, is_default_billing, created_at, updated_at.
- **Relationship:** user_addresses.user_id → users. Shipments and orders may store a snapshot of the address (JSON or copy) at order time; user_addresses is the source when “use saved address” is selected.

### 2.4 user_sessions

- **Responsibility:** **Active sessions** for a user (browser, app). Used for “log out everywhere,” session invalidation, and optional device list. Each login creates a session row; refresh token or “remember me” can extend it; logout or expiry removes or marks inactive.
- **Columns (conceptual):** id, user_id (FK users), token_hash (or session_id; do not store raw token in DB if possible), device_info (optional: user_agent, device type), ip_address (optional), expires_at, last_activity_at, created_at. Optional: revoked_at (soft revoke).
- **Relationship:** user_sessions.user_id → users. Auth middleware resolves request token → user_id and checks expires_at and revoked_at. Cart can be keyed by user_id when logged in; guest cart uses session_id from cookie, not user_sessions.

### 2.5 user_roles

- **Responsibility:** Assign **role** to a user. Role names: buyer, seller, admin, crm_operator, support. One user can have multiple roles. Authorization checks “does this user have role X?” and, for seller, “is this user linked to seller_id Y?”
- **Columns (conceptual):** id, user_id (FK users), role (code: buyer | seller | admin | crm_operator | support), created_at. Unique (user_id, role). Optional: granted_by (user_id), valid_until (for temporary roles).
- **Relationship:** user_roles.user_id → users. seller_accounts (STEP 3) add seller_id scope when role = seller.

### 2.6 permissions

- **Responsibility:** **Fine-grained permissions** (e.g. order.view, order.edit, product.moderate, seller.verify, payout.approve). Roles are assigned a set of permissions; a user’s effective permissions are the union of all permissions of their roles. Optional: if admin/CRM/support differ only by permission set, one “staff” role with different permission sets can be used.
- **Columns (conceptual):** id, code (unique, e.g. order.view, product.moderate, seller.verify), name (display), description (optional), created_at. **role_permissions:** role (code or FK to roles table), permission_id (FK permissions). Many-to-many: role_permissions (role, permission_id). Alternatively, permissions are attached to roles in a roles table (id, code, name) and role_permissions (role_id, permission_id).
- **Relationship:** Authorization: user → user_roles → role → role_permissions → permissions. Check: does user have a role that has permission X? For seller-scoped actions: and (for role seller) user is linked to the relevant seller_id via seller_accounts.

### 2.7 Entity Relationship (Identity)

```
users ──► user_profiles (1:1)
    ├──► user_addresses (1:N)
    ├──► user_sessions (1:N)
    ├──► user_roles (1:N) ──► role_permissions ──► permissions
    └──► seller_accounts (1:N, for seller role) ──► sellers

orders.buyer_user_id ──► users
cart.user_id ──► users
```

---

## STEP 3 — SELLER IDENTITY

### 3.1 seller_accounts

- **Responsibility:** Link a **user** to a **seller** (business). A user with role “seller” must have at least one seller_account row to access any seller dashboard. One user can be linked to multiple sellers (e.g. staff of several stores); one seller can have multiple users (e.g. owner + manager). Optionally: role per link (owner, manager, support) to limit what each user can do for that seller.
- **Columns (conceptual):** id, user_id (FK users), seller_id (FK sellers), role (optional: owner | manager | staff; for future use), is_primary (optional; one “primary” seller for multi-seller user), created_at, updated_at. Unique (user_id, seller_id).
- **Relationship:** seller_accounts.user_id → users; seller_accounts.seller_id → sellers. When user has role seller, they see only sellers for which they have a seller_account. Products, orders, shipments, balance, and payouts are filtered by seller_id in (seller_ids linked to this user). sellers table remains the catalog/entity (name, slug, contacts); seller_accounts is the identity link “this user can act as this seller.”

### 3.2 seller_verification

- **Responsibility:** Track **verification status** of the seller (business): pending, verified, rejected. Used for trust badges, payout eligibility, or listing limits. Separate from user email/phone verification; this is “business verified.”
- **Columns (conceptual):** id, seller_id (FK sellers, unique or one active row per seller), status (pending | verified | rejected), verified_at (nullable), verified_by (nullable, user_id), rejection_reason (nullable), created_at, updated_at. Optional: verification_level (basic | full), next_review_at.
- **Relationship:** seller_verification.seller_id → sellers. Platform may require “verified” before first payout or before increasing listing limit. seller_verification is updated when documents are reviewed (seller_documents).

### 3.3 seller_documents

- **Responsibility:** **Documents** uploaded by the seller (or by a user linked via seller_accounts) for verification: ID, company registration, tax certificate, etc. Stored as file reference (path or storage id); metadata and review state in this table.
- **Columns (conceptual):** id, seller_id (FK sellers), type (e.g. id_card | company_registration | tax_certificate | bank_statement), file_path (or storage_key), file_name (original), mime_type (optional), status (pending | approved | rejected), reviewed_at (nullable), reviewed_by (nullable, user_id), rejection_reason (nullable), created_at, updated_at. Optional: expires_at (for temporary documents).
- **Relationship:** seller_documents.seller_id → sellers. Verification workflow: seller uploads documents → status = pending; admin/reviewer approves or rejects → status updated; when required set is approved, seller_verification.status can move to verified.

### 3.4 Sellers Table (Existing) and Identity

- **sellers** (from PRODUCT_ARCHITECTURE / catalog): id, slug, name, source_url, pavilion, contacts (phone, whatsapp, telegram, vk), status, is_verified, products_count, last_parsed_at. This is the **business** entity. **is_verified** can be deprecated in favor of seller_verification.status, or kept in sync. **Identity:** A seller row may be created by parser (donor) or by platform when a user registers as seller. Registration flow: user signs up → applies to become seller → platform creates sellers row (or links to existing) and seller_accounts (user_id, seller_id); seller submits documents → seller_documents; after review, seller_verification.status = verified. Parser-created sellers have no user link initially; later a user can “claim” the seller (seller_accounts) after verification.

### 3.5 Entity Relationship (Seller Identity)

```
users ──► user_roles (role = seller)
    │
    └──► seller_accounts ──► sellers
                │
                ├──► seller_verification (seller_id)
                └──► seller_documents (seller_id)
```

---

## STEP 4 — AUTH SYSTEM

### 4.1 Login Methods (Overview)

- **Email:** User registers or logs in with email + password. users.email and users.password_hash; email_verified_at set after verification (link or code). Login: validate password against hash; create or refresh user_sessions; return session/token to client.
- **Phone:** User registers or logs in with phone. users.phone; phone_verified_at set after OTP. Login: send OTP to phone; user submits OTP; validate; create/refresh session. Optional: phone + password as alternative.
- **Social:** Login via OAuth (Google, VK, etc.). No password in users; link social provider id to user. **user_social_accounts** (or auth_providers): user_id, provider (google | vk | …), provider_user_id, access_token (optional, short-lived), created_at. First login: create users row (email/name from provider), create user_social_accounts row. Subsequent: find user by provider + provider_user_id → login.
- **Telegram:** Login via Telegram (e.g. Telegram Login Widget or bot). Provider = telegram; provider_user_id = telegram id. Same pattern as social: user_telegram_accounts or user_social_accounts (provider = telegram). Optional: store telegram_username for support.

### 4.2 Email Auth

- **Register:** Collect email, password (and optionally name). Create users (email, password_hash), user_profiles (first_name, last_name), user_roles (buyer). Send verification email; set email_verified_at when user clicks link or enters code. Optional: require email_verified before checkout or before seller application.
- **Login:** Accept email + password. Look up user by email; verify password (hash compare). Create user_sessions row; return token/session to client. Optionally set last_login_at.
- **Password reset:** Request reset → generate secure token (stored in password_resets table with expiry); send link; user sets new password → update users.password_hash, invalidate token.

### 4.3 Phone Auth

- **Register / Login:** Collect phone (normalized). Send OTP (SMS or voice). Store OTP in short-lived table (phone, code, expires_at) or use provider. User submits code; validate; if new phone, create users (phone), user_profiles, user_roles (buyer); set phone_verified_at. Create session. Optional: phone + password for returning users to skip OTP.
- **Verification:** phone_verified_at is set when OTP is successfully used. Optional: require phone_verified for seller or for high-value orders.

### 4.4 Social Auth (Google, VK, etc.)

- **Flow:** Client redirects to provider; provider redirects back with code or token. Backend exchanges for provider user id and profile (email, name). Look up user_social_accounts (provider, provider_user_id). If found → load user, create session. If not found: create users (email from provider if present), user_profiles (name), user_social_accounts (provider, provider_user_id), user_roles (buyer); create session. Optional: link to existing user if email matches and email already verified.
- **Table (conceptual):** user_auth_providers or user_social_accounts: id, user_id (FK users), provider (google | vk | facebook | …), provider_user_id, email (nullable, from provider), created_at. Unique (provider, provider_user_id).

### 4.5 Telegram Auth

- **Flow:** Telegram Login Widget or bot returns telegram user id (and optional username, name). Backend receives hash and validates (Telegram docs). Look up user_auth_providers (provider = telegram, provider_user_id = telegram_id). If found → login. If not found: create users (email nullable; or require email later for payouts), user_profiles (name from Telegram), user_auth_providers (telegram, telegram_id), user_roles (buyer); create session. Optional: telegram_username stored for support or notifications.
- **Table:** Same as social: user_auth_providers (provider = 'telegram', provider_user_id = telegram id). One user can have both email and Telegram linked (multiple rows in user_auth_providers for same user_id).

### 4.6 Unified Identity and Account Linking

- **One user, many logins:** users is one row; user_auth_providers can have multiple rows (email+password, Google, Telegram). So “login with Telegram” and “login with Google” can resolve to the same user if linked. Linking flow: user already logged in → “Link Telegram” → add user_auth_providers (user_id, telegram, …). Next time they can log in with Telegram and get the same user.
- **Guest → user:** At checkout, guest has cart by session_id. If guest registers or logs in, merge cart: update cart_items.cart_id to the user’s cart (or move items to user cart and delete guest cart). orders.buyer_user_id: guest checkout leaves it null and uses buyer_guest_email; if they later create an account, optional “link past orders to my account” by email match.

### 4.7 Auth Table Summary

- **users:** email, phone, password_hash, email_verified_at, phone_verified_at.
- **user_sessions:** user_id, token_hash (or session id), expires_at, device_info.
- **user_auth_providers:** user_id, provider (email | google | vk | telegram | …), provider_user_id (or email for local), optional token fields. Unique (provider, provider_user_id). For email+password, provider = 'email' and provider_user_id = email; or keep password in users and treat “email” as built-in (no row in user_auth_providers). Design choice: either all auth in user_auth_providers (password_hash in a secure store per provider) or users table holds email/phone/password and user_auth_providers only for social/Telegram.

Recommended: **users** holds email, phone, password_hash (nullable), verified flags. **user_auth_providers** holds only external providers (google, vk, telegram). Email and phone login use users table; social/Telegram use user_auth_providers to find user_id, then session is for that user.

---

## STEP 5 — FINAL DOCUMENT (Summary)

### 5.1 User Types (Recap)

| Type | Role(s) | Scope |
|------|---------|--------|
| **Buyer** | buyer | Storefront, cart, own orders, addresses |
| **Seller** | seller | Seller dashboard for linked seller(s); products, orders, shipments, balance, payouts |
| **Admin** | admin | Full platform: catalog, orders, users, financials, delivery |
| **CRM operator** | crm_operator | Orders, returns, customers; limited config |
| **Support** | support | Support tools; limited order/return actions |

### 5.2 Table Summary

| Entity | Purpose |
|--------|---------|
| **users** | Login identity: email, phone, password_hash, verified flags. |
| **user_profiles** | Display: name, avatar, optional legal name. |
| **user_addresses** | Saved shipping/billing addresses per user. |
| **user_sessions** | Active sessions; token/session id, expiry, device. |
| **user_roles** | Assignment of role (buyer, seller, admin, crm_operator, support) per user. |
| **permissions** | Fine-grained permission codes; role_permissions links roles to permissions. |
| **seller_accounts** | Link user_id to seller_id; user with seller role can act for that seller. |
| **seller_verification** | Seller (business) verification status: pending, verified, rejected. |
| **seller_documents** | Documents uploaded for verification; type, file, status, review. |
| **user_auth_providers** | External auth: provider (google, vk, telegram), provider_user_id; link to users. |

### 5.3 Dependencies

- **ORDER_SYSTEM_ARCHITECTURE:** orders.buyer_user_id → users; cart.user_id → users; guest uses session_id/guest_token (no user). user_addresses feed checkout address.
- **PRODUCT_ARCHITECTURE / Catalog:** sellers table is the business entity; seller_accounts link users to sellers for dashboard access.
- **MARKETPLACE_FINANCIAL_ARCHITECTURE:** payout_requests.requested_by (user_id); seller_verification can gate payout eligibility.
- **DELIVERY_SYSTEM_ARCHITECTURE:** Shipments are per seller; seller dashboard user is identified via seller_accounts (user → seller).

### 5.4 Auth Methods (Recap)

- **Email:** Register/login with email + password; email_verified_at; password reset flow.
- **Phone:** Register/login with phone + OTP; phone_verified_at.
- **Social:** OAuth (Google, VK, etc.); user_auth_providers (provider, provider_user_id); create or link user.
- **Telegram:** Telegram Login Widget/bot; user_auth_providers (provider = telegram); same link/create user pattern.

### 5.5 Indexing (Conceptual)

- **users:** (email unique), (phone unique), (is_active).
- **user_profiles:** (user_id unique).
- **user_addresses:** (user_id), (is_default_shipping), (is_default_billing).
- **user_sessions:** (user_id), (expires_at), (token_hash or session_id unique).
- **user_roles:** (user_id, role unique).
- **role_permissions:** (role_id, permission_id).
- **seller_accounts:** (user_id), (seller_id), unique (user_id, seller_id).
- **seller_verification:** (seller_id), (status).
- **seller_documents:** (seller_id), (type), (status).
- **user_auth_providers:** (provider, provider_user_id unique), (user_id).

---

*End of Identity System Architecture.*

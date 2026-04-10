# CMS Content Architecture

**Document type:** CMS and content system design for the marketplace (no code)  
**Audience:** Backend/frontend leads, content editors  
**Context:** Powers home page, category pages, landing pages, promo pages; integrates with the existing frontend **constructor block system** (blockRegistry, blockRenderer, BlockConfig). Builds on catalog and marketplace architecture docs where pages may reference categories or products.

---

## STEP 1 — CONTENT ENTITIES

### 1.1 pages

- **Responsibility:** A **content page** that can be the home page, a category page override, a landing page, or a promo page. Identified by a **page key** (e.g. `home`, `category:shoes`, `landing:summer-sale`, `promo:black-friday`) so the frontend can request “layout for this key.” One row per logical page; which **version** is live is determined by status (draft / review / published) and optional versioning (page_versions).
- **Columns (conceptual):** id, page_key (unique, e.g. home | category:{slug} | landing:{slug} | promo:{slug} | custom:{slug}), title (display name for admin), description (optional), page_type (home | category | landing | promo | **custom**), status (draft | review | published — see STEP 3), **is_active** (boolean; storefront visibility — see STEP 5), published_version_id (nullable, FK page_versions; which version is live), published_at (nullable), created_at, updated_at. Optional: category_id (nullable, FK catalog_categories — for category pages, which category this page is for), **slug** (URL segment for user-created and landing pages; unique among routable pages), **path_prefix** (optional; e.g. `p`, `landing`, `promo` — full public path = `/{path_prefix}/{slug}` when page_type is custom/landing/promo). SEO fields — see STEP 5.
- **Relationship:** pages have many page_versions; pages have many page_blocks (or page_blocks belong to a version: see below). For **category pages:** page_key = `category:{catalog_category.slug}`; optional category_id for quick lookup. For **landing / promo:** page_key = `landing:{slug}` or `promo:{slug}`; slug is URL path (e.g. `/promo/summer-sale` → promo:summer-sale). **Home:** page_key = `home`, one row.

### 1.2 page_versions

- **Responsibility:** A **snapshot** of a page’s content (blocks and optional metadata) at a point in time. Enables draft vs published: editors work on a version; when approved, that version becomes the published one. Also enables history and rollback.
- **Columns (conceptual):** id, page_id (FK pages), version_number (int; auto-increment per page), status (draft | review | published), created_at, created_by (nullable, user_id), published_at (nullable), published_by (nullable, user_id). Optional: note (e.g. “Summer refresh”). When status = published, pages.published_version_id = this id and pages.published_at = published_at.
- **Relationship:** page_versions.page_id → pages. page_blocks belong to a **version** (page_blocks.version_id → page_versions) so that each version has its own set of blocks. Alternatively, page_blocks belong to page_id and version_id is nullable (draft blocks on version_id = null or on a dedicated “draft” version). Recommended: **page_blocks.version_id** → page_versions; so “edit page” loads the draft version’s blocks; “publish” copies draft to a new version and sets it as published, or marks the draft version as published.

### 1.3 page_blocks

- **Responsibility:** One **block** in a page version. Mirrors the constructor’s **BlockConfig**: block type (same string as in blockRegistry), order, and settings (JSON). The frontend can render the page by loading the published version’s page_blocks and passing each to blockRenderer (type + settings).
- **Columns (conceptual):** id, page_version_id (FK page_versions), block_type (string; e.g. HeroWithSlider, Bestsellers, PromoBanner), **sort_order** (int; **position on page** — ordering of blocks; see STEP 6), settings (JSON; title, initialCount, categorySlug, etc. — same shape as constructor block.settings), is_visible (boolean; default true), created_at, updated_at. Optional: block_label (for admin display), client_key (unique per version; stable id for editor undo/sync with constructor BlockConfig.id).
- **Relationship:** page_blocks.page_version_id → page_versions. One version has many page_blocks ordered by sort_order. **Integration with constructor:** block_type must be one of the types in the frontend blockRegistry; settings is the same structure as BlockConfig.settings so the same React section components can be used with CMS-driven props.

### 1.4 menus

- **Responsibility:** **Navigation menus** (header, footer, sidebar). Each menu has a key (e.g. `header`, `footer`, `mobile_bottom`) and many menu items. Menu items can link to a URL, a category (catalog_category_id), a page (page_id or page_key), or a custom path.
- **Columns (conceptual):** id, menu_key (unique, e.g. header, footer), name (display for admin), is_active, created_at, updated_at. **menu_items:** id, menu_id (FK menus), parent_id (nullable, FK menu_items; for nested items), label (text), link_type (url | category | page | custom), link_target (URL string, or category_id, or page_id, or path), sort_order, is_visible, created_at, updated_at. Optional: open_in_new_tab, icon.
- **Relationship:** menus have many menu_items; menu_items can have children (parent_id). Frontend fetches menu by menu_key and builds nav; link_type drives href (e.g. /category/{slug}, /landing/{slug}, or external URL).

### 1.5 banners

- **Responsibility:** **Standalone banners** (e.g. top strip, popup, sidebar) that can be shown on multiple pages or globally. Not part of the block canvas; they are placed by slot/key (e.g. `top_strip`, `home_sidebar`). Content: image, link, text, dates for scheduling.
- **Columns (conceptual):** id, banner_key (e.g. top_strip, popup_1), name (admin), type (image | html | video), content (JSON: image_url, link_url, alt_text, headline, cta_text; or html snippet; or video_url), placement (global | home | category | landing | custom), placement_scope (JSON: page_keys or category_ids when placement = custom), starts_at, ends_at (nullable; schedule), is_active, sort_order, created_at, updated_at. Optional: device_visibility (desktop | mobile | all), click_tracking_url.
- **Relationship:** Banners are independent; frontend requests “banners for this page/slot” (e.g. GET /api/cms/banners?placement=home&slot=top_strip) and filters by placement_scope, starts_at/ends_at, is_active. One banner_key can have multiple banners (e.g. rotation) with different sort_order or schedule.

### 1.6 Entity Relationship

```
pages (page_key, page_type, status, published_version_id)
    └──► page_versions (page_id, version_number, status)
              └──► page_blocks (page_version_id, block_type, sort_order, settings)

menus (menu_key)
    └──► menu_items (menu_id, parent_id, label, link_type, link_target, sort_order)

banners (banner_key, placement, placement_scope, starts_at, ends_at)
```

### 1.7 What Powers Which Route

- **Home page (/):** Page with page_key = `home`. Frontend loads published version’s page_blocks; renders with blockRenderer. If no CMS page exists, fallback to hardcoded home (current behavior).
- **Category page (/category/:slug):** Page with page_key = `category:{slug}` (or page_type = category and slug/category_id). If present and published, render that version’s page_blocks (e.g. category-specific hero + product grid); otherwise fallback to default category template (e.g. CategoryPage with standard layout).
- **Landing page (/landing/:slug or /p/:slug):** Page with page_key = `landing:{slug}`. Full block layout from CMS.
- **Promo page (/promo/:slug):** Page with page_key = `promo:{slug}`. Same as landing; type promo for reporting/filtering.
- **Custom / additional CMS pages (/p/:slug or chosen prefix):** Page with page_type = **custom** (or landing), **slug** + **path_prefix**; created via admin; **page_key** e.g. `custom:{slug}`. Full block layout from CMS; see STEP 5.
- **Menus:** Header/footer fetch menus by menu_key and render links (category, page, URL).
- **Banners:** Fetched by placement and optional page_key/category; rendered in slots (top strip, sidebar, popup).

---

## STEP 2 — BLOCK SYSTEM

### 2.1 Block Registry (Alignment with Constructor)

- The **block registry** is the list of block types the platform supports. In the current frontend it lives in **blockRegistry** (constructor): each entry has type, label, category, icon, defaultSettings. The **CMS does not duplicate** this list; it stores only **block_type** and **settings** in page_blocks. Valid block_type values are those defined in the registry (e.g. HeroWithSlider, Bestsellers, PromoBanner, CategorySliderSection). Backend can expose a **block registry API** (e.g. GET /api/cms/blocks) that returns the same list (or a subset) so that the CMS admin UI and the constructor use the same types and default settings. Registry can be backend-driven (table block_types) or frontend-driven (API returns config from app); for consistency with existing constructor, **frontend blockRegistry remains source of truth** for type names and defaultSettings; CMS stores block_type string and settings JSON.

### 2.2 Block Configuration (settings)

- Each block type has a **settings** shape: e.g. title, initialCount, categorySlug, imageUrl. This is the same as **BlockConfig.settings** in the constructor. When saving a page version, page_blocks.settings is stored as JSON. When rendering:
  - Frontend loads published version’s page_blocks (ordered by sort_order).
  - For each row: block_type + settings are passed to **blockRenderer** (same as constructor Canvas). blockRenderer maps block_type to the React section component and passes settings as props. So **no backend change** to block semantics; only persistence and versioning are added.
- **Schema for settings:** Optional: backend can store a **block_type_schema** (JSON Schema or key-value) per block_type for validation and admin UI (e.g. “Bestsellers” has title string, initialCount number). If not present, admin/constructor rely on frontend defaultSettings and free-form JSON.

### 2.3 Block Types and Data Sources

- Many blocks **fetch data** (products, categories) from the catalog API. In the constructor, sections use mock data or marketplaceData. When a block is used on a **CMS-driven page**, settings can include:
  - **data_source:** e.g. “bestsellers”, “category”, “featured”.  
  - **category_slug:** for category-scoped blocks (product grid for that category).  
  - **product_ids** or **collection_id:** for curated blocks.  
  - **limit:** number of items.  
  Frontend blockRenderer (or each section) reads settings and calls publicApi (categoryProducts, product, etc.) when rendering. CMS only stores these settings; it does not store the actual product list (that is live from catalog). So **block configuration** = block_type + settings (including data source and limits); **block rendering** = same section component + API call using those settings.

### 2.4 Block Registry API (Optional Backend)

- **block_types table (optional):** id, type (string, unique), label, category, default_settings (JSON), schema (JSON optional), is_active, sort_order. Populated from or synced with frontend blockRegistry so that:
  - CMS admin can list “available blocks” and their default settings without depending on frontend build.
  - Validation: page_blocks.settings can be validated against schema when saving.
- If **no** block_types table: CMS admin and constructor both use the same static list (e.g. from frontend config or shared package); page_blocks only store type + settings and frontend is the single source of truth for “what block types exist.”

### 2.5 Summary

- **Block registry:** Same types as constructor blockRegistry (hero, products, categories, banners, video, quiz, cta, etc.). Backend may expose GET /api/cms/blocks or rely on frontend.
- **Block configuration:** page_blocks.block_type (string), page_blocks.settings (JSON). Rendered by existing blockRenderer with same section components; settings drive props and data source (API calls).
- **No new block runtime:** CMS adds **storage and versioning** of (block_type, settings, order); rendering stays in the frontend constructor block system.

---

## STEP 3 — PUBLISH WORKFLOW

### 3.1 States

- **draft:** The version (or page) is being edited. Not visible on the storefront. Only one draft version per page at a time (or “current draft” is the latest version with status = draft).
- **review:** The version has been submitted for approval. Optional state so reviewers (e.g. editor or admin) can see “pending” content before it goes live. Not visible on the storefront unless “preview” link with token.
- **published:** The version is live. For a given page, only **one** version is published at a time: pages.published_version_id points to that version. Storefront always loads the published version’s page_blocks.

### 3.2 Transitions

- **draft → review:** Editor submits for review (e.g. “Submit for review”). Version status = review. Optional: notify reviewers, or create task in CRM.
- **review → draft:** Reviewer rejects or requests changes; version goes back to draft. Optional: comment or task.
- **review → published:** Reviewer approves. Version status = published; set pages.published_version_id = this version, pages.published_at = now, pages.status = published. Optional: pages.published_by = user_id. Previous published version (if any) remains in DB with status = published but is no longer referenced by published_version_id (or set previous to status = archived).
- **draft → published:** If no review step, direct publish: version status = published, pages.published_version_id = this version, pages.published_at, pages.status = published.
- **published → draft (rollback):** Admin “unpublishes” or “revert to previous version.” Set pages.published_version_id to another version (or null); optionally create a new draft from current published for editing. Or: new version created as draft from last published; after edit, that version is published (replacing current).

### 3.3 Versioning Rules

- **One draft per page:** When editor “edits” a page, they edit the **draft** version. If no draft exists, create a new version (version_number = max+1) with status = draft and copy blocks from published version (or empty). All edits (add/remove/reorder blocks, change settings) apply to that draft version (page_blocks for that version_id).
- **Publish = make that version live:** Publishing sets that version as the one referenced by pages.published_version_id. Storefront always reads page_blocks where page_version_id = published_version_id.
- **History:** Old versions (including previously published) are kept with their status (published → archived or kept as published). Rollback = set published_version_id to an older version_id.

### 3.4 Optional: Preview and Scheduling

- **Preview:** Draft or review versions can be viewed via a **preview link** with a token (e.g. /preview?token=xxx&page=home). Backend resolves token to version_id and returns that version’s blocks; no auth required for link holder or with short-lived token.
- **Scheduling:** Optional: version has scheduled_publish_at; a job sets status = published and pages.published_version_id at that time. Similarly scheduled_unpublish_at to revert to a previous version or blank.

---

## STEP 4 — FINAL DOCUMENT (Summary)

### 4.1 Content Entities (Recap)

| Entity | Purpose |
|--------|---------|
| **pages** | Content page: home, category, landing, promo, **custom**. Identified by page_key; **slug**, **path_prefix**, **is_active**; has status and published_version_id; **SEO** fields (STEP 5). |
| **page_versions** | Snapshot of page content; status draft | review | published. One published version per page. |
| **page_blocks** | Blocks in a version: block_type, **sort_order (position)**, settings (JSON). Same types as constructor; rendered by blockRenderer; reorder = change sort_order (STEP 6). |
| **menus** | Navigation menus (header, footer); menu_items with link_type (url, category, page). |
| **banners** | Standalone banners by slot; placement, schedule, content (image/html/video). |

### 4.2 What Powers Which Page

- **Home:** page_key = `home`; published version’s page_blocks rendered with blockRenderer. Fallback: current hardcoded Index.tsx if no CMS page.
- **Category:** page_key = `category:{slug}`; optional category-specific layout; fallback: default category template.
- **Landing / Promo:** page_key = `landing:{slug}` or `promo:{slug}`; full block layout from CMS.
- **Menus:** Fetched by menu_key; links to categories, pages, URLs.
- **Banners:** Fetched by placement/slot and page context; rendered in global or page slots.

### 4.3 Block System (Recap)

- **Block registry:** Same as constructor blockRegistry (type, label, category, defaultSettings). Backend may expose block list or block_types table; frontend remains source of truth for component mapping.
- **Block configuration:** page_blocks store block_type (string) and settings (JSON). Frontend blockRenderer maps type → section component and passes settings; sections use settings for data source (e.g. categorySlug, limit) and call catalog API. **Full integration:** Constructor can “save to CMS” (create/update draft version and page_blocks) and “load from CMS” (load page by key and populate canvas); storefront fetches published version and renders same blocks.

### 4.4 Publish Workflow (Recap)

- **draft** → editing; **review** → submitted for approval; **published** → live (pages.published_version_id). Transitions: draft → review → published; review → draft; draft → published (shortcut). One draft version per page; publish sets that version as live; history kept for rollback.

### 4.5 Dependencies

- **Catalog:** category pages may reference catalog_categories (slug, category_id). Blocks may reference category_slug or product data from catalog API.
- **Identity:** created_by, published_by (user_id) for audit; roles for who can edit vs publish (optional).
- **Frontend:** blockRegistry, blockRenderer, BlockConfig types and categories. Same section components used on constructor canvas and on CMS-driven storefront pages.

### 4.6 Indexing (Conceptual)

- **pages:** (page_key unique), (page_type), (status), (published_version_id).
- **page_versions:** (page_id), (status), (version_number).
- **page_blocks:** (page_version_id), (sort_order).
- **menus:** (menu_key unique).
- **menu_items:** (menu_id), (parent_id), (sort_order).
- **banners:** (banner_key), (placement), (starts_at, ends_at), (is_active).

---

## STEP 5 — DYNAMIC PAGES, URL, ACTIVATION, SEO

This step extends **pages** so editors can **create additional layouts** (new templates) with **dedicated URLs**, toggle visibility without deleting content, and configure **SEO** per page. Aligns with storefront routes and reserved paths in the frontend router.

### 5.1 User-created pages and URL strategy

- **Goal:** Beyond fixed keys (`home`, `category:*`), allow **N new pages**, each with its own block composition (template instance), **created and added** over time via admin/CRM.
- **Identification:**
  - **page_key:** e.g. `custom:{slug}` or `landing:{slug}` — unique string in DB.
  - **slug:** URL-safe segment, unique among all pages that expose a public path (validate: lowercase, hyphens, no reserved words).
  - **path_prefix:** convention for public URL, e.g. `/p/:slug`, `/landing/:slug`, or `/promo/:slug`. One product decision: e.g. all **custom CMS pages** live under **`/p/:slug`** to avoid colliding with static app routes.
- **Frontend routing:** Register **one dynamic route** (e.g. `<Route path="/p/:slug" element={<CmsPage />} />`) **after** static routes, **before** `*`. `CmsPage` resolves `slug` → API `GET /api/v1/cms/pages/by-slug?path_prefix=p&slug=...` (or composite key) and renders published `page_blocks` with **blockRenderer**; 404 if missing or inactive.
- **Reserved paths:** Maintain a **deny list** synced with `App.tsx` (`/`, `/cart`, `/category`, `/product`, `/brand`, `/seller`, `/account`, `/person`, `/auth`, `/admin`, `/crm`, `/constructor`, `/payment`, `/faq`, `/about`, …) so new **slug** cannot equal a first path segment used by the app.
- **Creation API:** `POST /api/v1/cms/pages` with `{ page_type, slug, path_prefix, title }` creates a **pages** row and an initial **draft page_version** (optionally with empty or default `page_blocks`). Subsequent edits add blocks and reorder (STEP 6).

### 5.2 Activation and deactivation

- **`pages.is_active` (boolean, default true):**
  - **Active + published:** page is reachable at its public URL (if version is published).
  - **Inactive:** storefront returns **404** (or **410 Gone** if preferred for “delisted” content) even if `status = published` — useful for seasonal campaigns without losing drafts/history.
- **Combination for “live”:**  
  `is_active === true` **and** `status === published` **and** `published_version_id IS NOT NULL` **and** (optional) inside schedule window `published_starts_at` / `published_ends_at`.
- **Difference from draft:** `status = draft` means “not yet approved”; `is_active = false` means “intentionally off air” while content may still be published internally for preview.

### 5.3 SEO settings (per page)

Store on **pages** (or on **page_versions** if SEO must version with content — recommended: **pages** for canonical URL stability, **optional overrides** on version for A/B).

| Field | Use |
|--------|-----|
| **seo_title** | `<title>` and default OG title |
| **seo_description** | meta description |
| **og_title**, **og_description** | Overrides for Open Graph (fallback: seo_*) |
| **og_image_url** | Social preview image |
| **canonical_url** | Optional absolute URL override |
| **robots** | e.g. `index,follow` \| `noindex,nofollow` \| `noindex,follow` |
| **twitter_card** | optional: `summary_large_image` etc. |
| **structured_data** | optional JSON-LD blob (WebPage, BreadcrumbList) |

- **Frontend:** CMS-driven layout route wraps **react-helmet-async** (or similar) and sets tags from API response for each `/p/:slug` (and later home/category when CMS-backed).
- **Sitemap:** Only include pages where `is_active && published && robots` allows index.

### 5.4 Admin UX (brief)

- List pages: filters **type**, **is_active**, **status**, search by title/slug.
- Create page: wizard — title, slug, path prefix, template starter (empty / duplicate from existing).
- Page editor: blocks canvas (constructor), **SEO** side panel, toggles **Active**, **Publish**.

---

## STEP 6 — BLOCK ORDER (POSITION) AND MOVEMENT

Blocks in a template are **ordered**. The **position** is the single field **sort_order** on **page_blocks** (per **page_version**).

### 6.1 Rules

- **sort_order:** integer; lower values render **first** (top of page), or define convention as ascending order (document one convention and stick to it site-wide).
- **Gaps:** use increments of 10 (0, 10, 20, …) so a new block can be inserted between without renumbering all rows.
- **Uniqueness:** unique `(page_version_id, sort_order)` or enforce by renumbering after each change.

### 6.2 Moving blocks (editor and API)

- **Constructor / CRM UI:** drag-and-drop reorder (same as constructor **Canvas**); on save, persist new order as updated **sort_order** for each `page_block` id.
- **API:**
  - `PATCH .../page-versions/:id/blocks/reorder` with body `[{ "id": 1, "sort_order": 0 }, ...]`, or
  - Full replace: `PUT .../page-versions/:id/blocks` with ordered array (server assigns sort_order from index).
- **Conflict handling:** optimistic UI; server validates version is **draft** (or allowed role) before reorder.

### 6.3 Alignment with constructor **BlockConfig**

- Order of `blocks[]` in the constructor store **equals** display order; when saving to CMS, map array index → **sort_order** (or explicit positions).
- **BlockConfig.id** ↔ **page_blocks.client_key** (or map to DB id after first save) for stable references when updating settings.

### 6.4 Storefront rendering

- Query: `SELECT * FROM page_blocks WHERE page_version_id = ? ORDER BY sort_order ASC`.
- Pass to **blockRenderer** in that order; no secondary sort unless tie-breaking by `id`.

---

## IMPLEMENTATION PRINCIPLES — Flexible and evolvable (avoid unnecessary complexity)

These rules keep the system **easy to extend** (new block types, new page kinds, new locales) without locking into rigid schemas or duplicate sources of truth.

### P.1 Single pipeline: blocks always `type + settings + sort_order`

- **Do not** add bespoke DB columns per block type. Everything variable lives in **`settings` (JSON)** on `page_blocks`.
- **`settings` is an open object:** any keys (e.g. `title`, `categorySlug`, `dataSource`, `initialCount`, nested objects for filters). The same `block_type` on different pages can differ only by `settings`; reuse is by reference to **block_type**, not by row duplication in code.
- New marketing blocks = new React section + **blockRegistry** entry + rows in DB with new `block_type` string — **no migration** for each block.
- Optional later: JSON Schema per `block_type` for validation in admin — not required on day one.

### P.2 Versioning from the start (`page_versions`)

- Store content (blocks) on **versions**, not only on `pages`. Avoids a future painful migration when you need draft vs published or rollback.
- **pages** holds identity, URL, SEO flags, pointer **`published_version_id`**.

### P.3 URLs: composite, not one opaque path

- Use **`path_prefix` + `slug`** (and optional future **`locale`**) instead of a single free-form `path` string. Same page model supports `/p/`, `/landing/`, regional prefixes later without schema churn.

### P.4 `page_key` and `page_type` as open-ended strings

- Use **string** identifiers with a naming convention (`custom:…`, `landing:…`, `home`). Validation in application code, not ENUM-only in DB (or use ENUM only if you accept migrations when adding types — prefer **string + allowlist in code** for flexibility).

### P.5 SEO: minimal fixed columns + optional JSON

- Fixed columns for what search engines always need: **`seo_title`, `seo_description`, `robots`** (and optionally **og_image_url**).
- Put rare or experimental tags in **`seo_extra` JSON** (hreflang, alternate, custom meta) to extend without migrations.

### P.6 Block types: one registry, no drift

- **Source of truth:** frontend **`blockRegistry`** (type names + default settings) until you introduce a synced `block_types` table.
- Backend validates `block_type` against **the same list** (shared export, CI check, or GET `/api/cms/block-registry` generated at build). **Never** maintain two independent lists by hand.

### P.7 API shape: resources, not RPC soup

- Prefer **`/cms/pages`**, **`/cms/pages/{id}/versions`**, **`/cms/page-versions/{id}/blocks`** with clear REST verbs. Easier to cache, document, and extend than dozens of custom endpoints.

### P.8 Storefront: one loader, one renderer

- **One** public route component (e.g. `CmsDynamicPage`) loads layout JSON and renders **`blockRenderer`** in **`sort_order`** order. Home/category CMS later = same code path with different `page_key` resolution — **no second templating engine**.

### P.9 Reserved slugs and collisions

- Keep **reserved first segments** in **one config** (Laravel `config/cms.php` + mirror constant in frontend router) so adding a new static route updates one list. Validate new slugs against it server-side.

### P.10 Activation vs lifecycle

- **`is_active`**: quick on/off (merchandising). **`status` + versions**: editorial workflow. Do not merge into one flag — avoids “unpublish” hacks later.

### P.11 What to defer (on purpose)

- **Scheduling** (`publish_at`), **A/B versions**, **per-locale body** — add when needed; the model above does not block them (extra columns or child tables).
- **WYSIWYG HTML pages** — if needed, add block type `HtmlBlock` with `settings.html` rather than a parallel “HTML page” system.

---

## STEP 7 — UPDATED RECAP (entities + new concerns)

| Concern | Mechanism |
|---------|-----------|
| **New URLs / templates** | `pages` with `slug` + `path_prefix`; dynamic route `/p/:slug` (or chosen prefix); `page_key` e.g. `custom:{slug}`. |
| **Activation** | `pages.is_active`; live = active + published + version. |
| **SEO** | seo_*, og_*, canonical, robots on `pages` (and/or version). |
| **Block position** | `page_blocks.sort_order`; reorder API + constructor drag-drop. |

---

*End of CMS Content Architecture.*

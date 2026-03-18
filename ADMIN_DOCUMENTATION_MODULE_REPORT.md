# Admin Documentation Module Report

**Date:** 05.03.2025  
**Route:** /admin/docs

---

## Summary

Created documentation page in admin panel with structured sections for all features: purpose, configuration, parser impact, and usage examples.

---

## Structure

| Section | Content |
|---------|---------|
| Dashboard | Overview, product stats, system status indicators |
| Parser | Parse with photos, Save to DB, Preview mode, category/product/page limits |
| Categories | enabled, linked_to_parser, parser_products_limit, parser_max_pages, parser_depth_limit |
| Products | List, filters, bulk actions, parser relation |
| Sellers | List, detail, seller parsing and linking |
| Brands | Catalog, category linkage |
| Filters | Attribute creation, parser extraction from characteristics |
| Exceptions | Remove word vs Reject product (delete/replace vs hide/flag) |
| AI Module | AI content processing |
| Logs | Event journal, filters, job_id |
| System monitoring | Parser status, Queue workers, Redis, WebSocket, CPU, Memory, Disk |

---

## Each Section Explains

1. **What the feature does** — purpose and scope
2. **How to configure it** — settings, filters, options
3. **How it affects parser** — impact on parsing workflow
4. **Example usage** — typical scenarios

---

## Parser Section

- **Parse with photos** — download and save product images
- **Save to DB** — write products to database (vs preview only)
- **Preview mode** — run without saving
- **Category filtering** — parse specific category
- **Product limits** — parser_products_limit per category
- **Page limits** — parser_max_pages per category

---

## Categories Section

| Field | Description |
|-------|-------------|
| enabled | Category visible on site |
| linked_to_parser | Include in parser runs |
| parser_products_limit | Max products to parse (0 = no limit) |
| parser_max_pages | Max pagination pages (0 = no limit) |
| parser_depth_limit | Depth for subcategory traversal |

---

## Filters Section

- Attributes are created by the parser from product characteristics on donor pages
- Saved to `product_attributes`
- Filters use `attr_name` to match attribute keys
- Display types: checkbox, select, radio, range

---

## Exceptions Section

| Action | Effect |
|--------|--------|
| **Remove word** (delete/replace) | Remove or replace text in title/description. Product stays in catalog. |
| **Reject product** (hide/flag) | Product hidden or flagged. Status becomes excluded. Not shown on site. |

---

## Sellers Section

- Sellers extracted during product page parsing
- Parser saves seller block (avatar, name, slug, pavilion, source_url) and links products via seller_id
- Requires `saveDetails: true` and Save to DB

---

## System Section (Dashboard Indicators)

| Indicator | Source | Description |
|-----------|--------|-------------|
| Parser status | parser_jobs (running/pending) | Работает / Остановлен |
| Queue workers | Supervisor | parser-worker, parser-worker-photos count |
| Redis | Connection check | Queue and cache driver |
| WebSocket | Reverb | Real-time parser events |
| CPU / Memory | Server metrics | Load and usage |
| Disk | disk_total, disk_used, disk_free | GB usage |

---

## Navigation

- **Menu item:** Documentation (BookOpen icon)
- **Position:** After Logs, before Users
- **URL:** /admin/docs

---

## Files

- `src/admin/pages/DocsPage.tsx` — documentation page with collapsible sections
- `src/admin/components/AdminSidebar.tsx` — added Documentation + Store import fix
- `src/App.tsx` — route /admin/docs
